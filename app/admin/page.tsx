import { db, findUser } from "@/lib/store";
import { money, fmtDateTime } from "@/lib/utils";
import { Empty } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { AdminNav } from "@/components/DashNav";

export default async function AdminOverviewPage() {
  const admin = await requireRole("ADMIN");
  const data = db();

  const grossVolumeCents = data.payments
    .filter((p) => p.status === "HELD" || p.status === "RELEASED")
    .reduce((s, p) => s + p.grossCents, 0);

  const platformRevenueCents = data.payments
    .filter((p) => p.status === "RELEASED")
    .reduce((s, p) => s + p.commissionCents + p.customerFeeCents, 0);

  const escrowHeldCents = data.paymentMilestones
    .filter((m) => m.status === "HELD")
    .reduce((s, m) => s + m.amountCents, 0);

  const openDisputes = data.disputes.filter((d) => d.status === "OPEN").length;

  const usersByRole = ["CUSTOMER", "PRO", "ADMIN"].map((role) => ({
    label: role,
    count: data.users.filter((u) => u.role === role).length,
  }));

  const jobStatuses = ["OPEN", "ACCEPTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "DISPUTED", "CANCELLED"] as const;
  const jobsByStatus = jobStatuses.map((status) => ({
    label: status.replace(/_/g, " "),
    count: data.jobPosts.filter((j) => j.status === status).length,
  }));

  const tiers = ["NONE", "BASIC_ID", "VERIFIED_PRO"] as const;
  const prosByTier = tiers.map((tier) => ({
    label: tier.replace(/_/g, " "),
    count: data.companyProfiles.filter((p) => p.verificationTier === tier).length,
  }));

  const recentAudit = [...data.adminAuditLogs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const kpis = [
    { label: "Gross volume", value: money(grossVolumeCents), hint: "Payments held or released" },
    { label: "Platform revenue earned", value: money(platformRevenueCents), hint: "Commission + customer fees on released payments" },
    { label: "Escrow currently held", value: money(escrowHeldCents), hint: "Milestones in HELD status" },
    { label: "Open disputes", value: String(openDisputes), hint: openDisputes === 1 ? "1 dispute needs review" : `${openDisputes} disputes need review` },
  ];

  const countGroups: { title: string; rows: { label: string; count: number }[] }[] = [
    { title: "Users by role", rows: usersByRole },
    { title: "Jobs by status", rows: jobsByStatus },
    { title: "Pros by verification tier", rows: prosByTier },
  ];

  return (
    <div className="mx-auto">
      <AdminNav active="overview" />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Admin overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {admin.name} ({admin.email}). Marketplace money, trust and safety at a glance.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key metrics">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-trust">{kpi.value}</p>
            <p className="mt-1 text-sm text-slate-500">{kpi.hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Counts">
        {countGroups.map((group) => (
          <div key={group.title} className="card p-5">
            <h2 className="font-bold text-slate-900">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.rows.map((row) => (
                <li key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="rounded-full bg-trust-soft px-2.5 py-0.5 text-xs font-bold text-trust">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-6" aria-label="Recent admin activity">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Recent admin activity</h2>
        {recentAudit.length === 0 ? (
          <Empty title="No audit entries yet" body="Admin actions such as verifications and dispute resolutions will appear here." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-bold">When</th>
                  <th className="px-4 py-3 font-bold">Admin</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                  <th className="px-4 py-3 font-bold">Target</th>
                  <th className="px-4 py-3 font-bold">Detail</th>
                </tr>
              </thead>
              <tbody>
                {recentAudit.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{findUser(log.adminId)?.name ?? log.adminId}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-trust-soft px-2.5 py-0.5 text-xs font-bold text-trust">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.targetType} · <span className="font-mono text-xs">{log.targetId}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
