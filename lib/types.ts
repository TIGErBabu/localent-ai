// Typed shapes mirroring prisma/schema.prisma 1:1 (camelCase fields).
// The demo data adapter (lib/store.ts) serves these; production swaps in Prisma.

export type Role = "CUSTOMER" | "PRO" | "ADMIN";
export type JobStatus = "OPEN" | "ACCEPTED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED" | "CANCELLED";
export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type MilestoneStatus = "UNFUNDED" | "HELD" | "RELEASED" | "REFUNDED";
export type VerificationTier = "NONE" | "BASIC_ID" | "VERIFIED_PRO";
export type AppointmentStatus = "PROPOSED" | "CONFIRMED" | "RESCHEDULED" | "DONE" | "NO_SHOW";
export type ChangeOrderStatus = "PROPOSED" | "APPROVED" | "REJECTED";
export type EvidenceKind = "BEFORE_PHOTO" | "AFTER_PHOTO" | "CHECKIN";
export type PaymentStatus = "REQUIRES_PAYMENT" | "HELD" | "RELEASED" | "REFUNDED" | "FAILED";
export type DisputeStatus = "OPEN" | "RESOLVED_RELEASE" | "RESOLVED_REFUND";
export type ReportStatus = "OPEN" | "REVIEWED" | "DISMISSED";

export interface User {
  id: string; email: string; passwordHash: string; // demo-only plaintext marker, see README
  role: Role; name: string; phoneNumber: string | null; phoneVerified: boolean; createdAt: string;
}
export interface CompanyProfile {
  id: string; userId: string; businessName: string; slug: string; skillsArray: string[];
  bio: string | null; portfolioUrls: string[]; isVerified: boolean; verificationTier: VerificationTier;
  backgroundCheckStatus: string | null; licenceNumber: string | null; licenceTrade: string | null; licenceState: string | null;
  serviceRadiusMiles: number; locationLat: number; locationLng: number; locationLabel: string;
  responseTimeHours: number; yearsInBusiness: number; createdAt: string;
}
export interface JobPost {
  id: string; customerId: string; title: string; category: string; description: string;
  budgetMinCents: number; budgetMaxCents: number;
  locationLat: number; locationLng: number; locationLabel: string; // rounded public coords
  status: JobStatus; preferredDate: string | null; matchedProLimit: number;
  completionCode: string | null; // demo: plaintext so the customer can read it; production stores completionCodeHash only
  completionRequestedAt: string | null; createdAt: string;
}
export interface JobPrivateDetails {
  jobId: string; streetAddress: string; unit: string | null; zip: string; accessNotes: string | null;
}
export interface Appointment {
  id: string; jobId: string; proId: string; scheduledDate: string; windowStart: string; windowEnd: string;
  status: AppointmentStatus; createdAt: string;
}
export interface ProAvailability { id: string; proId: string; weekday: number; startTime: string; endTime: string; }
export interface Bid {
  id: string; jobId: string; proId: string; totalAmountCents: number;
  proCommissionRateBps: number; proCommissionCents: number; customerFeeRateBps: number; customerFeeCents: number;
  netPayoutCents: number; proposalText: string; status: BidStatus; expiresAt: string; createdAt: string;
}
export interface ChatMessage { id: string; jobId: string; senderId: string; messageText: string; flagged: boolean; timestamp: string; }
export interface Review {
  id: string; jobId: string; customerId: string; proId: string; ratingValue: number; reviewText: string; createdAt: string;
}
export interface PaymentMilestone {
  id: string; jobId: string; bidId: string; seq: number; label: string; amountCents: number;
  status: MilestoneStatus; paymentIntentId: string | null; transferId: string | null; createdAt: string;
}
export interface ChangeOrder {
  id: string; jobId: string; proId: string; description: string; deltaAmountCents: number;
  status: ChangeOrderStatus; approvedAt: string | null; createdAt: string;
}
export interface JobEvidence { id: string; jobId: string; uploadedBy: string; kind: EvidenceKind; storageKey: string; createdAt: string; }
export interface Payment {
  id: string; jobId: string; milestoneId: string | null; paymentIntentId: string; transferId: string | null;
  grossCents: number; customerFeeCents: number; commissionCents: number; netCents: number; status: PaymentStatus; createdAt: string;
}
export interface ProPayoutAccount {
  id: string; userId: string; stripeAccountId: string; onboardingStatus: string; kycStatus: string; payoutsEnabled: boolean; createdAt: string;
}
export interface Dispute { id: string; jobId: string; openedBy: string; reason: string; status: DisputeStatus; resolution: string | null; createdAt: string; resolvedAt: string | null; }
export interface Report { id: string; reporterId: string; targetType: string; targetId: string; reason: string; status: ReportStatus; createdAt: string; }
export interface Notification { id: string; userId: string; kind: string; text: string; jobId: string | null; read: boolean; smsSent: boolean; createdAt: string; }
export interface RefreshToken { id: string; userId: string; tokenHash: string; expiresAt: string; revokedAt: string | null; createdAt: string; }
export interface AdminAuditLog { id: string; adminId: string; action: string; targetType: string; targetId: string; detail: string | null; createdAt: string; }

export interface StoreData {
  users: User[]; companyProfiles: CompanyProfile[]; jobPosts: JobPost[]; jobPrivateDetails: JobPrivateDetails[];
  appointments: Appointment[]; proAvailability: ProAvailability[]; bids: Bid[]; chatMessages: ChatMessage[];
  reviews: Review[]; paymentMilestones: PaymentMilestone[]; changeOrders: ChangeOrder[]; jobEvidence: JobEvidence[];
  payments: Payment[]; proPayoutAccounts: ProPayoutAccount[]; disputes: Dispute[]; reports: Report[];
  notifications: Notification[]; refreshTokens: RefreshToken[]; adminAuditLogs: AdminAuditLog[];
}
