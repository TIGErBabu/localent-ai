import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { db, findJob, notify, profileByUserId } from "@/lib/store";
import { computeSplit, money, nowIso, uid } from "@/lib/utils";
import { config } from "@/lib/config";

// POST /api/jobs/[id]/bids — pro bids; the split is computed server-side from
// config rates. Any split numbers in the request body are ignored (blueprint 4.1).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "PRO") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const job = findJob(id);
  if (!job || job.status !== "OPEN") return NextResponse.json({ error: "job not open" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const total = Number(body?.totalAmountCents ?? 0);
  if (!total || total <= 0) return NextResponse.json({ error: "totalAmountCents required" }, { status: 400 });
  if (db().bids.some((b) => b.jobId === job.id && b.proId === user.id && b.status === "PENDING"))
    return NextResponse.json({ error: "you already have a live bid on this job" }, { status: 409 });
  const split = computeSplit(total, config.proCommissionBps, config.customerFeeBps);
  const bid = {
    id: uid("bid"), jobId: job.id, proId: user.id, totalAmountCents: total,
    proCommissionRateBps: config.proCommissionBps, proCommissionCents: split.proCommissionCents,
    customerFeeRateBps: config.customerFeeBps, customerFeeCents: split.customerFeeCents,
    netPayoutCents: split.netPayoutCents, proposalText: String(body?.proposalText ?? ""), status: "PENDING" as const,
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), createdAt: nowIso(),
  };
  db().bids.push(bid);
  notify(job.customerId, "NEW_BID", `${profileByUserId(user.id)?.businessName ?? user.name} bid ${money(total)} on “${job.title}”.`, job.id);
  return NextResponse.json({ bid }, { status: 201 });
}
