// ─── Prisma-backed DataAdapter ───────────────────────────────────────────────
// Production implementation of the DataAdapter interface from lib/store.ts,
// backed by PrismaClient against Postgres (Supabase) using
// prisma/schema.prisma. All row ⇄ StoreData conversion lives in
// lib/prisma-mapping.ts; this file only owns the client lifecycle, the
// in-memory cache, and flush().
//
// ACTIVATION (not wired into lib/store.ts by this file — the swap is a
// one-line change there once the database exists):
//   1. Provision Postgres (Supabase) and set DATABASE_URL (+ DIRECT_URL).
//   2. Run `npx prisma generate` and apply the schema
//      (`npx prisma migrate deploy`, or `npx prisma db push` pre-launch).
//   3. Optionally load the fictional demo seed: `npx tsx prisma/seed.ts`.
//   4. Set DATA_ADAPTER=prisma and serve `new PrismaDataAdapter()` from
//      lib/store.ts instead of the InMemoryAdapter; await `adapter.ready`
//      before handling requests that must see database state.
//
// HOW IT WORKS: the DataAdapter contract is synchronous (`data(): StoreData`)
// while Prisma is async, so this adapter keeps a full StoreData cache in
// memory — the same access pattern the demo adapter uses, which is what all
// routes/helpers in lib/store.ts are written against. The constructor kicks
// off hydrate(): it constructs PrismaClient via createPrismaClient() (a
// static @prisma/client import in lib/prisma-mapping.ts, so Next.js file
// tracing ships the package in serverless bundles), findMany's all 19
// models (in small batches, to stay within the pooler's connection
// limit), converts them via rowsToStoreData(), and swaps the cache (which
// starts as an empty StoreData skeleton). hydrate() itself retries
// transient pooler failures up to 3 attempts with backoff before giving
// up. `ready` resolves when hydration finishes — successfully or not;
// `hydratedOk` records which of the two it was, and ensureReady() retries
// hydration on demand when it failed.
//
// KNOWN LIMITATIONS:
//  • Mutations made through data() (push / in-place edits, exactly how the
//    demo adapter is used) live only in the cache until flush() is called.
//    Nothing is written back automatically; mutating callers `await
//    adapter.flush()` when they are done (wired in app/actions.ts, the
//    mutating API routes, the Stripe webhook, and lib/auth.ts sessions).
//  • flush() is a SNAPSHOT DIFF, never a full rewrite: hydrate() keeps a
//    deep snapshot of the store it loaded, and flush() upserts only rows
//    that are new or changed relative to that snapshot and deletes only
//    rows this instance itself removed (see computeStoreDiff in
//    lib/prisma-mapping.ts), all inside one $transaction. A warm instance
//    holding a stale snapshot therefore cannot revert rows it never
//    touched or delete rows created after it hydrated — the failure mode
//    of the previous full-rewrite flush, which deleteMany'd all 19 tables
//    and re-created the instance's whole cache, so a login-triggered flush
//    from a pre-acceptance instance resurrected OPEN/PENDING job/bid state
//    and wiped the schedule and check-in evidence in production. The one
//    remaining hazard is inherent to the cache architecture: if an
//    instance mutates a row based on stale contents, its version of THAT
//    row wins — the blast radius is now the rows actually touched, not
//    the whole database. Ids are written back with an identity map: rows
//    hydrated from the DB already carry UUID ids, and rows created at
//    runtime carry UUID ids too (lib/utils.ts uid() returns
//    crypto.randomUUID()).
//  • JobPost.completionCode (demo-only plaintext) is never persisted — only
//    completionCodeHash reaches the database, and hydrated jobs always read
//    completionCode: null. See lib/prisma-mapping.ts.
//  • If DATABASE_URL is unset, or the client cannot be loaded/generated,
//    hydrate() logs a warning and leaves the empty skeleton in place rather
//    than crashing the process; data() then serves empty collections and
//    flush() throws, so lost writes are never silent.

import type { StoreData } from "./types";
import type { DataAdapter } from "./store";
import {
  computeStoreDiff,
  createPrismaClient,
  DELEGATE_BY_KEY,
  DELETE_ORDER,
  emptyStoreData,
  MODEL_ORDER,
  rowIdField,
  rowsToStoreData,
  type PrismaClientLike,
  type StoreKey,
} from "./prisma-mapping";

/** Deep copy of a StoreData (plain JSON-shaped data; Dates never appear). */
function deepCopyStore(data: StoreData): StoreData {
  return typeof structuredClone === "function"
    ? structuredClone(data)
    : (JSON.parse(JSON.stringify(data)) as StoreData);
}

export class PrismaDataAdapter implements DataAdapter {
  private cache: StoreData = emptyStoreData();
  // Deep snapshot of the cache as hydrate() loaded it (later: as the last
  // successful flush() wrote it). flush() diffs the live cache against
  // this snapshot and writes only the difference, so rows this instance
  // never touched are never rewritten.
  private snapshot: StoreData = emptyStoreData();
  private client: PrismaClientLike | null = null;
  // Injectable for tests; production uses the real client factory.
  private readonly clientFactory: () => Promise<PrismaClientLike>;
  // True only once a hydrate() has run to completion. Tracked separately
  // from `client`: a client can exist while its first queries timed out
  // (observed in production — pool timeout during the parallel hydrate),
  // and keying recovery off client presence alone left such an instance
  // serving the empty skeleton for its whole lifetime.
  private hydratedOk = false;

  /** Resolves once the initial hydrate() attempt has finished. */
  readonly ready: Promise<void>;

  constructor(
    clientFactory: () => Promise<PrismaClientLike> = createPrismaClient,
  ) {
    this.clientFactory = clientFactory;
    this.ready = this.hydrate();
  }

  /** Synchronous cache access — the DataAdapter contract. */
  data(): StoreData {
    return this.cache;
  }

  /**
   * Retry hydration if it has never succeeded. Read-critical paths (login,
   * registration) await this before trusting data(), so one bad boot-time
   * hydrate — e.g. a transient pool timeout — no longer poisons the
   * instance permanently.
   */
  async ensureReady(): Promise<void> {
    await this.ready;
    if (!this.hydratedOk) {
      await this.hydrate();
    }
  }

  /**
   * Hydrate the cache from Postgres, retrying transient failures with
   * backoff: up to 3 attempts total (immediate, +400ms, +1200ms). The
   * free-tier transaction pooler refuses connections intermittently under
   * serverless cold-start load (P1001 "can't reach database server",
   * observed in production), and a single failed attempt otherwise leaves
   * the instance serving the empty skeleton until some read-critical path
   * calls ensureReady(). Retrying
   * inside hydrate() itself means the boot attempt — and every
   * ensureReady() retry — rides out a brief pooler blip on its own.
   * Only the final failure is logged, so one blip doesn't spam the logs
   * with three warnings.
   */
  private async hydrate(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      console.warn(
        "[localent] PrismaDataAdapter: DATABASE_URL is not set — serving an empty store. " +
          "Set DATABASE_URL, run `npx prisma generate` + migrate, and set DATA_ADAPTER=prisma to go live.",
      );
      return;
    }
    const BACKOFF_MS = [400, 1200];
    let lastErr: unknown;
    for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS[attempt - 1]));
      }
      const err = await this.hydrateOnce();
      if (err === null) return;
      lastErr = err;
    }
    console.warn(
      "[localent] PrismaDataAdapter: hydrate failed — serving an empty store. " +
        "Check DATABASE_URL and that `npx prisma generate` has run.",
      lastErr,
    );
    this.client = null;
    this.hydratedOk = false;
  }

  /** One hydration attempt. Resolves null on success, the error on failure. */
  private async hydrateOnce(): Promise<unknown> {
    let client: PrismaClientLike | null = null;
    try {
      client = await this.clientFactory();
      // Limited concurrency: firing all 19 findMany calls at once can
      // exhaust the Supabase pooler's small connection limit and time out
      // fetching a connection (observed in production logs), so hydrate in
      // batches of 4.
      const rows: Record<string, unknown[]> = {};
      const BATCH_SIZE = 4;
      for (let i = 0; i < MODEL_ORDER.length; i += BATCH_SIZE) {
        const entries = await Promise.all(
          MODEL_ORDER.slice(i, i + BATCH_SIZE).map(
            async (key): Promise<[StoreKey, Record<string, unknown>[]]> => [
              key,
              await client![DELEGATE_BY_KEY[key]].findMany(),
            ],
          ),
        );
        for (const [key, modelRows] of entries) rows[key] = modelRows;
      }
      this.cache = rowsToStoreData(rows);
      // The diff baseline for future flushes: exactly what was loaded.
      this.snapshot = deepCopyStore(this.cache);
      this.client = client;
      this.hydratedOk = true;
      return null;
    } catch (err) {
      // Disconnect the failed attempt's client so its pool doesn't linger
      // and add pressure on the pooler before the next retry.
      if (client) {
        try {
          await client.$disconnect();
        } catch {
          /* best effort — the connection may never have opened */
        }
      }
      this.client = null;
      this.hydratedOk = false;
      return err;
    }
  }

  /**
   * Persist this instance's changes to Postgres as a snapshot diff: diff
   * the live cache against the snapshot taken at hydrate() (or at the last
   * successful flush), then in ONE $transaction delete the rows this
   * instance removed (children first, reverse-FK order) and upsert the
   * rows it created or changed (FK order). Rows absent from both the
   * snapshot and the diff — including everything other instances wrote
   * after this one hydrated — are never touched. On success the snapshot
   * advances to the current cache; on failure it stays put, so a retry
   * re-attempts the same diff. Throws if the adapter never connected, so
   * a lost write is loud instead of silent.
   */
  async flush(): Promise<void> {
    // flush() is also a recovery path: ensureReady() retries hydration when
    // it never succeeded (the old condition keyed off `client === null`,
    // which missed the case where the client exists but its hydrate queries
    // timed out).
    await this.ensureReady();
    if (!this.client) {
      throw new Error(
        "PrismaDataAdapter.flush(): not connected (hydrate did not succeed) — cache was NOT persisted.",
      );
    }
    const client = this.client;
    const diff = computeStoreDiff(this.snapshot, this.cache);
    const ops: PromiseLike<unknown>[] = [];
    for (const key of DELETE_ORDER) {
      const { deleteIds } = diff[key];
      if (deleteIds.length === 0) continue;
      const field = rowIdField(key);
      ops.push(
        client[DELEGATE_BY_KEY[key]].deleteMany({
          where: { [field]: { in: deleteIds } },
        }),
      );
    }
    for (const key of MODEL_ORDER) {
      const field = rowIdField(key);
      for (const payload of diff[key].upserts) {
        ops.push(
          client[DELEGATE_BY_KEY[key]].upsert({
            where: { [field]: payload[field] },
            create: payload,
            update: payload,
          }),
        );
      }
    }
    if (ops.length > 0) {
      await client.$transaction(ops);
    }
    this.snapshot = deepCopyStore(this.cache);
  }

  /** Close the underlying PrismaClient connection pool, if connected. */
  async disconnect(): Promise<void> {
    await this.ready;
    if (this.client) {
      await this.client.$disconnect();
      this.client = null;
      this.hydratedOk = false;
      this.snapshot = emptyStoreData();
    }
  }
}
