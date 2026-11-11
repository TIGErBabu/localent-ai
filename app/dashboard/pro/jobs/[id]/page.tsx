import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db, findJob, findUser, acceptedBid, milestonesForJob, appointmentForJob, privateDetails, milestone1Funded } from "@/lib/store";
import { canSeeAddress } from "@/lib/policy";
import { money, fmtDate, fmtDateTime } from "@/lib/utils";
import { StatusPill } from "@/components/ui";
import { ProNav } from "@/components/DashNav";
import Chat from "@/components/Chat";
import { submitBidAction, checkInAction, addEvidenceAction, proposeChangeOrderAction, requestCompletionAction, scheduleAction, openDisputeAction } from "@/app/actions";

export default async function ProJobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; done?: string }> }) {
  const user = await requireRole("PRO");
  const { id } = await params;
  const sp = await searchParams;
  const job = findJob(id);
  if (!job) notFound();
  const myBid = db().bids.find((b) => b.jobId === job.id && b.proId === user.id);
  const bid = acceptedBid(job.id);
  const mine = bid?.proId === user.id;
  if (!mine && job.status !== "OPEN") notFound();
  const milestones = milestonesForJob(job.id);
  const appt = appointmentForJob(job.id);
  const funded = milestone1Funded(job.id);
  const showAddress = canSeeAddress(user, job);
  const priv = privateDetails(job.id);
  const customer = findUser(job.customerId);
  const changeOrders = db().changeOrders.filter((c) => c.jobId === job.id);
  const evidence = db().jobEvidence.filter((e) => e.jobId === job.id);
  const hasBefore = evidence.some((e) => e.kind === "BEFORE_PHOTO");
  const hasAfter = evidence.some((e) => e.kind === "AFTER_PHOTO");

  return (
    <div>
      <ProNav active="overview" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{job.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{job.locationLabel} · Customer: {customer?.name} · Preferred {fmtDate(job.preferredDate)}</p>
        </div>
        <StatusPill status={job.status} />
      </div>
      {sp.error === "code" && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">That completion code didn&apos;t match. Ask the customer for the 6-digit code they received when funding.</p>}
      {sp.error === "evidence" && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Completion needs at least one BEFORE and one AFTER photo first.</p>}
      {sp.done === "requested" && <p className="mt-3 rounded-xl bg-trust-soft px-4 py-3 text-sm font-semibold text-trust">Completion requested — the customer has been asked to confirm. The balance auto-releases after the review window if they don&apos;t respond or dispute.</p>}
      <p className="card mt-4 p-5 text-slate-700">{job.description}</p>

      {job.status === "OPEN" && !myBid && (
        <section className="card mt-4 p-5">
          <h3 className="font-bold text-slate-900">Bid on this job</h3>
          <p className="text-sm text-slate-500">Budget {money(job.budgetMinCents)}–{money(job.budgetMaxCents)}. Your price is all-in; the split is calculated by Localent and shown on your bids.</p>
          <form action={submitBidAction} className="mt-3 space-y-2">
            <input type="hidden" name="jobId" value={job.id} />
            <input name="totalDollars" type="number" min="10" required className="input" placeholder="Your total price ($)" aria-label="Bid total" />
            <textarea name="proposal" required rows={3} className="input" placeholder="What is included, warranty, availability…" aria-label="Proposal" />
            <button className="btn-action" type="submit">Submit bid</button>
          </form>
        </section>
      )}
      {myBid && <p className="card mt-4 p-5 text-sm text-slate-700">Your bid: <strong>{money(myBid.totalAmountCents)}</strong> — you receive <strong>{money(myBid.netPayoutCents)}</strong> after the {myBid.proCommissionRateBps / 100}% commission · Status <strong>{myBid.status}</strong></p>}

      {mine && (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="card p-5">
              <h3 className="font-bold text-slate-900">Job address</h3>
              {showAddress && priv ? (
                <p className="mt-2 text-slate-700">{priv.streetAddress}{priv.unit ? `, ${priv.unit}` : ""}, {priv.zip}<br /><span className="text-sm text-slate-500">{priv.accessNotes ?? ""}</span><br /><span className="text-sm text-slate-500">Customer phone: {customer?.phoneNumber ?? "—"} (unlocked because the deposit is funded)</span></p>
              ) : (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">🔒 The exact address and customer phone unlock when the customer funds the deposit milestone. Until then you see the approximate area only.</p>
              )}
              <h3 className="mt-5 font-bold text-slate-900">Milestones</h3>
              <ul className="mt-2 space-y-2">
                {milestones.map((m) => <li key={m.id} className="flex justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm"><span>{m.seq}. {m.label}</span><span><strong>{money(m.amountCents)}</strong> · {m.status}</span></li>)}
              </ul>
              {appt ? <p className="mt-3 text-sm text-slate-600">Appointment: {fmtDate(appt.scheduledDate)} · {appt.windowStart}–{appt.windowEnd} · <strong>{appt.status}</strong></p> : <p className="mt-3 text-sm text-slate-500">No appointment set yet — propose one:</p>}
              <form action={scheduleAction} className="mt-2 grid gap-2 sm:grid-cols-3">
                <input type="hidden" name="jobId" value={job.id} /><input type="hidden" name="mode" value={appt ? "reschedule" : "propose"} />
                <input name="date" type="date" required className="input" defaultValue={appt?.scheduledDate ?? ""} aria-label="Date" />
                <input name="windowStart" type="time" required className="input" defaultValue={appt?.windowStart ?? "08:00"} aria-label="Window start" />
                <input name="windowEnd" type="time" required className="input" defaultValue={appt?.windowEnd ?? "11:00"} aria-label="Window end" />
                <button className="btn-ghost text-sm sm:col-span-3" type="submit">{appt ? "Propose new time" : "Propose appointment"}</button>
              </form>
            </section>

            <div className="space-y-4">
              <section className="card p-5">
                <h3 className="font-bold text-slate-900">On-site workflow</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={checkInAction}><input type="hidden" name="jobId" value={job.id} /><button className="btn-trust text-sm" type="submit" disabled={!funded}>📍 Check in on site</button></form>
                  <form action={addEvidenceAction}><input type="hidden" name="jobId" value={job.id} /><input type="hidden" name="kind" value="BEFORE_PHOTO" /><button className="btn-ghost text-sm" type="submit">📷 Add BEFORE photo</button></form>
                  <form action={addEvidenceAction}><input type="hidden" name="jobId" value={job.id} /><input type="hidden" name="kind" value="AFTER_PHOTO" /><button className="btn-ghost text-sm" type="submit">📷 Add AFTER photo</button></form>
                </div>
                {!funded && <p className="mt-2 text-xs text-slate-500">Check-in unlocks once the deposit is funded.</p>}
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {evidence.map((e) => <li key={e.id}>{e.kind === "CHECKIN" ? "📍" : "📷"} {e.kind.replace(/_/g, " ")} — {fmtDateTime(e.createdAt)}</li>)}
                  {evidence.length === 0 && <li>No check-ins or photos yet.</li>}
                </ul>
                {job.status === "IN_PROGRESS" && (
                  <form action={requestCompletionAction} className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-700">Finish the job {hasBefore && hasAfter ? "" : "(needs a BEFORE and an AFTER photo first)"}</p>
                    <div className="flex gap-2">
                      <input name="code" inputMode="numeric" required className="input" placeholder="Customer's 6-digit completion code" aria-label="Completion code" />
                      <input type="hidden" name="jobId" value={job.id} />
                      <button className="btn-action shrink-0" type="submit">Request completion</button>
                    </div>
                  </form>
                )}
                {job.completionRequestedAt && job.status !== "COMPLETED" && <p className="mt-2 text-sm font-semibold text-trust">Completion requested {fmtDateTime(job.completionRequestedAt)} — awaiting customer confirmation.</p>}
              </section>

              <section className="card p-5">
                <h3 className="font-bold text-slate-900">Change orders</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {changeOrders.map((c) => <li key={c.id} className="rounded-xl bg-slate-50 px-3 py-2">{c.description} — <strong>{c.deltaAmountCents >= 0 ? "+" : ""}{money(c.deltaAmountCents)}</strong> · {c.status}</li>)}
                  {changeOrders.length === 0 && <li className="text-slate-500">None yet. Scope changed on site? Propose it here — extra work only starts after the customer approves and funds the difference.</li>}
                </ul>
                <form action={proposeChangeOrderAction} className="mt-3 space-y-2">
                  <input type="hidden" name="jobId" value={job.id} />
                  <input name="description" required className="input" placeholder="What changed and why" aria-label="Change order description" />
                  <div className="flex gap-2"><input name="deltaDollars" type="number" required className="input" placeholder="Extra cost ($)" aria-label="Change order amount" /><button className="btn-ghost shrink-0 text-sm" type="submit">Propose</button></div>
                </form>
              </section>

              {job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                <section className="card border-red-200 p-5">
                  <h3 className="font-bold text-red-800">Problem with this job?</h3>
                  <form action={openDisputeAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="jobId" value={job.id} />
                    <input name="reason" required className="input" placeholder="Briefly, what happened?" />
                    <button className="btn-ghost shrink-0 text-sm" type="submit">Open dispute</button>
                  </form>
                </section>
              )}
            </div>
          </div>
          <div className="mt-4"><Chat job={job} viewerId={user.id} funded={funded} back={`/dashboard/pro/jobs/${job.id}`} /></div>
        </>
      )}
      {!mine && job.status === "OPEN" && myBid && (
        <div className="mt-4"><Chat job={job} viewerId={user.id} funded={false} back={`/dashboard/pro/jobs/${job.id}`} /></div>
      )}
      <p className="mt-4 text-sm"><Link href="/dashboard/pro/leads" className="font-semibold text-trust">← All leads</Link></p>
    </div>
  );
}
