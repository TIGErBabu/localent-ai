import { db, findJob } from "@/lib/store";
import { money, fmtDateTime } from "@/lib/utils";
import { Empty } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { AdminNav } from "@/components/DashNav";

export default async function AdminPaymentsPage() {
  const admin = await requireRole("ADMIN");
  const data = db();

  const payments = [...data.payments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totals = payments.reduce(
    (acc, p) => ({
      grossCents: acc.grossCents + p.grossCents,
      customerFeeCents: acc.customerFeeCents + p.customerFeeCents,
      commissionCents: acc.commissionCents + p.commissionCents,
      netCents: acc.netCents + p.netCents,
    }),
    { grossCents: 0, customerFeeCents: 0, commissionCents: 0, netCents: 0 },
  );

  return (
    <div className="mx-auto">
      <AdminNav active="payments" />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {admin.name}. Full payments ledger — gross, customer fee, commission and net per milestone charge.
        </p>
      </div>

      {payments.length === 0 ? (
        <Empty title="No payments yet" body="Payments will appear here as soon as a customer funds a milestone." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-bold">Payment intent</th>
                <th className="px-4 py-3 font-bold">Job</th>
                <th className="px-4 py-3 font-bold">Milestone</th>
                <th className="px-4 py-3 text-right font-bold">Gross</th>
                <th className="px-4 py-3 text-right font-bold">Customer fee</th>
                <th className="px-4 py-3 text-right font-bold">Commission</th>
                <th className="px-4 py-3 text-right font-bold">Net</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const job = findJob(payment.jobId);
                const milestone = payment.milestoneId
                  ? data.paymentMilestones.find((m) => m.id === payment.milestoneId)
                  : undefined;
                return (
                  <tr key={payment.id} className="border-b border-slate-100 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{payment.paymentIntentId}</td>
                    <td className="max-w-xs px-4 py-3 font-semibold text-slate-800">{job?.title ?? payment.jobId}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {milestone ? (
                        <>
                          #{milestone.seq}
                          <span className="block text-xs text-slate-500">{milestone.label}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-800">{money(payment.grossCents)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{money(payment.customerFeeCents)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{money(payment.commissionCents)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600">{money(payment.netCents)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          payment.status === "RELEASED"
                            ? "bg-trust-soft text-trust"
                            : payment.status === "HELD"
                              ? "bg-amber-100 text-amber-800"
                              : payment.status === "REFUNDED"
                                ? "bg-slate-200 text-slate-600"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {payment.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDateTime(payment.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td className="px-4 py-3" colSpan={3}>
                  Totals ({payments.length} payments)
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{money(totals.grossCents)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{money(totals.customerFeeCents)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{money(totals.commissionCents)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{money(totals.netCents)}</td>
                <td className="px-4 py-3" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Demo payment intent ids are simulated (pi_demo_…) and do not correspond to live Stripe charges. In live mode this ledger
        reconciles against Stripe webhooks — match on paymentIntentId, then compare gross, customer fee, commission and net before
        marking a milestone released.
      </p>
    </div>
  );
}
