import { requireRole } from "@/lib/session";
import { db } from "@/lib/store";
import { ProNav } from "@/components/DashNav";
import { updateAvailabilityAction } from "@/app/actions";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ProAvailabilityPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireRole("PRO");
  const sp = await searchParams;
  const mine = db().proAvailability.filter((a) => a.proId === user.id);
  return (
    <div className="mx-auto max-w-2xl">
      <ProNav active="availability" />
      <h1 className="text-2xl font-extrabold text-slate-900">Weekly availability</h1>
      <p className="mt-1 text-sm text-slate-500">Customers see these hours when scheduling. Keep them honest — no-shows hurt your rating.</p>
      {sp.saved && <p className="mt-3 rounded-xl bg-trust-soft px-4 py-3 text-sm font-semibold text-trust">Availability saved.</p>}
      <form action={updateAvailabilityAction} className="card mt-5 space-y-2 p-5">
        {WEEKDAYS.map((label, d) => {
          const row = mine.find((a) => a.weekday === d);
          return (
            <div key={d} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
              <label className="flex w-32 items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" name={`day-${d}`} defaultChecked={!!row} className="h-4 w-4 accent-[#1E3A8A]" /> {label}
              </label>
              <input type="time" name={`start-${d}`} defaultValue={row?.startTime ?? "08:00"} className="input !min-h-[40px] w-32" aria-label={`${label} start`} />
              <span className="text-slate-400">→</span>
              <input type="time" name={`end-${d}`} defaultValue={row?.endTime ?? "17:00"} className="input !min-h-[40px] w-32" aria-label={`${label} end`} />
            </div>
          );
        })}
        <button className="btn-action" type="submit">Save availability</button>
      </form>
    </div>
  );
}
