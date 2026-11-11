import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db, profileByUserId, matchProsForJob, milestonesForJob, proRating, appointmentForJob } from "@/lib/store";
import { money, fmtDate } from "@/lib/utils";
import { StatusPill, TierBadge } from "@/components/ui";
import { ProNav } from "@/components/DashNav";

export default async function ProOverview() {
  const user = await requireRole("PRO");
  const profile = profileByUserId(user.id);
  const myBids = db().bids.filter((b) => b.proId === user.id);
  const acceptedJobIds = myBids.filter((b) => b.status === "ACCEPTED").map((b) => b.jobId);
  const activeJobs = db().jobPosts.filter((j) => acceptedJobIds.includes(j.id) && !["COMPLETED", "CANCELLED"].includes(j.status));
  const leads = db().jobPosts.filter((j) => j.status === "OPEN" && !myBids.some((b) => b.jobId === j.id) && profile && matchProsForJob(j).some((m) => m.profile.userId === user.id));
  const pendingNet = activeJobs.reduce((s, j) => {
    const bid = myBids.find((b) => b.jobId === j.id && b.status === "ACCEPTED");
    if (!bid) return s;
    return s + milestonesForJob(j.id).filter((m) => m.status === "HELD").reduce((x, m) => x + (m.amountCents - Math.round((bid.proCommissionCents * m.amountCents) / bid.totalAmountCents)), 0);
  }, 0);
  const rating = proRating(user.id);
  const notes = db().notifications.filter((x) => x.userId === user.id).slice(-5).reverse();
  return (
    <div>
      <ProNav active="overview" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{profile?.businessName ?? user.name}</h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">{profile && <TierBadge tier={profile.verificationTier} />}<span>★ {rating.count ? rating.avg.toFixed(1) : "—"} · {profile?.locationLabel}</span></p>
        </div>
        <Link href="/dashboard/pro/leads" className="btn-action">View {leads.length} new lead{leads.length === 1 ? "" : "s"}</Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm font-semibold text-slate-500">New matching leads</p><p className="mt-1 text-3xl font-extrabold text-trust">{leads.length}</p></div>
        <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Active jobs</p><p className="mt-1 text-3xl font-extrabold text-trust">{activeJobs.length}</p></div>
        <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Your net held in escrow</p><p className="mt-1 text-3xl font-extrabold text-trust">{money(pendingNet)}</p></div>
      </div>
      <h2 className="mt-8 text-lg font-bold text-slate-900">Active jobs</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {activeJobs.length === 0 && <p className="card p-5 text-sm text-slate-500">No active jobs yet — bid on a lead to get started.</p>}
        {activeJobs.map((j) => {
          const appt = appointmentForJob(j.id);
          return (
            <Link key={j.id} href={`/dashboard/pro/jobs/${j.id}`} className="card block p-5 transition hover:border-trust">
              <div className="flex items-start justify-between gap-3"><p className="font-bold text-slate-900">{j.title}</p><StatusPill status={j.status} /></div>
              <p className="mt-1 text-sm text-slate-500">{j.locationLabel}{appt ? ` · Appointment ${fmtDate(appt.scheduledDate)} ${appt.windowStart}–${appt.windowEnd}` : ""}</p>
              <p className="mt-2 text-sm text-slate-600">Milestones: {milestonesForJob(j.id).map((m) => `${m.seq}:${m.status}`).join(" · ") || "pending funding"}</p>
            </Link>
          );
        })}
      </div>
      <h2 className="mt-8 text-lg font-bold text-slate-900">Your bids</h2>
      <ul className="card mt-3 divide-y divide-slate-100">
        {myBids.length === 0 && <li className="px-5 py-3 text-sm text-slate-500">No bids yet.</li>}
        {myBids.map((b) => {
          const job = db().jobPosts.find((j) => j.id === b.jobId);
          return <li key={b.id} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm"><Link className="font-semibold text-trust" href={`/dashboard/pro/jobs/${b.jobId}`}>{job?.title}</Link><span className="text-slate-600">{money(b.totalAmountCents)} · you receive {money(b.netPayoutCents)} · <strong>{b.status}</strong></span></li>;
        })}
      </ul>
      {notes.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-bold text-slate-900">Recent updates</h2>
          <ul className="card mt-3 divide-y divide-slate-100">{notes.map((x) => <li key={x.id} className="px-5 py-3 text-sm text-slate-600">{x.text}</li>)}</ul>
        </>
      )}
    </div>
  );
}
