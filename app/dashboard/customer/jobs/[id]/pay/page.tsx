import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { findJob, acceptedBid, milestonesForJob, proName } from "@/lib/store";
import { money } from "@/lib/utils";
import { CustomerNav } from "@/components/DashNav";
import { fundMilestoneAction } from "@/app/actions";

export default async function CustomerPayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ next?: string }> }) {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;
  const sp = await searchParams;
  const job = findJob(id);
  if (!job || job.customerId !== user.id) notFound();
  const bid = acceptedBid(job.id);
  const milestones = milestonesForJob(job.id);
  return (
    <div className="mx-auto max-w-2xl">
      <CustomerNav active="overview" />
      <Link href={`/dashboard/customer/jobs/${job.id}`} className="text-sm font-semibold text-trust">← Back to job</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Fund escrow — {job.title}</h1>
      <p className="mt-1 text-sm text-slate-500">Your payment is held by Localent (via Stripe) and only released to {bid ? proName(bid.proId) : "your pro"} when the work is confirmed complete. Funding the deposit unlocks your exact address for your pro.</p>
      {sp.next === "complete" && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Fund the balance milestone first — then you can confirm completion and release it.</p>}
      <div className="mt-3 rounded-xl border border-action/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>DEMO checkout:</strong> this is a simulated Stripe test checkout. No card is charged and no real money moves. In production this step is Stripe-hosted — card details never touch Localent servers.
      </div>
      <div className="mt-6 space-y-4">
        {milestones.map((m) => {
          const feeShare = bid ? Math.round((bid.customerFeeCents * m.amountCents) / bid.totalAmountCents) : 0;
          const total = m.amountCents + feeShare;
          return (
            <section key={m.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-bold text-slate-900">Milestone {m.seq} — {m.label}</h3><p className="text-sm text-slate-500">Status: <strong>{m.status}</strong>{m.paymentIntentId ? ` · ${m.paymentIntentId}` : ""}</p></div>
                <p className="text-xl font-extrabold text-trust">{money(total)}</p>
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Into escrow for your pro</dt><dd className="font-semibold">{money(m.amountCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Localent service fee (this milestone)</dt><dd className="font-semibold">{money(feeShare)}</dd></div>
              </dl>
              {m.status === "UNFUNDED" ? (
                <form action={fundMilestoneAction} className="mt-4 space-y-3">
                  <input type="hidden" name="milestoneId" value={m.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="input" defaultValue="4242 4242 4242 4242" aria-label="Test card number" readOnly />
                    <div className="grid grid-cols-2 gap-3"><input className="input" defaultValue="12 / 34" aria-label="Expiry" readOnly /><input className="input" defaultValue="424" aria-label="CVC" readOnly /></div>
                  </div>
                  <button className="btn-action w-full" type="submit">Pay {money(total)} into escrow (demo)</button>
                </form>
              ) : <p className="mt-3 rounded-lg bg-trust-soft px-3 py-2 text-sm font-semibold text-trust">✓ {m.status === "HELD" ? "Held safely in escrow" : m.status}</p>}
            </section>
          );
        })}
        {milestones.length === 0 && <p className="card p-5 text-sm text-slate-500">No milestones yet — accept a bid first and they will be created automatically.</p>}
      </div>
    </div>
  );
}
