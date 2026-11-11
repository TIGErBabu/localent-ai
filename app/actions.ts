"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, getSessionUser } from "@/lib/session";
import { db, findJob, findUserByEmail, acceptedBid, milestonesForJob, notify, audit, matchProsForJob, profileByUserId, milestone1Funded } from "@/lib/store";
import { canChat, isJobCustomer, isJobPro } from "@/lib/policy";
import { computeSplit, maskContacts, money, nowIso, roundCoord, slugify, uid } from "@/lib/utils";
import { config } from "@/lib/config";
import { chargeToEscrow, refundPaymentIntent, runBackgroundCheck, sendSms, transferToPro } from "@/lib/adapters";
import type { User } from "@/lib/types";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);

async function setSession(user: User) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, `${user.id}.${user.role}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
async function me(): Promise<User> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  return u;
}
function completionCode(): string { return String(Math.floor(100000 + Math.random() * 900000)); }

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function loginAction(fd: FormData) {
  const user = findUserByEmail(s(fd, "email"));
  if (!user || user.passwordHash !== s(fd, "password")) redirect("/login?error=1");
  await setSession(user);
  redirect(user.role === "ADMIN" ? "/admin" : user.role === "PRO" ? "/dashboard/pro" : "/dashboard/customer");
}
export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
export async function registerCustomerAction(fd: FormData) {
  const email = s(fd, "email");
  if (findUserByEmail(email)) redirect("/register/customer?error=exists");
  const user: User = { id: uid("u-cust"), email, passwordHash: s(fd, "password") || "demo", role: "CUSTOMER", name: s(fd, "name"), phoneNumber: s(fd, "phone") || null, phoneVerified: false, createdAt: nowIso() };
  db().users.push(user);
  await setSession(user);
  redirect("/dashboard/customer");
}
export async function registerProAction(fd: FormData) {
  const email = s(fd, "email");
  if (findUserByEmail(email)) redirect("/register/pro?error=exists");
  const user: User = { id: uid("u-pro"), email, passwordHash: s(fd, "password") || "demo", role: "PRO", name: s(fd, "name"), phoneNumber: s(fd, "phone") || null, phoneVerified: false, createdAt: nowIso() };
  db().users.push(user);
  const business = s(fd, "business");
  let slug = slugify(business); let i = 2;
  while (db().companyProfiles.some((p) => p.slug === slug)) slug = `${slugify(business)}-${i++}`;
  db().companyProfiles.push({
    id: uid("cp"), userId: user.id, businessName: business, slug, skillsArray: [s(fd, "category") || "handyman"],
    bio: s(fd, "bio") || null, portfolioUrls: [], isVerified: false, verificationTier: "NONE",
    backgroundCheckStatus: null, licenceNumber: null, licenceTrade: null, licenceState: null,
    serviceRadiusMiles: 25, locationLat: 29.6516, locationLng: -82.3248, locationLabel: config.metro,
    responseTimeHours: 4, yearsInBusiness: 1, createdAt: nowIso(),
  });
  db().proPayoutAccounts.push({ id: uid("po"), userId: user.id, stripeAccountId: `acct_demo_${user.id}`, onboardingStatus: "NOT_STARTED", kycStatus: "NOT_STARTED", payoutsEnabled: false, createdAt: nowIso() });
  await setSession(user);
  redirect("/dashboard/pro");
}

// ─── Jobs & matching ─────────────────────────────────────────────────────────
export async function postJobAction(fd: FormData) {
  const user = await me();
  if (user.role !== "CUSTOMER") redirect("/login");
  const jobId = uid("job");
  const job = {
    id: jobId, customerId: user.id, title: s(fd, "title"), category: s(fd, "category"),
    description: s(fd, "description"), budgetMinCents: Math.round(n(fd, "budgetMin") * 100),
    budgetMaxCents: Math.round(n(fd, "budgetMax") * 100),
    locationLat: roundCoord(29.6516 + (Math.random() - 0.5) * 0.04), locationLng: roundCoord(-82.3248 + (Math.random() - 0.5) * 0.04),
    locationLabel: `${config.metro} (approx.)`, status: "OPEN" as const, preferredDate: s(fd, "preferredDate") || null,
    matchedProLimit: config.matchedProLimit, completionCode: null, completionRequestedAt: null, createdAt: nowIso(),
  };
  db().jobPosts.push(job);
  db().jobPrivateDetails.push({ jobId, streetAddress: s(fd, "streetAddress"), unit: s(fd, "unit") || null, zip: s(fd, "zip"), accessNotes: s(fd, "accessNotes") || null });
  // Blueprint 4.1 steps 2–3: match and alert nearby pros (SMS adapter is env-gated).
  for (const m of matchProsForJob(job)) {
    notify(m.profile.userId, "NEW_LEAD", `New ${job.category} lead near ${job.locationLabel}: ${job.title}`, jobId);
    const pro = db().users.find((u) => u.id === m.profile.userId);
    if (pro?.phoneNumber) await sendSms(pro.phoneNumber, `Localent: new ${job.category} lead — ${job.title}`);
  }
  redirect(`/dashboard/customer/jobs/${jobId}`);
}

// ─── Bids ────────────────────────────────────────────────────────────────────
export async function submitBidAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job || user.role !== "PRO" || job.status !== "OPEN") redirect("/dashboard/pro/leads");
  const total = Math.round(n(fd, "totalDollars") * 100);
  if (total <= 0) redirect(`/dashboard/pro/leads?job=${job.id}&error=amount`);
  // Split is computed server-side from config rates — client numbers are ignored.
  const split = computeSplit(total, config.proCommissionBps, config.customerFeeBps);
  db().bids.push({
    id: uid("bid"), jobId: job.id, proId: user.id, totalAmountCents: total,
    proCommissionRateBps: config.proCommissionBps, proCommissionCents: split.proCommissionCents,
    customerFeeRateBps: config.customerFeeBps, customerFeeCents: split.customerFeeCents,
    netPayoutCents: split.netPayoutCents, proposalText: s(fd, "proposal"), status: "PENDING",
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), createdAt: nowIso(),
  });
  notify(job.customerId, "NEW_BID", `${profileByUserId(user.id)?.businessName ?? user.name} bid ${money(total)} on “${job.title}”.`, job.id);
  redirect(`/dashboard/pro/jobs/${job.id}`);
}
export async function acceptBidAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  const bid = db().bids.find((b) => b.id === s(fd, "bidId"));
  if (!job || !bid || !isJobCustomer(user, job) || bid.status !== "PENDING" || job.status !== "OPEN") redirect("/dashboard/customer");
  // Single-accepted-bid invariant (partial unique index in production schema).
  for (const b of db().bids.filter((x) => x.jobId === job.id)) b.status = b.id === bid.id ? "ACCEPTED" : "REJECTED";
  job.status = "ACCEPTED";
  // Milestones: 30% deposit/materials + balance (blueprint v2 §0.2).
  const m1 = Math.round((bid.totalAmountCents * config.milestoneDepositPct) / 100);
  db().paymentMilestones.push(
    { id: uid("ms"), jobId: job.id, bidId: bid.id, seq: 1, label: "Deposit & materials", amountCents: m1, status: "UNFUNDED", paymentIntentId: null, transferId: null, createdAt: nowIso() },
    { id: uid("ms"), jobId: job.id, bidId: bid.id, seq: 2, label: "Balance on completion", amountCents: bid.totalAmountCents - m1, status: "UNFUNDED", paymentIntentId: null, transferId: null, createdAt: nowIso() },
  );
  notify(bid.proId, "SYSTEM", `Your bid was accepted for “${job.title}”. Waiting on the customer to fund the deposit.`, job.id);
  redirect(`/dashboard/customer/jobs/${job.id}/pay`);
}

// ─── Escrow (simulated Stripe test checkout in demo mode) ────────────────────
export async function fundMilestoneAction(fd: FormData) {
  const user = await me();
  const ms = db().paymentMilestones.find((m) => m.id === s(fd, "milestoneId"));
  const job = ms ? findJob(ms.jobId) : undefined;
  if (!ms || !job || !isJobCustomer(user, job) || ms.status !== "UNFUNDED") redirect("/dashboard/customer");
  const bid = db().bids.find((b) => b.id === ms.bidId)!;
  const feeShare = Math.round((bid.customerFeeCents * ms.amountCents) / bid.totalAmountCents);
  const commissionShare = Math.round((bid.proCommissionCents * ms.amountCents) / bid.totalAmountCents);
  const charge = await chargeToEscrow(job.id, ms.amountCents + feeShare);
  ms.status = "HELD"; ms.paymentIntentId = charge.paymentIntentId;
  db().payments.push({ id: uid("pay"), jobId: job.id, milestoneId: ms.id, paymentIntentId: charge.paymentIntentId, transferId: null, grossCents: ms.amountCents + feeShare, customerFeeCents: feeShare, commissionCents: commissionShare, netCents: ms.amountCents - commissionShare, status: "HELD", createdAt: nowIso() });
  if (ms.seq === 1 && !job.completionCode) job.completionCode = completionCode(); // issued to customer at funding
  notify(bid.proId, "SYSTEM", `Deposit funded and held in escrow for “${job.title}”. The exact address is now visible to you.`, job.id);
  redirect(`/dashboard/customer/jobs/${job.id}`);
}
async function releaseMilestone(msId: string, actor: User) {
  const ms = db().paymentMilestones.find((m) => m.id === msId);
  if (!ms || ms.status !== "HELD") return;
  const job = findJob(ms.jobId)!;
  const bid = db().bids.find((b) => b.id === ms.bidId)!;
  const acct = db().proPayoutAccounts.find((a) => a.userId === bid.proId);
  const t = await transferToPro(acct?.stripeAccountId ?? "acct_demo", ms.amountCents - Math.round((bid.proCommissionCents * ms.amountCents) / bid.totalAmountCents));
  ms.status = "RELEASED"; ms.transferId = t.transferId;
  const pay = db().payments.find((p) => p.milestoneId === ms.id);
  if (pay) { pay.status = "RELEASED"; pay.transferId = t.transferId; }
  notify(bid.proId, "PAYOUT", `${money(ms.amountCents)} escrow released for “${job.title}” (milestone ${ms.seq}). Net of commission is on its way to your bank.`, job.id);
  void actor;
}
async function refundMilestone(msId: string) {
  const ms = db().paymentMilestones.find((m) => m.id === msId);
  if (!ms || ms.status !== "HELD") return;
  if (ms.paymentIntentId) await refundPaymentIntent(ms.paymentIntentId);
  ms.status = "REFUNDED";
  const pay = db().payments.find((p) => p.milestoneId === ms.id);
  if (pay) pay.status = "REFUNDED";
}

// ─── Scheduling ──────────────────────────────────────────────────────────────
export async function scheduleAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job) redirect("/dashboard/customer");
  const bid = acceptedBid(job.id);
  const existing = db().appointments.find((a) => a.jobId === job.id);
  const isReschedule = !!existing && s(fd, "mode") === "reschedule";
  if (!isJobCustomer(user, job) && !(user.role === "PRO" && bid?.proId === user.id)) redirect("/login");
  if (existing) {
    existing.scheduledDate = s(fd, "date"); existing.windowStart = s(fd, "windowStart"); existing.windowEnd = s(fd, "windowEnd");
    existing.status = isReschedule ? "RESCHEDULED" : "CONFIRMED";
  } else if (bid) {
    db().appointments.push({ id: uid("appt"), jobId: job.id, proId: bid.proId, scheduledDate: s(fd, "date"), windowStart: s(fd, "windowStart"), windowEnd: s(fd, "windowEnd"), status: user.role === "PRO" ? "PROPOSED" : "CONFIRMED", createdAt: nowIso() });
  }
  if (job.status === "ACCEPTED") job.status = "SCHEDULED";
  const other = user.id === job.customerId ? bid?.proId : job.customerId;
  if (other) notify(other, "APPOINTMENT", `Appointment ${isReschedule ? "rescheduled" : "set"} for “${job.title}”: ${s(fd, "date")}, ${s(fd, "windowStart")}–${s(fd, "windowEnd")}.`, job.id);
  redirect(user.role === "PRO" ? `/dashboard/pro/jobs/${job.id}` : `/dashboard/customer/jobs/${job.id}/schedule`);
}

// ─── Chat (API-first; masking before funding — blueprint 4.3) ────────────────
export async function sendMessageAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job || !canChat(user, job)) redirect("/login");
  const raw = s(fd, "text");
  if (!raw) redirect(s(fd, "back") || "/dashboard/customer");
  const funded = milestone1Funded(job.id);
  const { text, flagged } = funded ? { text: raw, flagged: false } : maskContacts(raw);
  db().chatMessages.push({ id: uid("msg"), jobId: job.id, senderId: user.id, messageText: text, flagged, timestamp: nowIso() });
  const bid = acceptedBid(job.id);
  const others = [job.customerId, bid?.proId].filter((x): x is string => !!x && x !== user.id);
  for (const o of others) notify(o, "MESSAGE", `New message on “${job.title}”.`, job.id);
  revalidatePath(`/dashboard/customer/jobs/${job.id}`);
  revalidatePath(`/dashboard/pro/jobs/${job.id}`);
  redirect(s(fd, "back") || `/dashboard/customer/jobs/${job.id}`);
}

// ─── On-site work: check-in, evidence, change orders, completion ─────────────
export async function checkInAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job || !isJobPro(user, job)) redirect("/dashboard/pro");
  db().jobEvidence.push({ id: uid("ev"), jobId: job.id, uploadedBy: user.id, kind: "CHECKIN", storageKey: `demo://evidence/${job.id}/checkin-${Date.now()}`, createdAt: nowIso() });
  if (job.status === "SCHEDULED" || job.status === "ACCEPTED") job.status = "IN_PROGRESS";
  notify(job.customerId, "SYSTEM", `Your pro checked in on site for “${job.title}”.`, job.id);
  redirect(`/dashboard/pro/jobs/${job.id}`);
}
export async function addEvidenceAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job || !isJobPro(user, job)) redirect("/dashboard/pro");
  const kind = s(fd, "kind") === "AFTER_PHOTO" ? "AFTER_PHOTO" : "BEFORE_PHOTO";
  db().jobEvidence.push({ id: uid("ev"), jobId: job.id, uploadedBy: user.id, kind, storageKey: `demo://evidence/${job.id}/${kind.toLowerCase()}-${Date.now()}`, createdAt: nowIso() });
  redirect(`/dashboard/pro/jobs/${job.id}`);
}
export async function proposeChangeOrderAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job || !isJobPro(user, job)) redirect("/dashboard/pro");
  db().changeOrders.push({ id: uid("co"), jobId: job.id, proId: user.id, description: s(fd, "description"), deltaAmountCents: Math.round(n(fd, "deltaDollars") * 100), status: "PROPOSED", approvedAt: null, createdAt: nowIso() });
  notify(job.customerId, "SYSTEM", `Change order proposed on “${job.title}”: ${money(Math.round(n(fd, "deltaDollars") * 100))}. Your approval is needed before extra work starts.`, job.id);
  redirect(`/dashboard/pro/jobs/${job.id}`);
}
export async function decideChangeOrderAction(fd: FormData) {
  const user = await me();
  const co = db().changeOrders.find((c) => c.id === s(fd, "changeOrderId"));
  const job = co ? findJob(co.jobId) : undefined;
  if (!co || !job || !isJobCustomer(user, job) || co.status !== "PROPOSED") redirect("/dashboard/customer");
  const approve = s(fd, "decision") === "approve";
  co.status = approve ? "APPROVED" : "REJECTED";
  co.approvedAt = approve ? nowIso() : null;
  if (approve) {
    // Approved deltas adjust the FINAL milestone; a positive delta must be funded before extra work.
    const ms = milestonesForJob(job.id).find((m) => m.seq === 2);
    if (ms && ms.status === "UNFUNDED") ms.amountCents = Math.max(0, ms.amountCents + co.deltaAmountCents);
    else if (ms && ms.status === "HELD") ms.amountCents = Math.max(0, ms.amountCents + co.deltaAmountCents);
    notify(co.proId, "SYSTEM", `Change order approved on “${job.title}” (${money(co.deltaAmountCents)} added to the balance milestone).`, job.id);
  } else {
    notify(co.proId, "SYSTEM", `Change order declined on “${job.title}”.`, job.id);
  }
  redirect(`/dashboard/customer/jobs/${job.id}`);
}
export async function requestCompletionAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job || !isJobPro(user, job)) redirect("/dashboard/pro");
  if (!job.completionCode || s(fd, "code") !== job.completionCode) redirect(`/dashboard/pro/jobs/${job.id}?error=code`);
  const ev = db().jobEvidence.filter((e) => e.jobId === job.id);
  if (!ev.some((e) => e.kind === "BEFORE_PHOTO") || !ev.some((e) => e.kind === "AFTER_PHOTO"))
    redirect(`/dashboard/pro/jobs/${job.id}?error=evidence`);
  job.completionRequestedAt = nowIso();
  notify(job.customerId, "SYSTEM", `Your pro reports “${job.title}” complete and entered your confirmation code. Confirm to release the balance — it auto-releases after ${config.autoReleaseHours}h if you do nothing and raise no dispute.`, job.id);
  redirect(`/dashboard/pro/jobs/${job.id}?done=requested`);
}
export async function confirmCompletionAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job || !isJobCustomer(user, job)) redirect("/dashboard/customer");
  const ms2 = milestonesForJob(job.id).find((m) => m.seq === 2);
  if (ms2 && ms2.status === "UNFUNDED") redirect(`/dashboard/customer/jobs/${job.id}/pay?next=complete`);
  for (const ms of milestonesForJob(job.id)) await releaseMilestone(ms.id, user);
  job.status = "COMPLETED";
  const appt = db().appointments.find((a) => a.jobId === job.id);
  if (appt) appt.status = "DONE";
  redirect(`/dashboard/customer/jobs/${job.id}/review`);
}

// ─── Disputes & reviews & reports ────────────────────────────────────────────
export async function openDisputeAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  if (!job || !(isJobCustomer(user, job) || isJobPro(user, job))) redirect("/login");
  job.status = "DISPUTED";
  db().disputes.push({ id: uid("disp"), jobId: job.id, openedBy: user.id, reason: s(fd, "reason"), status: "OPEN", resolution: null, createdAt: nowIso(), resolvedAt: null });
  redirect(user.role === "PRO" ? `/dashboard/pro/jobs/${job.id}` : `/dashboard/customer/jobs/${job.id}`);
}
export async function submitReviewAction(fd: FormData) {
  const user = await me();
  const job = findJob(s(fd, "jobId"));
  const bid = job ? acceptedBid(job.id) : undefined;
  if (!job || !bid || !isJobCustomer(user, job) || job.status !== "COMPLETED") redirect("/dashboard/customer");
  if (db().reviews.some((r) => r.jobId === job.id && r.proId === bid.proId && r.customerId === user.id))
    redirect(`/dashboard/customer/jobs/${job.id}`);
  db().reviews.push({ id: uid("rev"), jobId: job.id, customerId: user.id, proId: bid.proId, ratingValue: Math.min(5, Math.max(1, n(fd, "rating") || 5)), reviewText: s(fd, "text"), createdAt: nowIso() });
  redirect(`/pros/${profileByUserId(bid.proId)?.slug ?? ""}`);
}
export async function reportProfileAction(fd: FormData) {
  const user = await me();
  db().reports.push({ id: uid("rep"), reporterId: user.id, targetType: "USER", targetId: s(fd, "targetId"), reason: s(fd, "reason"), status: "OPEN", createdAt: nowIso() });
  redirect(`/pros/${s(fd, "slug")}?reported=1`);
}

// ─── Pro profile / availability / wallet / verification ──────────────────────
export async function updateProfileAction(fd: FormData) {
  const user = await me();
  const p = profileByUserId(user.id);
  if (!p) redirect("/dashboard/pro");
  p.businessName = s(fd, "businessName") || p.businessName;
  p.bio = s(fd, "bio") || p.bio;
  p.skillsArray = fd.getAll("skills").map(String).filter(Boolean);
  p.serviceRadiusMiles = n(fd, "radius") || p.serviceRadiusMiles;
  p.responseTimeHours = n(fd, "responseTime") || p.responseTimeHours;
  if (s(fd, "portfolioLabel")) p.portfolioUrls = [...p.portfolioUrls, `demo://portfolio/${slugify(s(fd, "portfolioLabel"))}`].slice(0, 8);
  redirect("/dashboard/pro/profile?saved=1");
}
export async function updateAvailabilityAction(fd: FormData) {
  const user = await me();
  db().proAvailability = db().proAvailability.filter((a) => a.proId !== user.id);
  for (let d = 0; d <= 6; d++) {
    if (fd.get(`day-${d}`)) db().proAvailability.push({ id: uid("av"), proId: user.id, weekday: d, startTime: s(fd, `start-${d}`) || "08:00", endTime: s(fd, `end-${d}`) || "17:00" });
  }
  redirect("/dashboard/pro/availability?saved=1");
}
export async function submitVerificationAction(fd: FormData) {
  const user = await me();
  const p = profileByUserId(user.id);
  if (!p) redirect("/dashboard/pro");
  p.licenceNumber = s(fd, "licenceNumber"); p.licenceTrade = s(fd, "licenceTrade"); p.licenceState = s(fd, "licenceState") || "FL";
  const bg = await runBackgroundCheck(user.id);
  p.backgroundCheckStatus = bg.status;
  notify("u-admin", "SYSTEM", `${p.businessName} submitted verification documents (${p.licenceTrade} licence ${p.licenceNumber}).`, null);
  redirect("/dashboard/pro/profile?verification=submitted");
}
export async function connectPayoutsAction() {
  const user = await me();
  const acct = db().proPayoutAccounts.find((a) => a.userId === user.id);
  if (acct) { acct.onboardingStatus = "COMPLETE"; acct.kycStatus = "VERIFIED"; acct.payoutsEnabled = true; }
  redirect("/dashboard/pro/wallet?connected=1");
}
export async function updateSettingsAction(fd: FormData) {
  const user = await me();
  user.name = s(fd, "name") || user.name;
  user.phoneNumber = s(fd, "phone") || user.phoneNumber;
  redirect(user.role === "PRO" ? "/dashboard/pro" : "/dashboard/customer/settings?saved=1");
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export async function adminVerifyAction(fd: FormData) {
  const admin = await me();
  if (admin.role !== "ADMIN") redirect("/login");
  const p = db().companyProfiles.find((x) => x.id === s(fd, "profileId"));
  if (!p) redirect("/admin/verifications");
  const approve = s(fd, "decision") === "approve";
  if (approve) {
    p.verificationTier = p.licenceNumber ? "VERIFIED_PRO" : "BASIC_ID";
    p.isVerified = p.verificationTier === "VERIFIED_PRO";
    p.backgroundCheckStatus = "PASSED";
    audit(admin, "VERIFY_PRO", "COMPANY_PROFILE", p.id, `Tier set to ${p.verificationTier}; background check PASSED.`);
    notify(p.userId, "SYSTEM", `Good news — your business is now ${p.verificationTier === "VERIFIED_PRO" ? "a Verified Pro" : "ID-verified (Basic)"} on Localent.`, null);
  } else {
    p.backgroundCheckStatus = "REJECTED";
    audit(admin, "REJECT_VERIFICATION", "COMPANY_PROFILE", p.id, s(fd, "note") || "Documents did not pass review.");
    notify(p.userId, "SYSTEM", "Your verification submission was not approved. Check your profile for what to resubmit.", null);
  }
  redirect("/admin/verifications");
}
export async function adminResolveDisputeAction(fd: FormData) {
  const admin = await me();
  if (admin.role !== "ADMIN") redirect("/login");
  const d = db().disputes.find((x) => x.id === s(fd, "disputeId"));
  const job = d ? findJob(d.jobId) : undefined;
  if (!d || !job || d.status !== "OPEN") redirect("/admin/disputes");
  const release = s(fd, "decision") === "release";
  if (release) {
    for (const ms of milestonesForJob(job.id)) await releaseMilestone(ms.id, admin);
    job.status = "COMPLETED";
    d.status = "RESOLVED_RELEASE";
    audit(admin, "RESOLVE_DISPUTE_RELEASE", "DISPUTE", d.id, "Held escrow released to pro.");
  } else {
    for (const ms of milestonesForJob(job.id)) await refundMilestone(ms.id);
    job.status = "CANCELLED";
    d.status = "RESOLVED_REFUND";
    audit(admin, "RESOLVE_DISPUTE_REFUND", "DISPUTE", d.id, "Held escrow refunded to customer.");
  }
  d.resolution = s(fd, "note") || (release ? "Released to pro after review." : "Refunded to customer after review.");
  d.resolvedAt = nowIso();
  redirect("/admin/disputes");
}
export async function adminReportAction(fd: FormData) {
  const admin = await me();
  if (admin.role !== "ADMIN") redirect("/login");
  const r = db().reports.find((x) => x.id === s(fd, "reportId"));
  if (r) {
    r.status = s(fd, "decision") === "dismiss" ? "DISMISSED" : "REVIEWED";
    audit(admin, "REPORT_" + r.status, "REPORT", r.id, `Report marked ${r.status}.`);
  }
  redirect("/admin/reports");
}

