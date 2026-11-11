import { db, findUser, milestonesForJob, acceptedBid, proName } from "@/lib/store";
import { money, fmtDate } from "@/lib/utils";
import { StatusPill, Empty } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { AdminNav } from "@/components/DashNav";

export default async function AdminJobsPage() {
  const admin = await requireRole("ADMIN");
  const data = db();

  const jobs = [...data.jobPosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto">
      <AdminNav active="jobs" />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {admin.name}. All {jobs.length} jobs posted on Localent, with accepted pros and escrow held.
        </p>
      </div>

      {jobs.length === 0 ? (
        <Empty title="No jobs yet" body="Jobs posted by customers will appear here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-bold">Title</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Budget</th>
                <th className="px-4 py-3 font-bold">Accepted pro</th>
                <th className="px-4 py-3 font-bold">Escrow held</th>
                <th className="px-4 py-3 font-bold">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const bid = acceptedBid(job.id);
                const escrowHeldCents = milestonesForJob(job.id)
                  .filter((m) => m.status === "HELD")
                  .reduce((s, m) => s + m.amountCents, 0);
                return (
                  <tr key={job.id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="max-w-xs px-4 py-3 font-semibold text-slate-800">
                      {job.title}
                      <span className="block text-xs font-normal text-slate-500">{job.locationLabel}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{job.category}</td>
                    <td className="px-4 py-3 text-slate-600">{findUser(job.customerId)?.name ?? job.customerId}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={job.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {money(job.budgetMinCents)} – {money(job.budgetMaxCents)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {bid ? (
                        <>
                          {proName(bid.proId)}
                          <span className="block text-xs text-slate-500">{money(bid.totalAmountCents)} bid</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                      {escrowHeldCents > 0 ? money(escrowHeldCents) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDate(job.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
