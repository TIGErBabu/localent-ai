import Link from "next/link";
import type { Metadata } from "next";
import { loginAction } from "@/app/actions";

export const metadata: Metadata = { title: "Log in" };

const DEMO_ACCOUNTS: { email: string; label: string; detail: string }[] = [
  { email: "admin@localent.demo", label: "Admin", detail: "Ava Park — verifications, disputes & reports" },
  { email: "maya@localent.demo", label: "Customer", detail: "Maya Chen — jobs, bids & escrow payments" },
  { email: "flowright@localent.demo", label: "Verified Pro", detail: "FlowRight Plumbing LLC — Verified Pro tier" },
  { email: "handyworks@localent.demo", label: "Pro", detail: "HandyWorks Co. — ID-checked pro" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <section className="card p-6 md:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Log in to Localent</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back — pick up your jobs, bids and payments.</p>

        {sp.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            That email and password didn&apos;t match an account. Check them and try again — demo accounts use
            the password <span className="font-mono">demo</span>.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="login-password">Password</label>
            <input id="login-password" name="password" type="password" required autoComplete="current-password" placeholder="Your password" className="input" />
          </div>
          <button type="submit" className="btn-trust w-full">Log in</button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New to Localent?{" "}
          <Link href="/register/customer" className="font-semibold text-trust hover:underline">Post a job</Link>
          {" · "}
          <Link href="/register/pro" className="font-semibold text-trust hover:underline">Join as a pro</Link>
        </p>
      </section>

      <section className="card p-6">
        <h2 className="font-bold text-slate-900">Demo accounts — password: demo</h2>
        <p className="mt-1 text-sm text-slate-500">
          This is a demo with fictional data. Tap any account to log in instantly — no typing needed.
        </p>
        <div className="mt-4 grid gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <form key={account.email} action={loginAction}>
              <input type="hidden" name="email" value={account.email} />
              <input type="hidden" name="password" value="demo" />
              <button type="submit" className="btn-ghost w-full !justify-between text-left">
                <span>
                  <span className="block font-semibold text-slate-800">{account.label}</span>
                  <span className="block text-xs font-normal text-slate-500">{account.detail}</span>
                </span>
                <span className="font-mono text-xs text-slate-400">{account.email}</span>
              </button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
