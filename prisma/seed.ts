// ─── Localent.ai database seed ───────────────────────────────────────────────
// Loads the fictional demo seed (lib/seed.ts `buildSeed()`) into a real
// Postgres database via Prisma. Run AFTER the client is generated and the
// schema is applied:
//
//   npx prisma generate
//   npx prisma migrate deploy        # or: npx prisma db push
//   npx tsx prisma/seed.ts           # requires DATABASE_URL in the env
//
// ID REMAP: Prisma ids are @db.Uuid, but the seed uses human-readable ids
// ("u-admin", "job-leak", …), so every seed id is remapped to a fresh
// crypto.randomUUID() and every foreign-key reference is rewritten through
// the same map. The map is built from the set of ALL seed ids (every model's
// `id` field plus jobPrivateDetails.jobId, its primary key), and conversion
// goes through lib/prisma-mapping.ts `storeToPrismaPayloads` with that map:
// id/FK columns — and the polymorphic Report.targetId /
// AdminAuditLog.targetId strings when they reference a known row — are
// rewritten, while external identifiers that are not row ids
// (paymentIntentId / transferId like "pi_demo_…", stripeAccountId, slugs)
// are never routed through the map and pass through untouched.
//
// Like the rest of the Prisma layer, this file gets its client from
// createPrismaClient() in lib/prisma-mapping.ts, which constructs it from
// a static `@prisma/client` import (required so Next.js file tracing
// ships the package in serverless bundles).
//
// The seed is idempotent-by-destruction: all tables are cleared in
// reverse-FK order before inserting in FK order, so re-running it resets
// the database to exactly the fictional demo state.

import { randomUUID } from "node:crypto";
import { buildSeed } from "../lib/seed";
import type { StoreData } from "../lib/types";
import {
  createPrismaClient,
  DELEGATE_BY_KEY,
  DELETE_ORDER,
  MODEL_ORDER,
  storeToPrismaPayloads,
  type PrismaClientLike,
  type StoreKey,
} from "../lib/prisma-mapping";

/** Every id the seed knows about: each row's `id`, plus jobPrivateDetails.jobId. */
function collectSeedIds(data: StoreData): Set<string> {
  const ids = new Set<string>();
  for (const key of Object.keys(data) as StoreKey[]) {
    for (const row of data[key] as unknown as Record<string, unknown>[]) {
      if (typeof row.id === "string") ids.add(row.id);
    }
  }
  for (const d of data.jobPrivateDetails) ids.add(d.jobId);
  return ids;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set — point it at the target Postgres database before seeding.",
    );
  }

  const seed = buildSeed();

  // Build the id remap: human seed id → UUID. Unknown ids pass through
  // unchanged (the mapper only ever feeds id/FK values through this).
  const idMap = new Map<string, string>();
  for (const id of collectSeedIds(seed)) idMap.set(id, randomUUID());
  const remap = (id: string): string => idMap.get(id) ?? id;

  const payloads = storeToPrismaPayloads(seed, remap);

  const client: PrismaClientLike = await createPrismaClient();
  try {
    // Clear in reverse-FK order so children are deleted before parents.
    for (const key of DELETE_ORDER) {
      await client[DELEGATE_BY_KEY[key]].deleteMany();
    }

    // Insert in FK order; log the count per model as we go.
    let total = 0;
    for (const key of MODEL_ORDER) {
      const data = payloads[key];
      if (data.length > 0) {
        const res = await client[DELEGATE_BY_KEY[key]].createMany({ data });
        total += res.count;
        console.log(`  ${key}: ${res.count}`);
      } else {
        console.log(`  ${key}: 0`);
      }
    }
    console.log(
      `[localent] Seed complete: ${total} rows inserted ` +
        `(${idMap.size} seed ids remapped to UUIDs).`,
    );
  } finally {
    await client.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("[localent] Seed failed:", err);
  process.exit(1);
});
