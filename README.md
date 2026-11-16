# Localent.ai

Two-sided home-services marketplace: customers post local jobs, verified professionals bid,
payments are held in **milestone escrow** (Stripe Connect) and released on confirmed completion.
Platform revenue = pro commission (10%) + customer service fee (5%) on completed transactions only.
**Fees confirmed by the boss on 2026-11-16** (locked, still env-configurable). Default cancellation and
dispute policies were approved the same day and ship as the live policy pages (`/terms`, `/privacy`,
`/cancellation-policy`, `/dispute-policy`).

- **Architecture:** [docs/LOCALENT_BLUEPRINT_V2.md](docs/LOCALENT_BLUEPRINT_V2.md) — build to blueprint v2.
- **Brand:** Deep Trust Blue `#1E3A8A` (primary), Action Amber `#F59E0B` (CTAs/buttons only), slate/white surfaces.
- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind · PostgreSQL (Supabase) + Prisma · Supabase Realtime/Storage · Stripe Connect · Twilio SMS.
- **Hosting plan:** GitHub repo → Vercel (auto-deploy on push to `main`) · Supabase free project · Stripe **test mode** for demos.

---

## DEMO MODE (current state)

There are no live Supabase / Stripe / Twilio / Checkr accounts yet, so the app runs on a
**seeded demo data layer**: a typed in-memory store (`lib/store.ts` + `lib/seed.ts`) behind a
`DataAdapter` interface, with exactly the same shapes as the Prisma schema
(`prisma/schema.prisma`, the production target). Auth is REAL in both modes (scrypt password
hashing + signed JWT access tokens + rotating refresh tokens, `lib/auth.ts`); the demo-only
parts are the seeded data, the simulated payment/SMS/background-check side effects, and the
one-click demo logins — those are gated by `DEMO_MODE` (default `true`; set `DEMO_MODE=false`
for production). Every route and workflow below works end-to-end in demo mode:

- Post a job → nearby pros matched (skills + bounding-box radius + haversine rank, limit 5) and notified
- Pros bid → split (commission / customer fee / pro net) computed **server-side** from config rates
- Accept a bid → 30% deposit + balance milestones created
- "Stripe test checkout" page simulates funding → milestone HELD, completion code issued,
  exact address + phone unmasked for the hired pro, chat unmasked
- Scheduling, check-in, before/after photo evidence, change orders (approve → balance adjusts)
- Completion: pro enters the customer's 6-digit code → customer confirms → escrow releases
  (auto-release after 72h if the customer is silent and raises no dispute)
- Verified review (only after completion + release), disputes (freeze escrow),
  admin verification queue and dispute resolution (release or refund), payments ledger

External services live in `lib/adapters.ts` (Stripe Connect, Twilio, Checkr) and are
env-gated: no keys → they simulate; keys present → the real code paths run (Stripe
PaymentIntents/Transfers/Refunds + Connect Express onboarding, Twilio SMS sends, Checkr
candidate + invitation creation). Payment state is confirmed by the signed webhook at
`/api/webhooks/stripe`, never by browser redirects. **Never commit a real `.env` file or real keys.**

State note: the demo store lives in server memory — it resets when the server restarts,
and demo mutations are shared by everyone using the same running instance.

### Demo logins (password for all: `demo`)

| Role | Email | Try this |
|---|---|---|
| Admin | admin@localent.demo | Commission KPIs, verify BrightSpark, resolve the water-heater dispute |
| Customer | maya@localent.demo | Open bids on the sink-leak job; disputed water-heater job |
| Customer | jordan@localent.demo | Panel upgrade in progress — completion code is on the job page |
| Customer | priya@localent.demo | A completed job with a verified review; open deck job with a bid |
| Pro (Verified) | flowright@localent.demo | FlowRight Plumbing — leads, disputed job, wallet |
| Pro (Verified) | sparksafe@localent.demo | Panel upgrade: check in, evidence, change order, completion |
| Pro (Basic ID) | handyworks@localent.demo | TV-mount job scheduled — needs deposit funding |
| Pro (Basic ID) | pipepros@localent.demo | Gainesville Pipe Pros |
| Pro (Verified) | fixit@localent.demo | Completed drywall job + payout history |
| Pro (Pending) | brightspark@localent.demo | Verification submitted — see it from the admin side |

## Run locally

```bash
npm install --ignore-scripts   # see note below
npm run dev                    # http://localhost:3000
npm run build && npm start     # production build
```

> Install note: a plain `npm install` also downloads Prisma engine binaries. The demo
> never uses them (Prisma is the production data target, not the demo runtime), so
> `--ignore-scripts` is safe locally. Run `npx prisma validate` in an environment with
> normal network access to validate `prisma/schema.prisma` before the first real migration.

Copy `.env.example` to `.env.local` only when wiring live services.

## Routes

- Public: `/`, `/services/[category]`, `/directory`, `/pros/[slug]`, `/login`, `/register/customer`, `/register/pro`
- Customer: `/dashboard/customer`, `/jobs/new`, `/jobs/[id]` (control room), `/jobs/[id]/bids`, `/jobs/[id]/pay`, `/jobs/[id]/schedule`, `/jobs/[id]/review`, `/messages`, `/settings`
- Pro (installable PWA): `/dashboard/pro`, `/profile`, `/leads`, `/jobs/[id]`, `/wallet`, `/messages`, `/availability`
- Admin: `/admin` (commission volume), `/verifications`, `/disputes`, `/reports`, `/users`, `/jobs`, `/payments`
- API: `GET /api/health`, `GET|POST /api/jobs`, `POST /api/jobs/[id]/bids` (server actions power the UI; these routes expose the same workflows)

## Build phases

- [x] 1. Scaffold + Prisma schema (blueprint v2 §3) + seed data + launch config
- [x] 2. Real auth (scrypt + JWT access + rotating refresh tokens; demo logins gated by DEMO_MODE) + RBAC middleware + resource policies (§4.3)
- [x] 3. Public pages + customer dashboard (post job, bids, pay, schedule, review)
- [x] 4. Pro dashboard (PWA manifest) + leads + bid composer
- [x] 5. Milestone escrow + Stripe Connect code paths (PaymentIntent/Transfer/Refund + webhook) — simulates without keys, live with test keys
- [x] 6. Chat (API-first) + contact masking until funded
- [x] 7. Change orders, evidence photos, completion code, scheduling
- [x] 8. SMS (Twilio) + background-check (Checkr) adapters, env-gated + admin panel (verifications, disputes, ledger, audit log)
- [x] 8b. Policy pages live: /terms, /privacy, /cancellation-policy, /dispute-policy (boss-approved defaults, 2026-11-16)
- [x] 8c. Prisma DataAdapter (`lib/prisma-adapter.ts`, selected by DATA_ADAPTER=prisma) + `prisma/seed.ts`
- [x] 9a. Deployed to Vercel (auto-deploy on push to `main`): https://localent-ai.vercel.app/
- [ ] 9b. Connect Supabase + Stripe test-mode end-to-end run with live keys (needs the accounts below)

## Going live — what is needed

**Code side — DONE (2026-11-16 production-completion pass):**
- [x] Real auth: scrypt hashing, JWT access tokens, rotating refresh tokens (`RefreshToken` rows), register/login/logout/password-change; demo logins gated by `DEMO_MODE`
- [x] Prisma DataAdapter (`lib/prisma-adapter.ts`) behind `DATA_ADAPTER=prisma`, plus `prisma/seed.ts`
- [x] Stripe code paths: Connect Express onboarding, PaymentIntent (transfer_group `job:{id}`), Transfer, Refund, and the signature-verified idempotent webhook `/api/webhooks/stripe`
- [x] Twilio SMS + Checkr (candidate + invitation) code paths, env-gated
- [x] Policy pages: /terms, /privacy, /cancellation-policy, /dispute-policy (boss-approved defaults)
- [x] Fees locked by the boss: 10% pro commission + 5% customer fee (env: `PLATFORM_PRO_COMMISSION_BPS=1000`, `PLATFORM_CUSTOMER_FEE_BPS=500`, `AUTO_RELEASE_HOURS=72`)

**Accounts / decisions — still open (all config is env-driven; no account ids in code):**
1. **Supabase** project (to be created under the company owner's login, migrated later): set `DATABASE_URL` (pooled) + `DIRECT_URL`, run `npx prisma validate` + the first migration in an environment with normal network access (the build sandbox cannot reach the Prisma engine CDN), `npx prisma generate`, set `DATA_ADAPTER=prisma`, `npm run db:seed` if demo data is wanted, create private buckets `portfolios`, `job-images`, `verification-docs`, then set `DEMO_MODE=false`.
2. **Stripe** account + Connect (Express) enabled: set `STRIPE_SECRET_KEY` (**test mode first**), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, point a Stripe webhook at `/api/webhooks/stripe`, and run the full test-mode end-to-end pass (post → bid → fund → complete → payout → dispute/refund) before any live key.
3. **Twilio** account + a phone number: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
4. **Checkr** account: set `CHECKR_API_KEY` (background checks for the Verified Pro tier).
5. **JWT secret**: set a real `JWT_ACCESS_SECRET` in the deployment env.
6. Before real users: flip this repo to **private**, and do not seed demo accounts into the production database.
7. Boss's remaining calls: launch metro/categories confirmation beyond the Gainesville + plumbing/electrical/handyman defaults, any changes to the approved default policies, and the custom domain (point Localent.ai at the Vercel project).
