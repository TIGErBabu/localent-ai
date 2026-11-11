import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db, bidsForJob, milestonesForJob, escrowHeldCents } from "@/lib/store";
import { money } from "@/lib/utils";
import { StatusPill, Empty } from "@/components/ui";
import { CustomerNav } from "@/components/DashNav";

export default async function CustomerOverview() {
  const user = await requireRole("CUSTOMER");
  const jobs = db().jobPosts.filter((j) => j.customerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const awaiting = jobs.filter((j) => j.status === "OPEN" && bidsForJob(j.id).some((b) => b.status === "PENDING")).length;
  const held = jobs.reduce((s, j) => s + escrowHeldCents(j.id), 0);
  const notes = db().notifications.filter((x) => x.userId === user.id).slice(-5).reverse();
  return (
    <div>
      <CustomerNav active="overview" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">Your jobs, bids and escrow — all in one place.</p>
        </div>
        <Link href="/dashboard/customer/jobs/new" className="btn-action">+ Post a job</Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Active jobs</p><p className="mt-1 text-3xl font-extrabold text-trust">{jobs.filter((j) => !["COMPLETED", "CANCELLED"].includes(j.status)).length}</p></div>
        <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Bids awaiting your decision</p><p className="mt-1 text-3xl font-extrabold text-trust">{awaiting}</p></div>
        <div className="card p-5"><p className="text-sm font-semibold text-slate-500">Held safely in escrow</p><p className="mt-1 text-3xl font-extrabold text-trust">{money(held)}</p></div>
      </div>
      <h2 className="mt-8 text-lg font-bold text-slate-900">Your jobs</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {jobs.length === 0 && <Empty title="No jobs yet" body="Post your first job and matched local pros will bid on it." />}
        {jobs.map((j) => {
          const pending = bidsForJob(j.id).filter((b) => b.status === "PENDING").length;
          const ms = milestonesForJob(j.id);
          return (
            <Link key={j.id} href={`/dashboard/customer/jobs/${j.id}`} className="card block p-5 transition hover:border-trust">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold text-slate-900">{j.title}</p><StatusPill status={j.status} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{j.description}</p>
              <p className="mt-3 text-sm text-slate-600">
                Budget {money(j.budgetMinCents)}–{money(j.budgetMaxCents)}
                {pending > 0 && <span className="ml-2 font-semibold text-trust">· {pending} bid{pending === 1 ? "" : "s"} waiting</span>}
                {ms.length > 0 && <span className="ml-2">· Escrow: {ms.map((m) => `${m.seq}:${m.status}`).join(" · ")}</span>}
              </p>
            </Link>
          );
        })}
      </div>
      {notes.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-bold text-slate-900">Recent updates</h2>
          <ul className="card mt-3 divide-y divide-slate-100">
            {notes.map((x) => <li key={x.id} className="px-5 py-3 text-sm text-slate-600">{x.text}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
