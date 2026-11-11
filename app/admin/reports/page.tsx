import { db, findUser } from "@/lib/store";
import { fmtDateTime } from "@/lib/utils";
import { Empty } from "@/components/ui";
import { adminReportAction } from "@/app/actions";
import { requireRole } from "@/lib/session";
import { AdminNav } from "@/components/DashNav";

export default async function AdminReportsPage() {
  const admin = await requireRole("ADMIN");
  const data = db();

  const reports = [...data.reports].sort((a, b) => {
    if (a.status === "OPEN" && b.status !== "OPEN") return -1;
    if (b.status === "OPEN" && a.status !== "OPEN") return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="mx-auto">
      <AdminNav active="reports" />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {admin.name}. Reports filed by users against profiles, messages and other content.
        </p>
      </div>

      {reports.length === 0 ? (
        <Empty title="No reports" body="Reports filed by users will appear here for review." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-bold">Reporter</th>
                <th className="px-4 py-3 font-bold">Target</th>
                <th className="px-4 py-3 font-bold">Reason</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Filed</th>
                <th className="px-4 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-800">{findUser(report.reporterId)?.name ?? report.reporterId}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {report.targetType}
                    <span className="block font-mono text-xs text-slate-500">{report.targetId}</span>
                  </td>
                  <td className="max-w-sm px-4 py-3 text-slate-600">{report.reason}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        report.status === "OPEN"
                          ? "bg-red-100 text-red-800"
                          : report.status === "REVIEWED"
                            ? "bg-trust-soft text-trust"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDateTime(report.createdAt)}</td>
                  <td className="px-4 py-3">
                    {report.status === "OPEN" ? (
                      <form action={adminReportAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="reportId" value={report.id} />
                        <button type="submit" name="decision" value="review" className="btn-trust px-3 py-2 text-sm">
                          Mark reviewed
                        </button>
                        <button type="submit" name="decision" value="dismiss" className="btn-ghost px-3 py-2 text-sm">
                          Dismiss
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
