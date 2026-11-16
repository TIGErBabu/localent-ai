// ─── Prisma ⇄ StoreData mapping ──────────────────────────────────────────────
// Conversion helpers between the app's in-memory shapes (lib/types.ts, served
// by the DataAdapter in lib/store.ts) and Prisma row shapes
// (prisma/schema.prisma). The client surface is described structurally
// (PrismaClientLike below), but the real constructor comes from a STATIC
// `@prisma/client` import — that is load-bearing, not stylistic: Next.js
// file tracing can only follow static imports, and an earlier invisible
// dynamic load (`new Function("return import(m)")`) left @prisma/client
// out of the Vercel serverless bundle entirely, so every production
// request failed with ERR_MODULE_NOT_FOUND. The generated client is a
// committed build artifact of `prisma generate` (postinstall), so the
// static import is safe wherever the package is installed.
//
// Shape differences handled here (types.ts vs schema.prisma):
//  • JobPost: Prisma has NO `completionCode` column, only
//    `completionCodeHash`. Writing drops `completionCode` (demo-only
//    plaintext) and keeps the hash; reading sets `completionCode: null`.
//  • Dates: StoreData uses ISO strings; Prisma DateTime fields need Date
//    objects. `preferredDate` (JobPost) and `scheduledDate` (Appointment)
//    are @db.Date in Prisma and date-only "YYYY-MM-DD" strings in StoreData;
//    they are written as noon-UTC Dates so the calendar day survives any
//    timezone truncation, and read back as "YYYY-MM-DD".
//  • Decimals: `locationLat` / `locationLng` are Decimal(10,7) in Prisma and
//    plain numbers in StoreData. Reading coerces via Number(v) (works for
//    number, string and Decimal.js-like objects); writing passes numbers,
//    which Prisma accepts for Decimal columns.
//  • Enums pass through as their string literals in both directions.
//  • JobPrivateDetails has no surrogate id — `jobId` is the primary key in
//    both shapes.
//  • Report.targetId / AdminAuditLog.targetId are polymorphic plain strings
//    in Prisma (no FK). They are still routed through mapId so a seed remap
//    rewrites them when they happen to reference a known row id, and passes
//    them through untouched otherwise (mapId must be total: unknown ids are
//    returned unchanged). External identifiers that are NOT row ids —
//    paymentIntentId, transferId, stripeAccountId — are never routed
//    through mapId and always pass through verbatim.

import type {
  AdminAuditLog,
  Appointment,
  AppointmentStatus,
  Bid,
  BidStatus,
  ChangeOrder,
  ChangeOrderStatus,
  ChatMessage,
  CompanyProfile,
  Dispute,
  DisputeStatus,
  EvidenceKind,
  JobEvidence,
  JobPost,
  JobPrivateDetails,
  JobStatus,
  MilestoneStatus,
  Notification,
  Payment,
  PaymentMilestone,
  PaymentStatus,
  ProAvailability,
  ProPayoutAccount,
  RefreshToken,
  Report,
  ReportStatus,
  Review,
  Role,
  StoreData,
  User,
  VerificationTier,
} from "./types";
import { PrismaClient } from "@prisma/client";

// ─── Structural Prisma client surface (no generated types needed) ───────────

export type Row = Record<string, unknown>;
export type Payload = Record<string, unknown>;
export type StoreKey = keyof StoreData;

export interface PrismaDelegate {
  findMany(args?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
  createMany(args: {
    data: Record<string, unknown>[];
    skipDuplicates?: boolean;
  }): Promise<{ count: number }>;
  deleteMany(args?: Record<string, unknown>): Promise<{ count: number }>;
  upsert(args: {
    where: Record<string, unknown>;
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  count(args?: Record<string, unknown>): Promise<number>;
}

export type DelegateKey =
  | "user"
  | "companyProfile"
  | "jobPost"
  | "jobPrivateDetails"
  | "appointment"
  | "proAvailability"
  | "bid"
  | "chatMessage"
  | "review"
  | "paymentMilestone"
  | "changeOrder"
  | "jobEvidence"
  | "payment"
  | "proPayoutAccount"
  | "dispute"
  | "report"
  | "notification"
  | "refreshToken"
  | "adminAuditLog";

export interface PrismaClientLike {
  user: PrismaDelegate;
  companyProfile: PrismaDelegate;
  jobPost: PrismaDelegate;
  jobPrivateDetails: PrismaDelegate;
  appointment: PrismaDelegate;
  proAvailability: PrismaDelegate;
  bid: PrismaDelegate;
  chatMessage: PrismaDelegate;
  review: PrismaDelegate;
  paymentMilestone: PrismaDelegate;
  changeOrder: PrismaDelegate;
  jobEvidence: PrismaDelegate;
  payment: PrismaDelegate;
  proPayoutAccount: PrismaDelegate;
  dispute: PrismaDelegate;
  report: PrismaDelegate;
  notification: PrismaDelegate;
  refreshToken: PrismaDelegate;
  adminAuditLog: PrismaDelegate;
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
}

/** StoreData collection key → Prisma model delegate name. */
export const DELEGATE_BY_KEY: Record<StoreKey, DelegateKey> = {
  users: "user",
  companyProfiles: "companyProfile",
  jobPosts: "jobPost",
  jobPrivateDetails: "jobPrivateDetails",
  appointments: "appointment",
  proAvailability: "proAvailability",
  bids: "bid",
  chatMessages: "chatMessage",
  reviews: "review",
  paymentMilestones: "paymentMilestone",
  changeOrders: "changeOrder",
  jobEvidence: "jobEvidence",
  payments: "payment",
  proPayoutAccounts: "proPayoutAccount",
  disputes: "dispute",
  reports: "report",
  notifications: "notification",
  refreshTokens: "refreshToken",
  adminAuditLogs: "adminAuditLog",
};

/**
 * Insert order respecting foreign keys: a model appears only after every
 * model it references. (Payment.milestoneId has no Prisma relation, but
 * payments are still written after milestones to match the logical FK.)
 */
export const MODEL_ORDER: StoreKey[] = [
  "users",
  "companyProfiles",
  "jobPosts",
  "jobPrivateDetails",
  "appointments",
  "proAvailability",
  "bids",
  "paymentMilestones",
  "payments",
  "chatMessages",
  "reviews",
  "changeOrders",
  "jobEvidence",
  "proPayoutAccounts",
  "disputes",
  "reports",
  "notifications",
  "refreshTokens",
  "adminAuditLogs",
];

/** Delete order: exact reverse of MODEL_ORDER so children go first. */
export const DELETE_ORDER: StoreKey[] = [...MODEL_ORDER].reverse();

/**
 * Construct the real PrismaClient from the static import above. Throws if
 * the client has not been generated or the datasource is misconfigured —
 * callers decide whether that is fatal (seed) or degradable (adapter
 * hydrate).
 */
// Supabase serves the app through its transaction pooler (PgBouncer, port
// 6543 / *.pooler.supabase.com). Prisma needs `pgbouncer=true` on pooled
// URLs to disable prepared statements, which transaction pooling cannot
// support. Append it when the configured DATABASE_URL points at the pooler
// and doesn't already carry it; direct URLs (DIRECT_URL, local Postgres)
// are passed through untouched.
function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  const isPooler = url.includes("pooler.supabase.com") || url.includes(":6543");
  if (isPooler && !/[?&]pgbouncer=true/.test(url)) {
    return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
  return url;
}

export async function createPrismaClient(): Promise<PrismaClientLike> {
  const url = datasourceUrl();
  const client = url
    ? new PrismaClient({ datasources: { db: { url } } })
    : new PrismaClient();
  return client as unknown as PrismaClientLike;
}

// ─── Scalar coercion helpers ────────────────────────────────────────────────

/** Prisma Decimal (Decimal.js), string or number → plain number. */
export function decimalToNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (v != null && typeof v === "object") {
    const o = v as { toNumber?: unknown };
    if (typeof o.toNumber === "function") {
      return (o.toNumber as () => number).call(v);
    }
  }
  return Number(v as number);
}

/** Date / ISO string / date-like → full ISO string (StoreData DateTime). */
export function dateToIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toISOString();
  }
  if (
    v != null &&
    typeof v === "object" &&
    typeof (v as { toISOString?: unknown }).toISOString === "function"
  ) {
    return (v as { toISOString: () => string }).toISOString();
  }
  return new Date(Number(v)).toISOString();
}

export function dateToIsoOrNull(v: unknown): string | null {
  return v == null ? null : dateToIso(v);
}

/** Date / ISO string → date-only "YYYY-MM-DD" (StoreData @db.Date fields). */
export function dateToDateOnly(v: unknown): string {
  if (typeof v === "string") return v.slice(0, 10);
  return dateToIso(v).slice(0, 10);
}

export function dateToDateOnlyOrNull(v: unknown): string | null {
  return v == null ? null : dateToDateOnly(v);
}

/** StoreData ISO string → Prisma DateTime value. */
export function isoToDate(iso: string): Date {
  return new Date(iso);
}

export function isoToDateOrNull(iso: string | null): Date | null {
  return iso == null ? null : new Date(iso);
}

/**
 * StoreData date-only "YYYY-MM-DD" → Prisma @db.Date value. Noon UTC keeps
 * the calendar day stable when Postgres truncates to a date.
 */
export function dateOnlyToDate(d: string): Date {
  return d.includes("T") ? new Date(d) : new Date(`${d}T12:00:00Z`);
}

export function dateOnlyToDateOrNull(d: string | null): Date | null {
  return d == null ? null : dateOnlyToDate(d);
}

// Row field getters (rows arrive as untyped records from the structural client).
function str(row: Row, key: string): string {
  const v = row[key];
  if (typeof v === "string") return v;
  return v == null ? "" : String(v);
}
function strOrNull(row: Row, key: string): string | null {
  const v = row[key];
  return v == null ? null : typeof v === "string" ? v : String(v);
}
function num(row: Row, key: string): number {
  return decimalToNumber(row[key]);
}
function bool(row: Row, key: string): boolean {
  return row[key] === true;
}
function strArray(row: Row, key: string): string[] {
  const v = row[key];
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

// ─── Prisma row → StoreData entity ──────────────────────────────────────────

export function rowToUser(r: Row): User {
  return {
    id: str(r, "id"),
    email: str(r, "email"),
    passwordHash: str(r, "passwordHash"),
    role: str(r, "role") as Role,
    name: str(r, "name"),
    phoneNumber: strOrNull(r, "phoneNumber"),
    phoneVerified: bool(r, "phoneVerified"),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToCompanyProfile(r: Row): CompanyProfile {
  return {
    id: str(r, "id"),
    userId: str(r, "userId"),
    businessName: str(r, "businessName"),
    slug: str(r, "slug"),
    skillsArray: strArray(r, "skillsArray"),
    bio: strOrNull(r, "bio"),
    portfolioUrls: strArray(r, "portfolioUrls"),
    isVerified: bool(r, "isVerified"),
    verificationTier: str(r, "verificationTier") as VerificationTier,
    backgroundCheckStatus: strOrNull(r, "backgroundCheckStatus"),
    licenceNumber: strOrNull(r, "licenceNumber"),
    licenceTrade: strOrNull(r, "licenceTrade"),
    licenceState: strOrNull(r, "licenceState"),
    serviceRadiusMiles: num(r, "serviceRadiusMiles"),
    locationLat: num(r, "locationLat"),
    locationLng: num(r, "locationLng"),
    locationLabel: str(r, "locationLabel"),
    responseTimeHours: num(r, "responseTimeHours"),
    yearsInBusiness: num(r, "yearsInBusiness"),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToJobPost(r: Row): JobPost {
  return {
    id: str(r, "id"),
    customerId: str(r, "customerId"),
    title: str(r, "title"),
    category: str(r, "category"),
    description: str(r, "description"),
    budgetMinCents: num(r, "budgetMinCents"),
    budgetMaxCents: num(r, "budgetMaxCents"),
    locationLat: num(r, "locationLat"),
    locationLng: num(r, "locationLng"),
    locationLabel: str(r, "locationLabel"),
    status: str(r, "status") as JobStatus,
    preferredDate: dateToDateOnlyOrNull(r.preferredDate),
    matchedProLimit: num(r, "matchedProLimit"),
    // Prisma has no plaintext completionCode column — demo-only field.
    completionCode: null,
    completionCodeHash: strOrNull(r, "completionCodeHash"),
    completionRequestedAt: dateToIsoOrNull(r.completionRequestedAt),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToJobPrivateDetails(r: Row): JobPrivateDetails {
  return {
    jobId: str(r, "jobId"),
    streetAddress: str(r, "streetAddress"),
    unit: strOrNull(r, "unit"),
    zip: str(r, "zip"),
    accessNotes: strOrNull(r, "accessNotes"),
  };
}

export function rowToAppointment(r: Row): Appointment {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    proId: str(r, "proId"),
    scheduledDate: dateToDateOnly(r.scheduledDate),
    windowStart: str(r, "windowStart"),
    windowEnd: str(r, "windowEnd"),
    status: str(r, "status") as AppointmentStatus,
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToProAvailability(r: Row): ProAvailability {
  return {
    id: str(r, "id"),
    proId: str(r, "proId"),
    weekday: num(r, "weekday"),
    startTime: str(r, "startTime"),
    endTime: str(r, "endTime"),
  };
}

export function rowToBid(r: Row): Bid {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    proId: str(r, "proId"),
    totalAmountCents: num(r, "totalAmountCents"),
    proCommissionRateBps: num(r, "proCommissionRateBps"),
    proCommissionCents: num(r, "proCommissionCents"),
    customerFeeRateBps: num(r, "customerFeeRateBps"),
    customerFeeCents: num(r, "customerFeeCents"),
    netPayoutCents: num(r, "netPayoutCents"),
    proposalText: str(r, "proposalText"),
    status: str(r, "status") as BidStatus,
    expiresAt: dateToIso(r.expiresAt),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToChatMessage(r: Row): ChatMessage {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    senderId: str(r, "senderId"),
    messageText: str(r, "messageText"),
    flagged: bool(r, "flagged"),
    timestamp: dateToIso(r.timestamp),
  };
}

export function rowToReview(r: Row): Review {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    customerId: str(r, "customerId"),
    proId: str(r, "proId"),
    ratingValue: num(r, "ratingValue"),
    reviewText: str(r, "reviewText"),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToPaymentMilestone(r: Row): PaymentMilestone {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    bidId: str(r, "bidId"),
    seq: num(r, "seq"),
    label: str(r, "label"),
    amountCents: num(r, "amountCents"),
    status: str(r, "status") as MilestoneStatus,
    paymentIntentId: strOrNull(r, "paymentIntentId"),
    transferId: strOrNull(r, "transferId"),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToChangeOrder(r: Row): ChangeOrder {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    proId: str(r, "proId"),
    description: str(r, "description"),
    deltaAmountCents: num(r, "deltaAmountCents"),
    status: str(r, "status") as ChangeOrderStatus,
    approvedAt: dateToIsoOrNull(r.approvedAt),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToJobEvidence(r: Row): JobEvidence {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    uploadedBy: str(r, "uploadedBy"),
    kind: str(r, "kind") as EvidenceKind,
    storageKey: str(r, "storageKey"),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToPayment(r: Row): Payment {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    milestoneId: strOrNull(r, "milestoneId"),
    paymentIntentId: str(r, "paymentIntentId"),
    transferId: strOrNull(r, "transferId"),
    grossCents: num(r, "grossCents"),
    customerFeeCents: num(r, "customerFeeCents"),
    commissionCents: num(r, "commissionCents"),
    netCents: num(r, "netCents"),
    status: str(r, "status") as PaymentStatus,
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToProPayoutAccount(r: Row): ProPayoutAccount {
  return {
    id: str(r, "id"),
    userId: str(r, "userId"),
    stripeAccountId: str(r, "stripeAccountId"),
    onboardingStatus: str(r, "onboardingStatus"),
    kycStatus: str(r, "kycStatus"),
    payoutsEnabled: bool(r, "payoutsEnabled"),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToDispute(r: Row): Dispute {
  return {
    id: str(r, "id"),
    jobId: str(r, "jobId"),
    openedBy: str(r, "openedBy"),
    reason: str(r, "reason"),
    status: str(r, "status") as DisputeStatus,
    resolution: strOrNull(r, "resolution"),
    createdAt: dateToIso(r.createdAt),
    resolvedAt: dateToIsoOrNull(r.resolvedAt),
  };
}

export function rowToReport(r: Row): Report {
  return {
    id: str(r, "id"),
    reporterId: str(r, "reporterId"),
    targetType: str(r, "targetType"),
    targetId: str(r, "targetId"),
    reason: str(r, "reason"),
    status: str(r, "status") as ReportStatus,
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToNotification(r: Row): Notification {
  return {
    id: str(r, "id"),
    userId: str(r, "userId"),
    kind: str(r, "kind"),
    text: str(r, "text"),
    jobId: strOrNull(r, "jobId"),
    read: bool(r, "read"),
    smsSent: bool(r, "smsSent"),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToRefreshToken(r: Row): RefreshToken {
  return {
    id: str(r, "id"),
    userId: str(r, "userId"),
    tokenHash: str(r, "tokenHash"),
    expiresAt: dateToIso(r.expiresAt),
    revokedAt: dateToIsoOrNull(r.revokedAt),
    createdAt: dateToIso(r.createdAt),
  };
}

export function rowToAdminAuditLog(r: Row): AdminAuditLog {
  return {
    id: str(r, "id"),
    adminId: str(r, "adminId"),
    action: str(r, "action"),
    targetType: str(r, "targetType"),
    targetId: str(r, "targetId"),
    detail: strOrNull(r, "detail"),
    createdAt: dateToIso(r.createdAt),
  };
}

/**
 * Assemble a full StoreData from per-model Prisma row arrays, keyed by
 * StoreData collection name (users, companyProfiles, …). Missing keys are
 * treated as empty collections.
 */
export function rowsToStoreData(rows: Record<string, unknown[]>): StoreData {
  const list = (key: StoreKey): Row[] =>
    (rows[key] ?? []).map((r) => r as Row);
  return {
    users: list("users").map(rowToUser),
    companyProfiles: list("companyProfiles").map(rowToCompanyProfile),
    jobPosts: list("jobPosts").map(rowToJobPost),
    jobPrivateDetails: list("jobPrivateDetails").map(rowToJobPrivateDetails),
    appointments: list("appointments").map(rowToAppointment),
    proAvailability: list("proAvailability").map(rowToProAvailability),
    bids: list("bids").map(rowToBid),
    chatMessages: list("chatMessages").map(rowToChatMessage),
    reviews: list("reviews").map(rowToReview),
    paymentMilestones: list("paymentMilestones").map(rowToPaymentMilestone),
    changeOrders: list("changeOrders").map(rowToChangeOrder),
    jobEvidence: list("jobEvidence").map(rowToJobEvidence),
    payments: list("payments").map(rowToPayment),
    proPayoutAccounts: list("proPayoutAccounts").map(rowToProPayoutAccount),
    disputes: list("disputes").map(rowToDispute),
    reports: list("reports").map(rowToReport),
    notifications: list("notifications").map(rowToNotification),
    refreshTokens: list("refreshTokens").map(rowToRefreshToken),
    adminAuditLogs: list("adminAuditLogs").map(rowToAdminAuditLog),
  };
}

/** Empty StoreData skeleton (all 19 collections present, all empty). */
export function emptyStoreData(): StoreData {
  return {
    users: [],
    companyProfiles: [],
    jobPosts: [],
    jobPrivateDetails: [],
    appointments: [],
    proAvailability: [],
    bids: [],
    chatMessages: [],
    reviews: [],
    paymentMilestones: [],
    changeOrders: [],
    jobEvidence: [],
    payments: [],
    proPayoutAccounts: [],
    disputes: [],
    reports: [],
    notifications: [],
    refreshTokens: [],
    adminAuditLogs: [],
  };
}

// ─── StoreData entity → Prisma create payload ───────────────────────────────
// Every converter routes id / foreign-key values through `mapId` and nothing
// else: external identifiers (paymentIntentId, transferId, stripeAccountId,
// slugs, emails, storage keys) pass through verbatim. `mapId` must be total —
// return the input unchanged for ids it does not know.

export type IdMapper = (id: string) => string;
const mapOrNull =
  (mapId: IdMapper) =>
  (v: string | null): string | null =>
    v == null ? null : mapId(v);

export function userToPrisma(e: User, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    email: e.email,
    passwordHash: e.passwordHash,
    role: e.role,
    name: e.name,
    phoneNumber: e.phoneNumber,
    phoneVerified: e.phoneVerified,
    createdAt: isoToDate(e.createdAt),
  };
}

export function companyProfileToPrisma(
  e: CompanyProfile,
  mapId: IdMapper,
): Payload {
  return {
    id: mapId(e.id),
    userId: mapId(e.userId),
    businessName: e.businessName,
    slug: e.slug,
    skillsArray: [...e.skillsArray],
    bio: e.bio,
    portfolioUrls: [...e.portfolioUrls],
    isVerified: e.isVerified,
    verificationTier: e.verificationTier,
    backgroundCheckStatus: e.backgroundCheckStatus,
    licenceNumber: e.licenceNumber,
    licenceTrade: e.licenceTrade,
    licenceState: e.licenceState,
    serviceRadiusMiles: e.serviceRadiusMiles,
    locationLat: e.locationLat,
    locationLng: e.locationLng,
    locationLabel: e.locationLabel,
    responseTimeHours: e.responseTimeHours,
    yearsInBusiness: e.yearsInBusiness,
    createdAt: isoToDate(e.createdAt),
  };
}

export function jobPostToPrisma(e: JobPost, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    customerId: mapId(e.customerId),
    title: e.title,
    category: e.category,
    description: e.description,
    budgetMinCents: e.budgetMinCents,
    budgetMaxCents: e.budgetMaxCents,
    locationLat: e.locationLat,
    locationLng: e.locationLng,
    locationLabel: e.locationLabel,
    status: e.status,
    preferredDate: dateOnlyToDateOrNull(e.preferredDate),
    matchedProLimit: e.matchedProLimit,
    // NOTE: `completionCode` is intentionally stripped — Prisma has no such
    // column. Only the hash is persisted.
    completionCodeHash: e.completionCodeHash,
    completionRequestedAt: isoToDateOrNull(e.completionRequestedAt),
    createdAt: isoToDate(e.createdAt),
  };
}

export function jobPrivateDetailsToPrisma(
  e: JobPrivateDetails,
  mapId: IdMapper,
): Payload {
  return {
    jobId: mapId(e.jobId),
    streetAddress: e.streetAddress,
    unit: e.unit,
    zip: e.zip,
    accessNotes: e.accessNotes,
  };
}

export function appointmentToPrisma(e: Appointment, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    proId: mapId(e.proId),
    scheduledDate: dateOnlyToDate(e.scheduledDate),
    windowStart: e.windowStart,
    windowEnd: e.windowEnd,
    status: e.status,
    createdAt: isoToDate(e.createdAt),
  };
}

export function proAvailabilityToPrisma(
  e: ProAvailability,
  mapId: IdMapper,
): Payload {
  return {
    id: mapId(e.id),
    proId: mapId(e.proId),
    weekday: e.weekday,
    startTime: e.startTime,
    endTime: e.endTime,
  };
}

export function bidToPrisma(e: Bid, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    proId: mapId(e.proId),
    totalAmountCents: e.totalAmountCents,
    proCommissionRateBps: e.proCommissionRateBps,
    proCommissionCents: e.proCommissionCents,
    customerFeeRateBps: e.customerFeeRateBps,
    customerFeeCents: e.customerFeeCents,
    netPayoutCents: e.netPayoutCents,
    proposalText: e.proposalText,
    status: e.status,
    expiresAt: isoToDate(e.expiresAt),
    createdAt: isoToDate(e.createdAt),
  };
}

export function chatMessageToPrisma(e: ChatMessage, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    senderId: mapId(e.senderId),
    messageText: e.messageText,
    flagged: e.flagged,
    timestamp: isoToDate(e.timestamp),
  };
}

export function reviewToPrisma(e: Review, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    customerId: mapId(e.customerId),
    proId: mapId(e.proId),
    ratingValue: e.ratingValue,
    reviewText: e.reviewText,
    createdAt: isoToDate(e.createdAt),
  };
}

export function paymentMilestoneToPrisma(
  e: PaymentMilestone,
  mapId: IdMapper,
): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    bidId: mapId(e.bidId),
    seq: e.seq,
    label: e.label,
    amountCents: e.amountCents,
    status: e.status,
    // Stripe identifiers are NOT row ids — never remapped.
    paymentIntentId: e.paymentIntentId,
    transferId: e.transferId,
    createdAt: isoToDate(e.createdAt),
  };
}

export function changeOrderToPrisma(e: ChangeOrder, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    proId: mapId(e.proId),
    description: e.description,
    deltaAmountCents: e.deltaAmountCents,
    status: e.status,
    approvedAt: isoToDateOrNull(e.approvedAt),
    createdAt: isoToDate(e.createdAt),
  };
}

export function jobEvidenceToPrisma(e: JobEvidence, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    uploadedBy: mapId(e.uploadedBy),
    kind: e.kind,
    storageKey: e.storageKey,
    createdAt: isoToDate(e.createdAt),
  };
}

export function paymentToPrisma(e: Payment, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    milestoneId: mapOrNull(mapId)(e.milestoneId),
    // Stripe identifiers are NOT row ids — never remapped.
    paymentIntentId: e.paymentIntentId,
    transferId: e.transferId,
    grossCents: e.grossCents,
    customerFeeCents: e.customerFeeCents,
    commissionCents: e.commissionCents,
    netCents: e.netCents,
    status: e.status,
    createdAt: isoToDate(e.createdAt),
  };
}

export function proPayoutAccountToPrisma(
  e: ProPayoutAccount,
  mapId: IdMapper,
): Payload {
  return {
    id: mapId(e.id),
    userId: mapId(e.userId),
    // Stripe account id is NOT a row id — never remapped.
    stripeAccountId: e.stripeAccountId,
    onboardingStatus: e.onboardingStatus,
    kycStatus: e.kycStatus,
    payoutsEnabled: e.payoutsEnabled,
    createdAt: isoToDate(e.createdAt),
  };
}

export function disputeToPrisma(e: Dispute, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    jobId: mapId(e.jobId),
    openedBy: mapId(e.openedBy),
    reason: e.reason,
    status: e.status,
    resolution: e.resolution,
    createdAt: isoToDate(e.createdAt),
    resolvedAt: isoToDateOrNull(e.resolvedAt),
  };
}

export function reportToPrisma(e: Report, mapId: IdMapper): Payload {
  return {
    id: mapId(e.id),
    reporterId: mapId(e.reporterId),
    targetType: e.targetType,
    // Polymorphic string in Prisma: remap only lands when targetId is a
    // known row id (mapId passes unknown values through unchanged).
    targetId: mapId(e.targetId),
    reason: e.reason,
    status: e.status,
    createdAt: isoToDate(e.createdAt),
  };
}

export function notificationToPrisma(
  e: Notification,
  mapId: IdMapper,
): Payload {
  return {
    id: mapId(e.id),
    userId: mapId(e.userId),
    kind: e.kind,
    text: e.text,
    jobId: mapOrNull(mapId)(e.jobId),
    read: e.read,
    smsSent: e.smsSent,
    createdAt: isoToDate(e.createdAt),
  };
}

export function refreshTokenToPrisma(
  e: RefreshToken,
  mapId: IdMapper,
): Payload {
  return {
    id: mapId(e.id),
    userId: mapId(e.userId),
    tokenHash: e.tokenHash,
    expiresAt: isoToDate(e.expiresAt),
    revokedAt: isoToDateOrNull(e.revokedAt),
    createdAt: isoToDate(e.createdAt),
  };
}

export function adminAuditLogToPrisma(
  e: AdminAuditLog,
  mapId: IdMapper,
): Payload {
  return {
    id: mapId(e.id),
    adminId: mapId(e.adminId),
    action: e.action,
    targetType: e.targetType,
    // Polymorphic string in Prisma — same treatment as Report.targetId.
    targetId: mapId(e.targetId),
    detail: e.detail,
    createdAt: isoToDate(e.createdAt),
  };
}

/** Per-model Prisma create payloads, keyed by StoreData collection name. */
export interface PrismaPayloads {
  users: Payload[];
  companyProfiles: Payload[];
  jobPosts: Payload[];
  jobPrivateDetails: Payload[];
  appointments: Payload[];
  proAvailability: Payload[];
  bids: Payload[];
  chatMessages: Payload[];
  reviews: Payload[];
  paymentMilestones: Payload[];
  changeOrders: Payload[];
  jobEvidence: Payload[];
  payments: Payload[];
  proPayoutAccounts: Payload[];
  disputes: Payload[];
  reports: Payload[];
  notifications: Payload[];
  refreshTokens: Payload[];
  adminAuditLogs: Payload[];
}

/**
 * Convert a whole StoreData into Prisma create payloads. `mapId` rewrites
 * every id / foreign-key value (seed: human id → UUID; adapter flush:
 * identity, because DB ids are already UUIDs).
 */
export function storeToPrismaPayloads(
  data: StoreData,
  mapId: IdMapper,
): PrismaPayloads {
  return {
    users: data.users.map((e) => userToPrisma(e, mapId)),
    companyProfiles: data.companyProfiles.map((e) =>
      companyProfileToPrisma(e, mapId),
    ),
    jobPosts: data.jobPosts.map((e) => jobPostToPrisma(e, mapId)),
    jobPrivateDetails: data.jobPrivateDetails.map((e) =>
      jobPrivateDetailsToPrisma(e, mapId),
    ),
    appointments: data.appointments.map((e) => appointmentToPrisma(e, mapId)),
    proAvailability: data.proAvailability.map((e) =>
      proAvailabilityToPrisma(e, mapId),
    ),
    bids: data.bids.map((e) => bidToPrisma(e, mapId)),
    chatMessages: data.chatMessages.map((e) => chatMessageToPrisma(e, mapId)),
    reviews: data.reviews.map((e) => reviewToPrisma(e, mapId)),
    paymentMilestones: data.paymentMilestones.map((e) =>
      paymentMilestoneToPrisma(e, mapId),
    ),
    changeOrders: data.changeOrders.map((e) => changeOrderToPrisma(e, mapId)),
    jobEvidence: data.jobEvidence.map((e) => jobEvidenceToPrisma(e, mapId)),
    payments: data.payments.map((e) => paymentToPrisma(e, mapId)),
    proPayoutAccounts: data.proPayoutAccounts.map((e) =>
      proPayoutAccountToPrisma(e, mapId),
    ),
    disputes: data.disputes.map((e) => disputeToPrisma(e, mapId)),
    reports: data.reports.map((e) => reportToPrisma(e, mapId)),
    notifications: data.notifications.map((e) =>
      notificationToPrisma(e, mapId),
    ),
    refreshTokens: data.refreshTokens.map((e) =>
      refreshTokenToPrisma(e, mapId),
    ),
    adminAuditLogs: data.adminAuditLogs.map((e) =>
      adminAuditLogToPrisma(e, mapId),
    ),
  };
}
