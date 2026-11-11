import Link from "next/link";
import type { Metadata } from "next";
import { registerCustomerAction } from "@/app/actions";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "Post a job — create your account" };

export default async function RegisterCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <section className="card p-6 md:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Post a job on Localent</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a free customer account for {config.metro}. Post a job, compare bids, and pay only through
          milestone escrow — released when you confirm the work is done.
        </p>

        {sp.error === "exists" && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            An account with that email already exists. Try{" "}
            <Link href="/login" className="underline">logging in</Link> instead.
          </p>
        )}

        <form action={registerCustomerAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="cust-name">Full name</label>
            <input id="cust-name" name="name" type="text" required autoComplete="name" placeholder="e.g. Maya Chen" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="cust-email">Email</label>
            <input id="cust-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="cust-phone">Phone</label>
            <input id="cust-phone" name="phone" type="tel" autoComplete="tel" placeholder="(352) 555-0100" className="input" />
            <p className="mt-1 text-xs text-slate-400">Used for appointment updates. It stays masked from pros until escrow is funded.</p>
          </div>
          <div>
            <label className="label" htmlFor="cust-password">Password</label>
            <input id="cust-password" name="password" type="password" required autoComplete="new-password" placeholder="Choose a password" className="input" />
          </div>
          <button type="submit" className="btn-action w-full">Create account &amp; post a job</button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-trust hover:underline">Log in</Link>
          {" · Are you a pro? "}
          <Link href="/register/pro" className="font-semibold text-trust hover:underline">Join as a pro</Link>
        </p>
      </section>

      <p className="text-center text-xs text-slate-400">
        Demo notice: this site runs on fictional demo data. The demo accounts and businesses shown are not real
        people or companies.
      </p>
    </div>
  );
}
