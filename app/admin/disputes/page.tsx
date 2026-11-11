import Link from "next/link";
import { db, findJob, findUser, milestonesForJob, messagesForJob } from "@/lib/store";
import { money, fmtDate, fmtDateTime } from "@/lib/utils";
import { StatusPill, Empty } from "@/components/ui";
import { adminResolveDisputeAction } from "@/app/actions";
import { requireRole } from "@/lib/session";
import { AdminNav } from "@/components/DashNav";

export default async function AdminDisputesPage() {
  const admin = await requireRole("ADMIN");
  const data = db();

  const disputes = [...data.disputes].sort((a, b) => {
    if (a.status === "OPEN" && b.status !== "OPEN") return -1;
    if (b.status === "OPEN" && a.status !== "OPEN") return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="mx-auto">
      <AdminNav active="disputes" />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Disputes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {admin.name}. Review the job, its escrow milestones and the chat record before releasing or refunding held funds.
        </p>
      </div>

      {disputes.length === 0 ? (
        <Empty title="No disputes" body="When a customer or pro opens a dispute, it will appear here with its escrow and chat record." />
      ) : (
        <div className="space-y-5">
          {disputes.map((dispute) => {
            const job = findJob(dispute.jobId);
            const milestones = milestonesForJob(dispute.jobId);
            const messages = messagesForJob(dispute.jobId);
            const openedBy = findUser(dispute.openedBy);
            const isOpen = dispute.status === "OPEN";
            const heldCents = milestones.filter((m) => m.status === "HELD").reduce((s, m) => s + m.amountCents, 0);

            return (
              <article key={dispute.id} className={`card p-5 ${isOpen ? "" : "bg-slate-50 opacity-70"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {job ? (
                        <Link href="/admin/jobs" className="hover:text-trust hover:underline">
                          {job.title}
                        </Link>
                      ) : (
                        dispute.jobId
                      )}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {job ? `${job.category} · ${job.locationLabel} · ` : ""}
                      Opened {fmtDateTime(dispute.createdAt)} by {openedBy?.name ?? dispute.openedBy}
                      {job ? ` · Customer: ${findUser(job.customerId)?.name ?? job.customerId}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {job ? <StatusPill status={job.status} /> : null}
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isOpen ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {dispute.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-trust-soft p-4">
                  <p className="text-sm font-semibold text-trust">Reason for dispute</p>
                  <p className="mt-1 text-sm text-slate-700">{dispute.reason}</p>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <section aria-label="Escrow milestones">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Milestones · {money(heldCents)} currently held
                    </h3>
                    {milestones.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">No milestones for this job.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {milestones.map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                            <span className="text-slate-700">
                              <span className="font-semibold">#{m.seq}</span> {m.label}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{money(m.amountCents)}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{m.status}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section aria-label="Chat messages">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Job chat</h3>
                    {messages.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">No messages on this job.</p>
                    ) : (
                      <ul className="mt-2 space-y-3">
                        {messages.map((msg) => (
                          <li key={msg.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <p className="text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">{findUser(msg.senderId)?.name ?? msg.senderId}</span>
                              {" · "}
                              {fmtDateTime(msg.timestamp)}
                              {msg.flagged ? " · flagged" : ""}
                            </p>
                            <p className="mt-1 text-sm text-slate-700">{msg.messageText}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>

                {isOpen ? (
                  <form action={adminResolveDisputeAction} className="mt-5 border-t border-slate-200 pt-4">
                    <input type="hidden" name="disputeId" value={dispute.id} />
                    <label className="label" htmlFor={`dispute-note-${dispute.id}`}>
                      Resolution note
                    </label>
                    <input
                      id={`dispute-note-${dispute.id}`}
                      name="note"
                      className="input"
                      placeholder="What was decided and why — saved as the dispute resolution"
                    />
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button type="submit" name="decision" value="release" className="btn-trust">
                        Release escrow to pro
                      </button>
                      <button type="submit" name="decision" value="refund" className="btn-ghost">
                        Refund customer
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-800">Resolution:</span> {dispute.resolution ?? "—"}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-slate-800">Resolved:</span>{" "}
                      {dispute.resolvedAt ? fmtDate(dispute.resolvedAt) : "—"}
                      {dispute.resolvedAt ? ` (${fmtDateTime(dispute.resolvedAt)})` : ""}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
