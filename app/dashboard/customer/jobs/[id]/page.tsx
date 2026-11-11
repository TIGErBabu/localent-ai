import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db, findJob, acceptedBid, bidsForJob, milestonesForJob, appointmentForJob, privateDetails, proName, milestone1Funded } from "@/lib/store";
import { money, fmtDate, fmtDateTime } from "@/lib/utils";
import { config } from "@/lib/config";
import { StatusPill, TierBadge } from "@/components/ui";
import { CustomerNav } from "@/components/DashNav";
import Chat from "@/components/Chat";
import { decideChangeOrderAction, confirmCompletionAction, openDisputeAction } from "@/app/actions";

export default async function CustomerJobPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;
  const job = findJob(id);
  if (!job || job.customerId !== user.id) notFound();
  const bid = acceptedBid(job.id);
  const bids = bidsForJob(job.id);
  const milestones = milestonesForJob(job.id);
  const appt = appointmentForJob(job.id);
  const priv = privateDetails(job.id);
  const funded = milestone1Funded(job.id);
  const changeOrders = db().changeOrders.filter((c) => c.jobId === job.id);
  const evidence = db().jobEvidence.filter((e) => e.jobId === job.id);
  const proProfile = bid ? db().companyProfiles.find((p) => p.userId === bid.proId) : undefined;
  const dispute = db().disputes.find((d) => d.jobId === job.id && d.status === "OPEN");

  return (
    <div>
      <CustomerNav active="overview" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{job.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{job.locationLabel} · Posted {fmtDate(job.createdAt)} · Preferred {fmtDate(job.preferredDate)}</p>
        </div>
        <StatusPill status={job.status} />
      </div>
      <p className="card mt-4 p-5 text-slate-700">{job.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.status === "OPEN" && <Link href={`/dashboard/customer/jobs/${job.id}/bids`} className="btn-action">Compare {bids.filter((b) => b.status === "PENDING").length} bid(s)</Link>}
        {milestones.some((m) => m.status === "UNFUNDED") && job.status !== "CANCELLED" && <Link href={`/dashboard/customer/jobs/${job.id}/pay`} className="btn-action">Fund escrow milestone</Link>}
        <Link href={`/dashboard/customer/jobs/${job.id}/schedule`} className="btn-ghost">Scheduling</Link>
        {job.status === "COMPLETED" && <Link href={`/dashboard/customer/jobs/${job.id}/review`} className="btn-trust">Leave a verified review</Link>}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="font-bold text-slate-900">Escrow &amp; milestones</h3>
          {milestones.length === 0 && <p className="mt-2 text-sm text-slate-500">No escrow yet — accept a bid and milestones are created automatically (30% deposit, then balance).</p>}
          <ul className="mt-3 space-y-3">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div><p className="font-semibold text-slate-800">{m.seq}. {m.label}</p><p className="text-xs text-slate-500">{m.paymentIntentId ?? "Not funded yet"}</p></div>
                <div className="text-right"><p className="font-bold text-trust">{money(m.amountCents)}</p><p className="text-xs font-bold text-slate-500">{m.status}</p></div>
              </li>
            ))}
          </ul>
          {bid && (
            <p className="mt-3 text-sm text-slate-600">
              Accepted bid {money(bid.totalAmountCents)} from <span className="font-semibold">{proName(bid.proId)}</span>
              {proProfile && <> <TierBadge tier={proProfile.verificationTier} /></>}
              <br />Pro receives {money(bid.netPayoutCents)} after the {bid.proCommissionRateBps / 100}% platform commission. Your service fee: {money(bid.customerFeeCents)} total, charged proportionally per milestone.
            </p>
          )}
          {funded && job.completionCode && job.status !== "COMPLETED" && (
            <div className="mt-4 rounded-xl border-2 border-dashed border-trust/40 bg-trust-soft p-4">
              <p className="text-sm font-bold text-trust">Your completion confirmation code</p>
              <p className="mt-1 text-3xl font-extrabold tracking-[0.3em] text-trust">{job.completionCode}</p>
              <p className="mt-1 text-xs text-slate-600">Give this to your pro on site when the work is done. They enter it to request completion; you still confirm here before the balance is released. If you do nothing and raise no dispute, the balance auto-releases after {config.autoReleaseHours} hours.</p>
            </div>
          )}
          {job.completionRequestedAt && job.status !== "COMPLETED" && (
            <form action={confirmCompletionAction} className="mt-4">
              <input type="hidden" name="jobId" value={job.id} />
              <button className="btn-action w-full" type="submit">✓ Confirm completion &amp; release the balance</button>
              <p className="mt-1 text-center text-xs text-slate-500">Requested {fmtDateTime(job.completionRequestedAt)}. Confirming releases all held escrow to your pro.</p>
            </form>
          )}
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h3 className="font-bold text-slate-900">Appointment</h3>
            {appt ? (
              <p className="mt-2 text-sm text-slate-600">{fmtDate(appt.scheduledDate)} · {appt.windowStart}–{appt.windowEnd} · <span className="font-bold">{appt.status}</span></p>
            ) : <p className="mt-2 text-sm text-slate-500">Not scheduled yet.</p>}
            <Link href={`/dashboard/customer/jobs/${job.id}/schedule`} className="btn-ghost mt-3 text-sm">Manage scheduling</Link>
            {priv && (
              <p className="mt-4 text-sm text-slate-600"><span className="font-semibold">Your address (private):</span> {priv.streetAddress}{priv.unit ? `, ${priv.unit}` : ""}, {priv.zip}
                <br /><span className="text-xs text-slate-500">{funded ? "Shared with your pro when the deposit was funded." : "Not shared with anyone until your deposit is funded."}</span></p>
            )}
          </section>

          {changeOrders.length > 0 && (
            <section className="card p-5">
              <h3 className="font-bold text-slate-900">Change orders</h3>
              <ul className="mt-3 space-y-3">
                {changeOrders.map((c) => (
                  <li key={c.id} className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-700">{c.description}</p>
                    <p className="mt-1 text-sm font-bold text-trust">{c.deltaAmountCents >= 0 ? "+" : ""}{money(c.deltaAmountCents)} · {c.status}</p>
                    {c.status === "PROPOSED" && (
                      <form action={decideChangeOrderAction} className="mt-2 flex gap-2">
                        <input type="hidden" name="changeOrderId" value={c.id} />
                        <button name="decision" value="approve" className="btn-action px-3 py-1.5 text-sm" type="submit">Approve</button>
                        <button name="decision" value="reject" className="btn-ghost px-3 py-1.5 text-sm" type="submit">Decline</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {evidence.length > 0 && (
            <section className="card p-5">
              <h3 className="font-bold text-slate-900">Job evidence</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                {evidence.map((e) => <li key={e.id}>📷 {e.kind.replace(/_/g, " ")} — {fmtDateTime(e.createdAt)}</li>)}
              </ul>
            </section>
          )}

          {!dispute && job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
            <section className="card border-red-200 p-5">
              <h3 className="font-bold text-red-800">Something wrong?</h3>
              <p className="mt-1 text-sm text-slate-600">Opening a dispute freezes all held escrow while our team reviews the job, chat and evidence.</p>
              <form action={openDisputeAction} className="mt-3 space-y-2">
                <input type="hidden" name="jobId" value={job.id} />
                <input name="reason" required className="input" placeholder="Briefly, what happened?" />
                <button className="btn-ghost text-sm" type="submit">Open a dispute</button>
              </form>
            </section>
          )}
          {dispute && <section className="card border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong>Dispute open:</strong> {dispute.reason} — held escrow is frozen pending admin review.</section>}
        </div>
      </div>

      <div className="mt-4"><Chat job={job} viewerId={user.id} funded={funded} back={`/dashboard/customer/jobs/${job.id}`} /></div>
    </div>
  );
}
