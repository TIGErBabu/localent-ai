// ─── Regression tests: Prisma adapter snapshot-diff flush ───────────────────
// Run with: npx tsx tests/prisma-flush.test.ts
//
// Guards the production data-corruption bug fixed by the snapshot-diff
// flush: the old flush() deleteMany'd all 19 tables and re-created the
// flushing instance's entire cache, so a warm serverless instance holding
// a stale (pre-acceptance) snapshot reverted an accepted job/bid and wiped
// the schedule, evidence and milestones the next time ANY mutation on that
// instance flushed — including a bare login/logout (lib/auth.ts flushes on
// session issuance/revocation).
//
// Three parts:
//  1. Unit tests of the pure diff (computeStoreDiff).
//  2. A two-instance scenario over a shared fake Prisma client: instance A
//     hydrates before acceptance; instance B accepts + funds + schedules
//     and flushes; instance A then flushes an unrelated session mutation.
//     B's state must survive A's flush untouched.
//  3. Freshness: ensureReady() re-hydrates after the TTL so an instance
//     sees rows created after it booted (the stale-snapshot action
//     swallow), while never erasing unflushed mutations.

import { PrismaDataAdapter } from "../lib/prisma-adapter";
import {
  computeStoreDiff,
  DELEGATE_BY_KEY,
  emptyStoreData,
  rowIdField,
  type PrismaClientLike,
  type PrismaDelegate,
  type Row,
  type StoreKey,
} from "../lib/prisma-mapping";
import type { StoreData } from "../lib/types";

// The adapter refuses to hydrate without a DATABASE_URL; the fake factory
// below means it is never actually used to connect.
process.env.DATABASE_URL = "postgresql://fake.invalid:5432/fake";

// ─── Tiny assertion harness ──────────────────────────────────────────────────

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ok — ${name}`);
  } else {
    failures++;
    console.error(`  FAIL — ${name}${detail ? ` (${detail})` : ""}`);
  }
}

// ─── Fake Prisma client over shared in-memory tables ─────────────────────────

function cloneValue(v: unknown): unknown {
  if (v instanceof Date) return new Date(v.getTime());
  if (Array.isArray(v)) return v.map(cloneValue);
  if (v !== null && typeof v === "object") {
    const out: Row = {};
    for (const [k, val] of Object.entries(v as Row)) out[k] = cloneValue(val);
    return out;
  }
  return v;
}
const cloneRow = (r: Row): Row => cloneValue(r) as Row;

class FakePrisma {
  tables = new Map<string, Map<string, Row>>();
  transactionCount = 0;
  writeCount = 0; // executed upserts + deletes + creates

  constructor() {
    for (const delegateKey of Object.values(DELEGATE_BY_KEY)) {
      this.tables.set(delegateKey, new Map());
    }
  }

  seed(delegateKey: string, idField: string, row: Row) {
    this.tables.get(delegateKey)!.set(String(row[idField]), cloneRow(row));
  }

  get(delegateKey: string, id: string): Row | undefined {
    const row = this.tables.get(delegateKey)!.get(id);
    return row ? cloneRow(row) : undefined;
  }

  count(delegateKey: string): number {
    return this.tables.get(delegateKey)!.size;
  }

  private delegate(delegateKey: string, idField: string): PrismaDelegate {
    const table = this.tables.get(delegateKey)!;
    const self = this;
    // Ops are deferred to a microtask so, like real PrismaPromises, they
    // execute when awaited (by $transaction), in creation order.
    const defer = <T>(fn: () => T): Promise<T> => Promise.resolve().then(fn);
    return {
      findMany: () => defer(() => [...table.values()].map(cloneRow)),
      create: ({ data }) =>
        defer(() => {
          self.writeCount++;
          table.set(String(data[idField]), cloneRow(data));
          return cloneRow(data);
        }),
      createMany: ({ data }) =>
        defer(() => {
          for (const row of data) {
            self.writeCount++;
            table.set(String(row[idField]), cloneRow(row));
          }
          return { count: data.length };
        }),
      deleteMany: (args) =>
        defer(() => {
          const where = (args?.where ?? {}) as Row;
          const cond = where[idField] as { in?: string[] } | undefined;
          if (cond && Array.isArray(cond.in)) {
            let n = 0;
            for (const id of cond.in) if (table.delete(id)) n++;
            self.writeCount += n;
            return { count: n };
          }
          const n = table.size;
          table.clear();
          self.writeCount += n;
          return { count: n };
        }),
      upsert: ({ where, create, update }) =>
        defer(() => {
          self.writeCount++;
          const id = String(where[idField]);
          const next = table.has(id) ? update : create;
          table.set(id, cloneRow(next));
          return cloneRow(next);
        }),
      count: () => defer(() => table.size),
    };
  }

  asClient(): PrismaClientLike {
    const client: Record<string, unknown> = {
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
      $transaction: async (ops: PromiseLike<unknown>[]) => {
        this.transactionCount++;
        const out: unknown[] = [];
        for (const op of ops) out.push(await op);
        return out;
      },
    };
    for (const [storeKey, delegateKey] of Object.entries(DELEGATE_BY_KEY)) {
      client[delegateKey] = this.delegate(
        delegateKey,
        rowIdField(storeKey as StoreKey),
      );
    }
    return client as unknown as PrismaClientLike;
  }
}

// ─── Part 1: computeStoreDiff unit tests ─────────────────────────────────────

function diffTests() {
  console.log("computeStoreDiff:");
  const base: StoreData = emptyStoreData();
  base.users.push({
    id: "u1", email: "a@test.dev", passwordHash: "h", role: "CUSTOMER",
    name: "A", phoneNumber: null, phoneVerified: false,
    createdAt: "2026-11-16T10:00:00.000Z",
  });
  base.jobPosts.push({
    id: "j1", customerId: "u1", title: "Leak", category: "plumbing",
    description: "d", budgetMinCents: 100, budgetMaxCents: 200,
    locationLat: 29.65, locationLng: -82.32, locationLabel: "Gainesville, FL",
    status: "OPEN", preferredDate: "2026-11-20", matchedProLimit: 5,
    completionCode: null, completionCodeHash: null,
    completionRequestedAt: null, createdAt: "2026-11-16T10:00:00.000Z",
  });
  base.jobPrivateDetails.push({
    jobId: "j1", streetAddress: "123 Lane", unit: null, zip: "32601",
    accessNotes: null,
  });

  const totalOps = (d: ReturnType<typeof computeStoreDiff>) =>
    Object.values(d).reduce(
      (n, t) => n + t.upserts.length + t.deleteIds.length,
      0,
    );

  check(
    "identical snapshots diff to nothing",
    totalOps(computeStoreDiff(base, structuredClone(base))) === 0,
  );

  const changed = structuredClone(base);
  changed.jobPosts[0].title = "Leak (updated)";
  const d1 = computeStoreDiff(base, changed);
  check(
    "one changed field → exactly one upsert in that table",
    d1.jobPosts.upserts.length === 1 && totalOps(d1) === 1,
  );

  const removed = structuredClone(base);
  removed.jobPosts = [];
  removed.jobPrivateDetails = [];
  const d2 = computeStoreDiff(base, removed);
  check(
    "removed rows → deleteIds (jobPrivateDetails keyed by jobId)",
    d2.jobPosts.deleteIds.length === 1 &&
      d2.jobPosts.deleteIds[0] === "j1" &&
      d2.jobPrivateDetails.deleteIds.length === 1 &&
      d2.jobPrivateDetails.deleteIds[0] === "j1" &&
      totalOps(d2) === 2,
  );

  const added = structuredClone(base);
  added.bids.push({
    id: "b1", jobId: "j1", proId: "u2", totalAmountCents: 20000,
    proCommissionRateBps: 1000, proCommissionCents: 2000,
    customerFeeRateBps: 500, customerFeeCents: 1000, netPayoutCents: 18000,
    proposalText: "Can do", status: "PENDING",
    expiresAt: "2026-11-18T10:00:00.000Z",
    createdAt: "2026-11-16T10:05:00.000Z",
  });
  const d3 = computeStoreDiff(base, added);
  check(
    "new row → upsert, no deletes",
    d3.bids.upserts.length === 1 && totalOps(d3) === 1,
  );
}

// ─── Part 2: two instances, one shared database ──────────────────────────────

const T0 = new Date("2026-11-16T10:00:00.000Z");
const ISO = "2026-11-16T10:00:00.000Z";

function seedFakeDb(fake: FakePrisma) {
  fake.seed("user", "id", {
    id: "u-cust", email: "cust@test.dev", passwordHash: "h", role: "CUSTOMER",
    name: "Cust", phoneNumber: null, phoneVerified: false, createdAt: T0,
  });
  fake.seed("user", "id", {
    id: "u-pro", email: "pro@test.dev", passwordHash: "h", role: "PRO",
    name: "Pro", phoneNumber: null, phoneVerified: false, createdAt: T0,
  });
  fake.seed("jobPost", "id", {
    id: "j1", customerId: "u-cust", title: "Leak", category: "plumbing",
    description: "d", budgetMinCents: 15000, budgetMaxCents: 30000,
    locationLat: 29.65, locationLng: -82.32, locationLabel: "Gainesville, FL",
    status: "OPEN", preferredDate: new Date("2026-11-20T12:00:00.000Z"),
    matchedProLimit: 5, completionCodeHash: null, completionRequestedAt: null,
    createdAt: T0,
  });
  fake.seed("jobPrivateDetails", "jobId", {
    jobId: "j1", streetAddress: "123 Lane", unit: null, zip: "32601",
    accessNotes: null,
  });
  fake.seed("bid", "id", {
    id: "b1", jobId: "j1", proId: "u-pro", totalAmountCents: 20000,
    proCommissionRateBps: 1000, proCommissionCents: 2000,
    customerFeeRateBps: 500, customerFeeCents: 1000, netPayoutCents: 18000,
    proposalText: "Can do", status: "PENDING",
    expiresAt: new Date("2026-11-18T10:00:00.000Z"), createdAt: T0,
  });
  fake.seed("notification", "id", {
    id: "n1", userId: "u-cust", kind: "SYSTEM", text: "hello", jobId: "j1",
    read: false, smsSent: false, createdAt: T0,
  });
}

async function scenarioTests() {
  console.log("two-instance stale-flush scenario:");
  const fake = new FakePrisma();
  seedFakeDb(fake);
  const factory = async () => fake.asClient();

  // Instance A hydrates BEFORE acceptance — the stale instance.
  const a = new PrismaDataAdapter(factory);
  await a.ready;
  check(
    "A hydrated the pre-acceptance state",
    a.data().jobPosts[0]?.status === "OPEN" &&
      a.data().bids[0]?.status === "PENDING",
  );

  // Instance B hydrates, then performs accept + fund + schedule.
  const b = new PrismaDataAdapter(factory);
  await b.ready;
  b.data().bids[0].status = "ACCEPTED";
  b.data().jobPosts[0].status = "ACCEPTED";
  b.data().paymentMilestones.push(
    {
      id: "ms1", jobId: "j1", bidId: "b1", seq: 1, label: "Deposit & materials",
      amountCents: 6000, status: "HELD", paymentIntentId: "pi_test_123",
      transferId: null, createdAt: ISO,
    },
    {
      id: "ms2", jobId: "j1", bidId: "b1", seq: 2, label: "Balance on completion",
      amountCents: 14000, status: "UNFUNDED", paymentIntentId: null,
      transferId: null, createdAt: ISO,
    },
  );
  b.data().appointments.push({
    id: "appt1", jobId: "j1", proId: "u-pro", scheduledDate: "2026-11-20",
    windowStart: "09:00", windowEnd: "11:00", status: "CONFIRMED",
    createdAt: ISO,
  });
  const writesBeforeB = fake.writeCount;
  await b.flush();
  check(
    "B's flush wrote only its own changes (job, bid, 2 milestones, appointment)",
    fake.writeCount - writesBeforeB === 5,
    `wrote ${fake.writeCount - writesBeforeB}`,
  );
  check(
    "B's state persisted",
    fake.get("bid", "b1")?.status === "ACCEPTED" &&
      fake.count("paymentMilestone") === 2 &&
      fake.get("paymentMilestone", "ms1")?.status === "HELD",
  );

  // Instance A now does the only mutation a login makes: a refresh token.
  a.data().refreshTokens.push({
    id: "rt-a", userId: "u-cust", tokenHash: "hash-a",
    expiresAt: "2026-12-16T10:00:00.000Z", revokedAt: null, createdAt: ISO,
  });
  const writesBeforeA = fake.writeCount;
  await a.flush();
  check(
    "A's flush wrote exactly one row (its refresh token)",
    fake.writeCount - writesBeforeA === 1,
    `wrote ${fake.writeCount - writesBeforeA}`,
  );
  check(
    "bid NOT reverted by A's stale flush",
    fake.get("bid", "b1")?.status === "ACCEPTED",
    `status=${String(fake.get("bid", "b1")?.status)}`,
  );
  check(
    "job NOT reverted by A's stale flush",
    fake.get("jobPost", "j1")?.status === "ACCEPTED",
    `status=${String(fake.get("jobPost", "j1")?.status)}`,
  );
  check(
    "milestones NOT deleted by A's stale flush",
    fake.count("paymentMilestone") === 2 &&
      fake.get("paymentMilestone", "ms1")?.status === "HELD",
  );
  check(
    "appointment NOT deleted by A's stale flush",
    fake.count("appointment") === 1,
  );
  check(
    "A's refresh token persisted",
    fake.get("refreshToken", "rt-a")?.tokenHash === "hash-a",
  );

  // A flush with no mutations must not open a transaction or write anything.
  const txBefore = fake.transactionCount;
  const writesBeforeNoop = fake.writeCount;
  await a.flush();
  check(
    "no-op flush performs no transaction and no writes",
    fake.transactionCount === txBefore && fake.writeCount === writesBeforeNoop,
  );

  // Genuine deletion: B removes a notification that WAS in its snapshot.
  b.data().notifications = b.data().notifications.filter((n) => n.id !== "n1");
  await b.flush();
  check(
    "B's own deletion is persisted",
    fake.count("notification") === 0,
  );
  check(
    "B's flush did not delete A's refresh token (never in B's snapshot)",
    fake.get("refreshToken", "rt-a")?.tokenHash === "hash-a",
  );
  check(
    "milestones still intact after B's deletion flush",
    fake.count("paymentMilestone") === 2,
  );

  await a.disconnect();
  await b.disconnect();
}

// ─── Part 3: cross-instance freshness (ensureReady TTL re-hydration) ─────────
// Guards the second production failure of the per-instance cache: an
// instance hydrated ONCE and never refreshed, so actions landing on it
// looked up rows created after it booted (milestones created by bid
// acceptance on another instance), missed, and silently no-oped — the
// pro's check-in clicks recorded nothing and two "Pay $147" clicks created
// no PaymentIntent and no error. ensureReady() must re-hydrate once the
// snapshot is older than the TTL — but never at the cost of unflushed
// mutations, which a wholesale cache replacement would erase.

function milestoneRow(id: string, seq: number): Row {
  return {
    id, jobId: "j1", bidId: "b1", seq,
    label: seq === 1 ? "Deposit & materials" : "Balance on completion",
    amountCents: seq === 1 ? 6000 : 14000, status: "UNFUNDED",
    paymentIntentId: null, transferId: null, createdAt: T0,
  };
}

async function freshnessTests() {
  console.log("cross-instance freshness (ensureReady TTL refresh):");
  const fake = new FakePrisma();
  seedFakeDb(fake);
  const factory = async () => fake.asClient();

  // Instance C hydrates with the default TTL.
  const c = new PrismaDataAdapter(factory);
  await c.ready;
  check("C hydrated the seeded job", c.data().jobPosts.length === 1);

  // Another instance's flush lands a milestone in the DB AFTER C booted
  // (seeded directly — exactly what C's next hydrate would read).
  fake.seed("paymentMilestone", "id", milestoneRow("ms-late", 1));
  check(
    "C's snapshot is stale: the late milestone is invisible",
    !c.data().paymentMilestones.some((m) => m.id === "ms-late"),
  );

  await c.ensureReady();
  check(
    "ensureReady within the TTL does not refresh",
    !c.data().paymentMilestones.some((m) => m.id === "ms-late"),
  );

  // Simulate TTL expiry by backdating the last-hydrate stamp (no sleeping).
  (c as unknown as { lastHydratedAt: number }).lastHydratedAt = 0;
  await c.ensureReady();
  check(
    "ensureReady after TTL expiry re-hydrates: late milestone visible",
    c.data().paymentMilestones.some((m) => m.id === "ms-late"),
  );

  // Dirty-cache guard: an unflushed mutation must survive ensureReady —
  // a refresh here would erase it (this is the flush() call path).
  c.data().refreshTokens.push({
    id: "rt-c", userId: "u-cust", tokenHash: "hash-c",
    expiresAt: "2026-12-16T10:00:00.000Z", revokedAt: null, createdAt: ISO,
  });
  fake.seed("paymentMilestone", "id", milestoneRow("ms-later", 2));
  (c as unknown as { lastHydratedAt: number }).lastHydratedAt = 0;
  await c.ensureReady();
  check(
    "refresh skipped while cache is dirty: unflushed mutation kept",
    c.data().refreshTokens.some((t) => t.id === "rt-c"),
  );
  check(
    "refresh skipped while cache is dirty: newest row not yet visible",
    !c.data().paymentMilestones.some((m) => m.id === "ms-later"),
  );
  await c.flush();
  check(
    "flush persisted the mutation the refresh preserved",
    fake.get("refreshToken", "rt-c")?.tokenHash === "hash-c",
  );
  (c as unknown as { lastHydratedAt: number }).lastHydratedAt = 0;
  await c.ensureReady();
  check(
    "after the flush, refresh resumes: newest row visible, flushed row kept",
    c.data().paymentMilestones.some((m) => m.id === "ms-later") &&
      c.data().refreshTokens.some((t) => t.id === "rt-c"),
  );

  // TTL injection: an instance with TTL 0 refreshes on every ensureReady.
  const e = new PrismaDataAdapter(factory, 0);
  await e.ready;
  fake.seed("paymentMilestone", "id", milestoneRow("ms-zero", 1));
  await e.ensureReady();
  check(
    "TTL 0 instance refreshes on every ensureReady",
    e.data().paymentMilestones.some((m) => m.id === "ms-zero"),
  );

  await c.disconnect();
  await e.disconnect();
}

async function main() {
  diffTests();
  await scenarioTests();
  await freshnessTests();
  if (failures > 0) {
    console.error(`\n${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
}

void main();
