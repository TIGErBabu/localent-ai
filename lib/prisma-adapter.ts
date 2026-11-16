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
// off hydrate(): it dynamically loads PrismaClient (no static @prisma/client
// import, so builds stay green before `prisma generate`), findMany's all 19
// models, converts them via rowsToStoreData(), and swaps the cache (which
// starts as an empty StoreData skeleton). `ready` resolves when hydration
// finishes — successfully or not.
//
// KNOWN LIMITATIONS:
//  • Mutations made through data() (push / in-place edits, exactly how the
//    demo adapter is used) live only in the cache until flush() is called.
//    Nothing is written back automatically; mutating callers `await
//    adapter.flush()` when they are done (wired in app/actions.ts, the
//    mutating API routes, the Stripe webhook, and lib/auth.ts sessions).
//  • flush() is a full rewrite, not a diff: it deleteMany's every table in
//    reverse-FK order and re-creates every cached row in FK order (via
//    createMany). That keeps the logic trivially correct for this app's
//    scale, but it is NOT transactional across models and assumes a single
//    writer process — concurrent processes flushing will last-writer-win.
//    Ids are written back with an identity map: rows hydrated from the DB
//    already carry UUID ids, and rows created at runtime carry UUID ids too
//    (lib/utils.ts uid() returns crypto.randomUUID()).
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
  createPrismaClient,
  DELEGATE_BY_KEY,
  DELETE_ORDER,
  emptyStoreData,
  MODEL_ORDER,
  rowsToStoreData,
  storeToPrismaPayloads,
  type PrismaClientLike,
  type StoreKey,
} from "./prisma-mapping";

export class PrismaDataAdapter implements DataAdapter {
  private cache: StoreData = emptyStoreData();
  private client: PrismaClientLike | null = null;

  /** Resolves once the initial hydrate() attempt has finished. */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.hydrate();
  }

  /** Synchronous cache access — the DataAdapter contract. */
  data(): StoreData {
    return this.cache;
  }

  private async hydrate(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      console.warn(
        "[localent] PrismaDataAdapter: DATABASE_URL is not set — serving an empty store. " +
          "Set DATABASE_URL, run `npx prisma generate` + migrate, and set DATA_ADAPTER=prisma to go live.",
      );
      return;
    }
    try {
      const client = await createPrismaClient();
      const entries = await Promise.all(
        MODEL_ORDER.map(
          async (key): Promise<[StoreKey, Record<string, unknown>[]]> => [
            key,
            await client[DELEGATE_BY_KEY[key]].findMany(),
          ],
        ),
      );
      const rows: Record<string, unknown[]> = {};
      for (const [key, modelRows] of entries) rows[key] = modelRows;
      this.cache = rowsToStoreData(rows);
      this.client = client;
    } catch (err) {
      console.warn(
        "[localent] PrismaDataAdapter: hydrate failed — serving an empty store. " +
          "Check DATABASE_URL and that `npx prisma generate` has run.",
        err,
      );
      this.client = null;
    }
  }

  /**
   * Write the whole cache back to Postgres: deleteMany every model in
   * reverse-FK order (children first, so no FK violations), then createMany
   * every cached row in FK order. Ids go through an identity map — the DB
   * already stores UUIDs. Throws if the adapter never connected, so a lost
   * write is loud instead of silent.
   */
  async flush(): Promise<void> {
    await this.ready;
    if (!this.client) {
      // Hydration failed at boot (e.g. the database was briefly unreachable).
      // flush() is the recovery path: retry hydration once here rather than
      // leaving data() permanently poisoned by the failed first attempt.
      await this.hydrate();
    }
    if (!this.client) {
      throw new Error(
        "PrismaDataAdapter.flush(): not connected (hydrate did not succeed) — cache was NOT persisted.",
      );
    }
    const client = this.client;
    const payloads = storeToPrismaPayloads(this.cache, (id) => id);
    for (const key of DELETE_ORDER) {
      await client[DELEGATE_BY_KEY[key]].deleteMany();
    }
    for (const key of MODEL_ORDER) {
      const data = payloads[key];
      if (data.length > 0) {
        await client[DELEGATE_BY_KEY[key]].createMany({ data });
      }
    }
  }

  /** Close the underlying PrismaClient connection pool, if connected. */
  async disconnect(): Promise<void> {
    await this.ready;
    if (this.client) {
      await this.client.$disconnect();
      this.client = null;
    }
  }
}
