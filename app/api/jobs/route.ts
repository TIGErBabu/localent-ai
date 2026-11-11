import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { db, matchProsForJob, notify } from "@/lib/store";
import { canViewJob } from "@/lib/policy";
import { nowIso, roundCoord, uid } from "@/lib/utils";
import { config } from "@/lib/config";

// GET /api/jobs?category=plumbing — OPEN jobs are public in approximate form;
// anything else requires a session and passes the resource policy (blueprint 4.3).
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  const category = req.nextUrl.searchParams.get("category");
  const jobs = db().jobPosts.filter((j) => !category || j.category === category);
  const visible = user ? jobs.filter((j) => canViewJob(user, j)) : jobs.filter((j) => j.status === "OPEN");
  return NextResponse.json({ jobs: visible.map(({ completionCode, ...rest }) => rest) });
}

// POST /api/jobs — customer creates a job; matching + notifications run server-side (blueprint 4.1).
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "CUSTOMER") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.category || !body?.streetAddress) return NextResponse.json({ error: "title, category, streetAddress required" }, { status: 400 });
  const jobId = uid("job");
  const job = {
    id: jobId, customerId: user.id, title: String(body.title), category: String(body.category),
    description: String(body.description ?? ""), budgetMinCents: Number(body.budgetMinCents ?? 0), budgetMaxCents: Number(body.budgetMaxCents ?? 0),
    locationLat: roundCoord(29.6516), locationLng: roundCoord(-82.3248), locationLabel: `${config.metro} (approx.)`,
    status: "OPEN" as const, preferredDate: body.preferredDate ?? null, matchedProLimit: config.matchedProLimit,
    completionCode: null, completionRequestedAt: null, createdAt: nowIso(),
  };
  db().jobPosts.push(job);
  db().jobPrivateDetails.push({ jobId, streetAddress: String(body.streetAddress), unit: body.unit ?? null, zip: String(body.zip ?? ""), accessNotes: body.accessNotes ?? null });
  const matched = matchProsForJob(job);
  for (const m of matched) notify(m.profile.userId, "NEW_LEAD", `New ${job.category} lead near ${job.locationLabel}: ${job.title}`, jobId);
  return NextResponse.json({ job, matchedProCount: matched.length }, { status: 201 });
}
