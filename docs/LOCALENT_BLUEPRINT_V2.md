# Localent.ai — Architecture Blueprint v2
Status: REVISED 2026-11-10. All Honey recommendations accepted by TIGEr Babu and folded in.
Hosting APPROVED 2026-11-10 by TIGEr Babu: PRIVATE GitHub repo (his account) + Vercel demo deployment + Supabase free + Stripe test mode; transfer to company accounts later (repo transfer + Vercel/Supabase re-point + company Stripe for live). §7 fee/auto-release defaults adopted as config values (pro 1000 bps, customer 500 bps, 72h). Remaining §7 items (launch metro name, boss's fee ruling) are config/seed data and do not block Phase 1.
v1 blueprint was delivered in the Golok Global chat on 2026-11-10; this v2 supersedes it where they differ.

## 0. What changed v1 → v2
1. Scheduling is now a core system (appointments + arrival windows), not an afterthought.
2. Milestone payments replace single end-payment (deposit/materials + balance).
3. Change orders are a first-class entity — bid price is no longer assumed = final price.
4. Fee model split: lower pro commission + visible customer service fee (defaults proposed in §7).
5. Anti-leakage by design: contact masking until escrow is funded; completion confirmation code; before/after photo evidence.
6. Verification tiers: Basic (ID) vs Verified Pro (background check + trade licence where required) — honestly labelled badges.
7. SMS notifications for pros from day one (Twilio) + installable PWA for the pro side.
8. Launch scope narrowed: ONE metro, 3 launch categories; platform stays category-agnostic underneath.
9. Map lead feed CUT for v1 → distance-sorted list feed. PostGIS CUT for v1 → lat/lng + bounding-box radius search.
10. Admin dispute split-resolution UI deferred — v1 disputes resolve as full release or full refund, executed manually via Admin → Stripe, logged in AdminAuditLog.
11. Bid flow tightened: job offered to a limited matched set (default 5 pros), bid expiry, response-time shown to customer.

## 1. Technology stack (v2 deltas only — rest unchanged from v1)
- Frontend: Next.js (App Router) + React + TypeScript strict + Tailwind. Tokens unchanged: trust #1E3A8A, action #F59E0B (buttons/CTAs only — never body text on white, fails contrast), slate/white surfaces. Pro dashboard ships as an installable PWA.
- Backend/API: Node.js inside Next.js Route Handlers, service-layer modules, middleware chain: authenticate → role gate → resource policy → handler. Extractable to standalone Express later.
- Database: PostgreSQL (Supabase-hosted) — single source of truth. Prisma ORM, pooled runtime connection, direct connection for migrations. NO PostGIS in v1: location_lat / location_lng DECIMAL(10,7) + bounding-box pre-filter in SQL, haversine ranking in the service layer.
- Realtime + storage: Supabase Realtime broadcast channels per job (job:{jobId}); chat writes go through our API first (custom JWT auth means Supabase RLS is not the gatekeeper). Private buckets: portfolios, job-images, verification-docs; signed URLs only, issued after an API ownership/participation check.
- Payments: Stripe Connect Express (pros) + PaymentIntents + Separate Charges and Transfers. Customer pays the platform; funds held as HELD; completion triggers Transfer of net to pro. Commission + service fee never leave the platform balance. Webhooks are the only payment source of truth.
- Notifications: Twilio SMS (new lead, new message digest, appointment reminders, payout released) + transactional email. Pros are in the field — SMS is primary, dashboard is secondary.
- Verification: background-check provider integration (e.g. Checkr) for Verified Pro tier; licence numbers stored per trade/state, admin-reviewed.
- Money rules: integer cents everywhere; rates in basis points, snapshotted per bid; client-submitted split numbers always ignored — server computes all splits.

## 2. Routing blueprint (v2 deltas)
Public (unchanged from v1, plus): directory/storefront pages only go live for the launch metro + 3 launch categories; other category pages stay draft/noindex until that city launches.
- / (landing, launch-metro localised), /services/[category], /directory, /pros/[slug], /login, /register/customer, /register/pro

Customer /dashboard/customer/*:
- / overview (active jobs, bids awaiting decision, escrow status)
- /jobs/new — post job: category, description, scope photos, budget range, preferred dates, approximate public location; exact address goes to JobPrivateDetails only
- /jobs/[id] — control room: status timeline, appointment, bids, chat, escrow panel, change orders
- /jobs/[id]/bids — compare bids: total, service fee, what pro receives, rating, response time; bid expiry countdown
- /jobs/[id]/pay — fund milestone 1 (deposit/materials) then milestone 2 (balance) via Stripe
- /jobs/[id]/schedule — pick/confirm appointment slot + arrival window; reschedule within policy window
- /jobs/[id]/review — only when COMPLETED + released (verified review)
- /messages, /settings

Pro /dashboard/pro/* (PWA):
- / overview (new leads count, today's appointments, pending payouts)
- /profile — company profile, skills array, service radius, portfolio (capped photo count in v1), verification tier status + background-check/licence submission
- /leads — LIST feed (no map in v1): matched jobs within radius, distance-sorted, approximate area only, bid composer with live split preview (total / commission / your net; customer fee shown separately, not deducted from pro)
- /jobs/[id] — accepted job: exact address revealed ONLY after milestone 1 funded; appointment, chat, check-in, before/after photo upload, change-order request, completion flow (enter customer's confirmation code)
- /wallet — Connect onboarding/KYC status, payout + escrow-release history
- /messages, /availability — weekly availability grid that feeds scheduling

Admin /admin/*:
- / overview: gross volume, commission + service-fee revenue, escrow held, disputes open
- /verifications — credential + licence queue, tier approve/reject
- /disputes — full job/chat/payment/photo history; resolve = release OR refund (v1; split deferred); every action in AdminAuditLog
- /reports, /users, /jobs, /payments (ledger + Stripe reconciliation view)

## 3. Data architecture (v2)
Core v1 tables unchanged unless noted: Users, CompanyProfiles, JobPosts, Bids, ChatMessages, Reviews,
JobPrivateDetails, Payments, ProPayoutAccounts, Disputes, Reports, Notifications, RefreshTokens, AdminAuditLog.

Changes and additions:
- Users: + phone_number (E.164, for SMS), phone_verified BOOLEAN.
- CompanyProfiles: skills_array TEXT[] (GIN index), service_radius_miles INT, location_lat/lng DECIMAL(10,7) (replaces GEOGRAPHY), portfolio_urls capped, verification_tier ENUM(NONE, BASIC_ID, VERIFIED_PRO) replaces bare is_verified; is_verified retained as a derived flag = (tier = VERIFIED_PRO) for storefront badges. + background_check_status, licence_number, licence_trade, licence_state.
- JobPosts: status ENUM now OPEN, ACCEPTED, SCHEDULED, IN_PROGRESS, COMPLETED, DISPUTED, CANCELLED. + preferred_date, matched_pro_limit INT default 5, public location = rounded coordinates (~0.5 mi) only.
- Appointments (NEW): id, job_id FK UNIQUE, pro_id FK, scheduled_date DATE, window_start/window_end TIME, status ENUM(PROPOSED, CONFIRMED, RESCHEDULED, DONE, NO_SHOW), created_at.
- ProAvailability (NEW): id, pro_id FK, weekday SMALLINT, start_time, end_time.
- Bids: total_amount_cents, pro_commission_rate_bps + pro_commission_cents, customer_fee_rate_bps + customer_fee_cents (fee charged on top to customer, shown at checkout), net_payout_cents = total − pro commission. + expires_at TIMESTAMPTZ. UNIQUE(job_id, pro_id); partial UNIQUE(job_id) WHERE status='ACCEPTED'.
- PaymentMilestones (NEW): id, job_id FK, bid_id FK, seq SMALLINT, label (e.g. Deposit/Materials, Balance), amount_cents, status ENUM(UNFUNDED, HELD, RELEASED, REFUNDED), payment_intent_id, transfer_id. Milestone 1 must be HELD before address release + job start; final milestone releases on completion confirmation.
- ChangeOrders (NEW): id, job_id FK, pro_id FK, description, delta_amount_cents (can be negative), status ENUM(PROPOSED, APPROVED, REJECTED), approved_at. Approved change orders adjust the final milestone amount; customer must approve in-app and fund any positive delta into escrow before extra work proceeds.
- JobEvidence (NEW): id, job_id FK, uploaded_by FK, kind ENUM(BEFORE_PHOTO, AFTER_PHOTO, CHECKIN), storage_key, created_at. Completion requires ≥1 BEFORE and ≥1 AFTER photo.
- CompletionCodes: stored on JobPosts: completion_code_hash (6-digit code issued to customer at funding; pro enters it on site to trigger completion request — customer still confirms in-app or auto-release window runs).
- ChatMessages: unchanged, plus server-side filter — messages containing phone-number/email patterns are flagged/masked BEFORE escrow is funded (anti-leakage), with a notice to both parties.
- Reviews: unchanged (one per job, COMPLETED + released only).

## 4. Transactional workflows (v2)
### 4.1 Posting → matching → bidding
1. POST /api/jobs (Customer) → JobPost OPEN (rounded coords) + JobPrivateDetails + images.
2. Matching: bounding-box radius pre-filter → haversine rank → filter skills_array contains category + verification any tier → take matched set (default 5 pros, best distance/rating/response-time).
3. Notify matched pros: Notification row + SMS + PWA push. Lead shows approximate area + budget only.
4. POST /api/jobs/[id]/bids (Pro) → server computes commission + customer fee from snapshotted rates; bid has expires_at. Customer notified (in-app + email).
5. Customer accepts → DB transaction: bid ACCEPTED, others REJECTED, job ACCEPTED. Partial unique index makes double-accept impossible.

### 4.2 Acceptance → milestone escrow → completion
1. Appointment proposed/confirmed (Appointments) → job SCHEDULED.
2. Customer funds milestone 1 → PaymentIntent on platform (total includes customer service fee) → webhook confirms → milestone HELD → exact address + phone released to pro, chat unmasked.
3. Pro checks in on site + uploads BEFORE photo → job IN_PROGRESS.
4. Scope change? Pro creates ChangeOrder → customer approves in-app → positive delta funded into final milestone before extra work.
5. Work done → AFTER photo + pro enters customer's completion code → customer confirms in-app → final milestone Transfer (net = milestone amount − pro commission snapshot) to pro's Connect account → job COMPLETED, Payments RELEASED.
6. No customer response within auto-release window (default proposed: 72h, see §7) and no dispute → auto-release runs.
7. Dispute at any point after funding → job DISPUTED, all unreleased milestones frozen → Admin resolves release or refund (v1), logged.
8. Pre-start cancellation → full refund of HELD milestones minus nothing (policy page states windows; late-cancel fee is a §7 policy decision, not code).

### 4.3 RBAC + address/contact security (v2)
Pipeline on every API route: (1) JWT verify → 401. (2) Role gate → 403. (3) Resource policy (ownership/participation) → 403/404.
- Exact address: only in JobPrivateDetails; never selected until milestone 1 HELD and caller is the accepted pro.
- Contact masking: phone numbers/emails exchanged in chat are masked, and neither party's real phone is displayed, until milestone 1 HELD. SMS notifications never contain the other party's number.
- Pros cannot modify customer jobs; customers cannot see other customers' jobs; is_verified/tier writes are Admin-only; payment data never touches our servers (Stripe-hosted payment UI only).

## 5. Launch scope (v2 business constraint, built into config)
- LaunchConfig: launch_metro (TBD, §7), launch_categories = 3 (TBD, §7, suggest: Plumbing, Electrical, Handyman — high demand, clear scope, licence story is cleanest), matched_pro_limit 5, auto_release_hours 72 (proposed).
- Platform code stays generic; metro/category are config + seed data, so city #2 is a launch exercise, not a rebuild.

## 6. Initialisation sequence (on approval)
1. Repo scaffold: Next.js + TS + Tailwind, PWA config, env template (Stripe, Supabase, Twilio, JWT, Checkr).
2. Prisma schema v2 + migrations (no PostGIS) + seed: category taxonomy, LaunchConfig, admin user.
3. Auth (Argon2id, JWT access + rotating refresh) + RBAC middleware + policy helpers.
4. Public pages (launch metro only) → customer dashboard → pro dashboard/PWA → chat (API-first + broadcast) → Stripe Connect onboarding → milestone escrow + webhooks → change orders + evidence + completion code → SMS notifications → admin (verifications, disputes release/refund, ledger).
5. Staging deploy; full Stripe test-mode end-to-end run (post → bid → fund → complete → payout → dispute/refund) before any production key is used.

## 7. Decisions still needed for structural approval
1. API style: Next.js Route Handlers (no separate Express server in v1) — approve?
2. Single Supabase Postgres as only DB — approve?
3. Escrow model: Separate Charges & Transfers with milestone holds — approve?
4. Fee defaults (proposed): pro commission 10% (1000 bps) + customer service fee 5% (500 bps, shown at checkout). Flat across categories? — approve or set numbers.
5. Auto-release window: 72 hours after completion request if customer is silent and no dispute — approve?
6. Launch metro + 3 launch categories — boss to name them (suggestion above).
7. Late-cancellation policy + dispute evidence standard — business policy, needed before the policy pages are written, not before coding starts.
