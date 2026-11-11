import { requireRole } from "@/lib/session";
import { db, milestonesForJob } from "@/lib/store";
import { money, fmtDate } from "@/lib/utils";
import { ProNav } from "@/components/DashNav";
import { connectPayoutsAction } from "@/app/actions";

export default async function ProWalletPage({ searchParams }: { searchParams: Promise<{ connected?: string }> }) {
  const user = await requireRole("PRO");
  const sp = await searchParams;
  const acct = db().proPayoutAccounts.find((a) => a.userId === user.id);
  const myJobIds = db().bids.filter((b) => b.proId === user.id && b.status === "ACCEPTED").map((b) => b.jobId);
  const myJobs = db().jobPosts.filter((j) => myJobIds.includes(j.id));
  const myMilestones = myJobs.flatMap((j) => milestonesForJob(j.id).map((m) => ({ job: j, ms: m, bid: db().bids.find((b) => b.id === m.bidId)! })));
  const netOf = (m: { amountCents: number }, bid: { proCommissionCents: number; totalAmountCents: number }) => m.amountCents - Math.round((bid.proCommissionCents * m.amountCents) / bid.totalAmountCents);
  const held = myMilestones.filter((x) => x.ms.status === "HELD");
  const released = myMilestones.filter((x) => x.ms.status === "RELEASED");
  return (
    <div>
      <ProNav active="wallet" />
      <h1 className="text-2xl font-extrabold text-slate-900">Payout wallet</h1>
      <p className="mt-1 text-sm text-slate-500">Powered by Stripe Connect in production. Demo mode simulates onboarding and transfers — no real bank account is touched.</p>
      {sp.connected && <p className="mt-3 rounded-xl bg-trust-soft px-4 py-3 text-sm font-semibold text-trust">Payouts connected (demo). You can now receive escrow releases.</p>}
      <section className="card mt-5 p-5">
        <h3 className="font-bold text-slate-900">Stripe Connect account</h3>
        {acct ? (
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Account</dt><dd className="font-semibold">{acct.stripeAccountId}</dd></div>
            <div><dt className="text-slate-500">Onboarding</dt><dd className="font-semibold">{acct.onboardingStatus}</dd></div>
            <div><dt className="text-slate-500">Identity (KYC)</dt><dd className="font-semibold">{acct.kycStatus}</dd></div>
            <div><dt className="text-slate-500">Payouts</dt><dd className="font-semibold">{acct.payoutsEnabled ? "Enabled" : "Not enabled yet"}</dd></div>
          </dl>
        ) : <p className="mt-2 text-sm text-slate-500">No payout account yet.</p>}
        {(!acct || !acct.payoutsEnabled) && (
          <form action={connectPayoutsAction} className="mt-4"><button className="btn-action" type="submit">Connect payouts with Stripe (demo)</button></form>
        )}
      </section>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h3 className="font-bold text-slate-900">In escrow — your net</h3>
          <p className="mt-1 text-3xl font-extrabold text-trust">{money(held.reduce((s, x) => s + netOf(x.ms, x.bid), 0))}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {held.map((x) => <li key={x.ms.id} className="flex justify-between"><span>{x.job.title} · M{x.ms.seq}</span><strong>{money(netOf(x.ms, x.bid))}</strong></li>)}
            {held.length === 0 && <li className="text-slate-500">Nothing held right now.</li>}
          </ul>
        </section>
        <section className="card p-5">
          <h3 className="font-bold text-slate-900">Released to you</h3>
          <p className="mt-1 text-3xl font-extrabold text-trust">{money(released.reduce((s, x) => s + netOf(x.ms, x.bid), 0))}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {released.map((x) => <li key={x.ms.id} className="flex justify-between"><span>{x.job.title} · M{x.ms.seq} · {fmtDate(x.ms.createdAt)}</span><strong>{money(netOf(x.ms, x.bid))}</strong></li>)}
            {released.length === 0 && <li className="text-slate-500">No releases yet — complete a job to see your first payout.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
