import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db, findJob, acceptedBid, appointmentForJob, proName } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { CustomerNav } from "@/components/DashNav";
import { scheduleAction } from "@/app/actions";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function CustomerSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;
  const job = findJob(id);
  if (!job || job.customerId !== user.id) notFound();
  const bid = acceptedBid(job.id);
  const appt = appointmentForJob(job.id);
  const availability = bid ? db().proAvailability.filter((a) => a.proId === bid.proId).sort((a, b) => a.weekday - b.weekday) : [];
  return (
    <div className="mx-auto max-w-2xl">
      <CustomerNav active="overview" />
      <Link href={`/dashboard/customer/jobs/${job.id}`} className="text-sm font-semibold text-trust">← Back to job</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Scheduling — {job.title}</h1>
      {bid ? <p className="mt-1 text-sm text-slate-500">With {proName(bid.proId)}. Pick a date and an arrival window that suits you.</p> : <p className="mt-1 text-sm text-slate-500">Accept a bid first — scheduling unlocks once a pro is hired.</p>}
      {appt && (
        <section className="card mt-5 p-5">
          <h3 className="font-bold text-slate-900">Current appointment</h3>
          <p className="mt-1 text-sm text-slate-600">{fmtDate(appt.scheduledDate)} · arrival window {appt.windowStart}–{appt.windowEnd} · <strong>{appt.status}</strong></p>
        </section>
      )}
      {availability.length > 0 && (
        <section className="card mt-4 p-5">
          <h3 className="font-bold text-slate-900">Pro&apos;s usual hours</h3>
          <ul className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            {availability.map((a) => <li key={a.id}>{WEEKDAYS[a.weekday]}: {a.startTime}–{a.endTime}</li>)}
          </ul>
        </section>
      )}
      {bid && (
        <form action={scheduleAction} className="card mt-4 space-y-4 p-5">
          <input type="hidden" name="jobId" value={job.id} />
          <input type="hidden" name="mode" value={appt ? "reschedule" : "confirm"} />
          <h3 className="font-bold text-slate-900">{appt ? "Reschedule" : "Set appointment"}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label" htmlFor="date">Date</label><input id="date" name="date" type="date" required className="input" defaultValue={appt?.scheduledDate ?? job.preferredDate ?? ""} /></div>
            <div><label className="label" htmlFor="windowStart">Window start</label><input id="windowStart" name="windowStart" type="time" required className="input" defaultValue={appt?.windowStart ?? "08:00"} /></div>
            <div><label className="label" htmlFor="windowEnd">Window end</label><input id="windowEnd" name="windowEnd" type="time" required className="input" defaultValue={appt?.windowEnd ?? "11:00"} /></div>
          </div>
          <button className="btn-action" type="submit">{appt ? "Reschedule appointment" : "Confirm appointment"}</button>
          <p className="text-xs text-slate-500">Free rescheduling up to 12 hours before the window starts.</p>
        </form>
      )}
    </div>
  );
}
