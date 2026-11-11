import Link from "next/link";
import type { Metadata } from "next";
import { registerProAction } from "@/app/actions";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "Join as a pro" };

export default async function RegisterProPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const proFeePct = config.proCommissionBps / 100;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="card p-6 md:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Join Localent as a pro</h1>
        <p className="mt-1 text-sm text-slate-500">
          Get matched leads in {config.metro}, bid with flat all-in pricing, and get paid reliably through
          milestone escrow. Localent takes a {proFeePct}% commission on completed jobs — no lead fees, no
          subscription.
        </p>

        {sp.error === "exists" && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            An account with that email already exists. Try{" "}
            <Link href="/login" className="underline">logging in</Link> instead.
          </p>
        )}

        <form action={registerProAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="pro-name">Your name</label>
            <input id="pro-name" name="name" type="text" required autoComplete="name" placeholder="e.g. Marcus Reed" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="pro-business">Business name</label>
            <input id="pro-business" name="business" type="text" required autoComplete="organization" placeholder="e.g. FlowRight Plumbing LLC" className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pro-email">Email</label>
              <input id="pro-email" name="email" type="email" required autoComplete="email" placeholder="you@yourbusiness.com" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="pro-phone">Phone</label>
              <input id="pro-phone" name="phone" type="tel" autoComplete="tel" placeholder="(352) 555-0100" className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="pro-password">Password</label>
            <input id="pro-password" name="password" type="password" required autoComplete="new-password" placeholder="Choose a password" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="pro-category">Main trade</label>
            <select id="pro-category" name="category" required defaultValue="handyman" className="input">
              {config.categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                  {c.launch ? "" : " — launching soon"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Plumbing, electrical and handyman are live in Gainesville. Other trades launch soon — join now to
              be first in line. You can add more skills from your profile later.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="pro-bio">About your business</label>
            <textarea
              id="pro-bio"
              name="bio"
              rows={4}
              placeholder="Years in business, what you specialise in, how you price, what customers can expect on the day…"
              className="input"
            />
          </div>
          <button type="submit" className="btn-action w-full">Create pro account</button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already on Localent?{" "}
          <Link href="/login" className="font-semibold text-trust hover:underline">Log in</Link>
          {" · Hiring instead? "}
          <Link href="/register/customer" className="font-semibold text-trust hover:underline">Post a job</Link>
        </p>
      </section>

      <section className="card p-6">
        <h2 className="font-bold text-slate-900">How verification tiers work</h2>
        <ul className="mt-3 space-y-3 text-sm text-slate-600">
          <li>
            <span className="font-semibold text-slate-800">Verification pending — </span>
            every new pro starts here. You can build your storefront and profile right away.
          </li>
          <li>
            <span className="font-semibold text-slate-800">ID checked (Basic) — </span>
            confirm your identity from your pro dashboard to earn the ID-checked badge.
          </li>
          <li>
            <span className="font-semibold text-slate-800">Verified Pro — </span>
            submit your trade licence and pass a background check. Verified Pros get the blue badge, rank higher
            in matching, and win more trust at bid time. You&apos;ll complete verification and payout setup from
            your dashboard after signing up.
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Demo notice: this site runs on fictional demo data, and verification in the demo is simulated.
        </p>
      </section>
    </div>
  );
}
