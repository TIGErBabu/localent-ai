# Localent.ai

Two-sided home-services marketplace: customers post local jobs, verified professionals bid,
payments are held in milestone escrow (Stripe Connect) and released on confirmed completion.
Platform revenue = pro commission + customer service fee on completed transactions only.

- Architecture: see LOCALENT_BLUEPRINT_V2.md (docs/)
- Brand: Deep Trust Blue #1E3A8A (primary), Action Amber #F59E0B (actions/CTAs only), slate/white surfaces
- Stack: Next.js + TypeScript + Tailwind · PostgreSQL (Supabase) + Prisma · Supabase Realtime/Storage · Stripe Connect · Twilio SMS
- Hosting: private GitHub repo -> Vercel (auto-deploy on push to main) · Supabase free project · Stripe TEST mode for demo
- Demo data is fictional. No real payment keys, no real customer data in this repo. Secrets live in environment variables only.

## Build phases
1. Scaffold + Prisma schema (blueprint v2 section 3) + seed (categories, launch config, demo data)
2. Auth (JWT) + RBAC middleware + policies
3. Public pages + customer dashboard (post job, bids)
4. Pro dashboard (PWA) + leads + bid composer
5. Stripe Connect onboarding + milestone escrow + webhooks
6. Chat (API-first + realtime broadcast) + contact masking
7. Change orders, evidence photos, completion code, scheduling
8. SMS notifications + admin panel (verifications, disputes, ledger)
9. Staging deploy on Vercel + Stripe test-mode end-to-end run
