# Localent.ai

Two-sided home-services marketplace: customers post local jobs, verified professionals bid,
payments are held in **milestone escrow** (Stripe Connect) and released on confirmed completion.
Platform revenue = pro commission (10%) + customer service fee (5%) on completed transactions only.

- **Architecture:** [docs/LOCALENT_BLUEPRINT_V2.md](docs/LOCALENT_BLUEPRINT_V2.md) — build to blueprint v2.
- **Brand:** Deep Trust Blue `#1E3A8A` (primary), Action Amber `#F59E0B` (CTAs/buttons only), slate/white surfaces.
- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind · PostgreSQL (Supabase) + Prisma · Supabase Realtime/Storage · Stripe Connect · Twilio SMS.
- **Hosting plan:** GitHub repo → Vercel (auto-deploy on push to `main`) · Supabase free project · Stripe **test mode** for demos.

---

## DEMO MODE (current state)

There are no live Supabase / Stripe / Twilio / Checkr accounts yet, so the app runs on a
**seeded demo data layer**: a typed in-memory store (`lib/store.ts` + `lib/seed.ts`) behind a
`DataAdapter` interface, with exactly the same shapes as the Prisma schema
(`prisma/schema.prisma`, the production target). Every route and workflow below works
end-to-end in demo mode:

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

External services are env-gated adapter stubs in `lib/adapters.ts` (Stripe, Twilio, Checkr,
storage) — they simulate in demo mode and throw a clear TODO error if live keys are set
before the live wiring is done. **Never commit a real `.env` file or real keys.**

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
- [x] 2. Demo auth (cookie session) + RBAC middleware + resource policies (§4.3)
- [x] 3. Public pages + customer dashboard (post job, bids, pay, schedule, review)
- [x] 4. Pro dashboard (PWA manifest) + leads + bid composer
- [x] 5. Milestone escrow + simulated Stripe test checkout + payout wallet
- [x] 6. Chat (API-first) + contact masking until funded
- [x] 7. Change orders, evidence photos, completion code, scheduling
- [x] 8. SMS adapter (env-gated) + admin panel (verifications, disputes, ledger, audit log)
- [ ] 9. Deploy to Vercel + connect Supabase + Stripe test-mode end-to-end run with live keys

## Going live — what is needed

1. **Vercel** project linked to this repo (env vars below), deploy on `main`.
2. **Supabase** project: run the Prisma migrations against its Postgres (`DATABASE_URL` pooled + `DIRECT_URL`), create private buckets `portfolios`, `job-images`, `verification-docs`, then swap the `DataAdapter` implementation from in-memory to Prisma and replace the demo cookie session with signed JWT access + rotating refresh tokens (`RefreshToken` model).
3. **Stripe** account + Connect (Express): set `STRIPE_SECRET_KEY` (test mode first), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`; implement the TODOs in `lib/adapters.ts` and add `/api/webhooks/stripe` — webhooks, never browser redirects, confirm payments.
4. **Twilio** (`TWILIO_*`) for pro SMS; **Checkr** (`CHECKR_API_KEY`) for Verified Pro background checks.
5. Set the launch metro + categories and the real fee config in env (`PLATFORM_PRO_COMMISSION_BPS`, `PLATFORM_CUSTOMER_FEE_BPS`, `AUTO_RELEASE_HOURS`, `MATCHED_PRO_LIMIT`).
6. Before real users: flip this repo to **private**, and move demo seed data out of the production database seed.
