import type { CompanyProfile, JobPost, StoreData, User } from "./types";
import { buildSeed } from "./seed";
import { config } from "./config";
import { haversineMiles, inBoundingBox } from "./utils";

// ─── Data adapter interface ──────────────────────────────────────────────────
// Production implementation: PrismaClient against Supabase Postgres
// (prisma/schema.prisma). Demo implementation below: a typed in-memory store
// seeded from lib/seed.ts with identical shapes, so every route and workflow
// runs end-to-end with no external accounts.
export interface DataAdapter {
  data(): StoreData;
}

class InMemoryAdapter implements DataAdapter {
  private store: StoreData;
  constructor() { this.store = buildSeed(); }
  data(): StoreData { return this.store; }
}

const g = globalThis as unknown as { __localentAdapter?: DataAdapter };
if (!g.__localentAdapter) g.__localentAdapter = new InMemoryAdapter();
export const adapter: DataAdapter = g.__localentAdapter;
export function db(): StoreData { return adapter.data(); }

// ─── Lookups ─────────────────────────────────────────────────────────────────
export const findUser = (id: string) => db().users.find((u) => u.id === id);
export const findUserByEmail = (email: string) => db().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
export const profileByUserId = (userId: string) => db().companyProfiles.find((p) => p.userId === userId);
export const profileBySlug = (slug: string) => db().companyProfiles.find((p) => p.slug === slug);
export const findJob = (id: string) => db().jobPosts.find((j) => j.id === id);
export const privateDetails = (jobId: string) => db().jobPrivateDetails.find((d) => d.jobId === jobId);
export const bidsForJob = (jobId: string) => db().bids.filter((b) => b.jobId === jobId);
export const acceptedBid = (jobId: string) => db().bids.find((b) => b.jobId === jobId && b.status === "ACCEPTED");
export const milestonesForJob = (jobId: string) => db().paymentMilestones.filter((m) => m.jobId === jobId).sort((a, b) => a.seq - b.seq);
export const messagesForJob = (jobId: string) => db().chatMessages.filter((m) => m.jobId === jobId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
export const appointmentForJob = (jobId: string) => db().appointments.find((a) => a.jobId === jobId);
export const proName = (proId: string) => profileByUserId(proId)?.businessName ?? findUser(proId)?.name ?? "Localent Pro";

export function proRating(proId: string): { avg: number; count: number } {
  const rs = db().reviews.filter((r) => r.proId === proId);
  if (!rs.length) return { avg: 0, count: 0 };
  return { avg: rs.reduce((s, r) => s + r.ratingValue, 0) / rs.length, count: rs.length };
}

// Milestone 1 funded = the trust gate for the whole platform (blueprint 4.2/4.3).
export function milestone1Funded(jobId: string): boolean {
  const m = db().paymentMilestones.find((x) => x.jobId === jobId && x.seq === 1);
  return !!m && (m.status === "HELD" || m.status === "RELEASED");
}
export function escrowHeldCents(jobId: string): number {
  return db().paymentMilestones.filter((m) => m.jobId === jobId && m.status === "HELD").reduce((s, m) => s + m.amountCents, 0);
}

// Blueprint 4.1 matching: skills match + bounding-box radius pre-filter +
// haversine rank, limited to config.matchedProLimit.
export interface MatchedPro { profile: CompanyProfile; distanceMiles: number }
export function matchProsForJob(job: JobPost): MatchedPro[] {
  return db().companyProfiles
    .filter((p) => p.skillsArray.includes(job.category))
    .filter((p) => inBoundingBox(p.locationLat, p.locationLng, job.locationLat, job.locationLng, p.serviceRadiusMiles))
    .map((p) => ({ profile: p, distanceMiles: haversineMiles(job.locationLat, job.locationLng, p.locationLat, p.locationLng) }))
    .filter((m) => m.distanceMiles <= m.profile.serviceRadiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles || proRating(b.profile.userId).avg - proRating(a.profile.userId).avg)
    .slice(0, job.matchedProLimit ?? config.matchedProLimit);
}

export function notify(userId: string, kind: string, text: string, jobId: string | null) {
  db().notifications.push({
    id: `ntf_${Math.random().toString(36).slice(2, 10)}`, userId, kind, text, jobId,
    read: false, smsSent: false, createdAt: new Date().toISOString(),
  });
}
export function audit(admin: User, action: string, targetType: string, targetId: string, detail: string) {
  db().adminAuditLogs.push({
    id: `audit_${Math.random().toString(36).slice(2, 10)}`, adminId: admin.id, action,
    targetType, targetId, detail, createdAt: new Date().toISOString(),
  });
}
