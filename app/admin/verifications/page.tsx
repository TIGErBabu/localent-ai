import { db, findUser } from "@/lib/store";
import { TierBadge, Empty } from "@/components/ui";
import { adminVerifyAction } from "@/app/actions";
import { requireRole } from "@/lib/session";
import { AdminNav } from "@/components/DashNav";

function licenceLabel(p: { licenceTrade: string | null; licenceNumber: string | null; licenceState: string | null }): string {
  if (!p.licenceNumber) return "—";
  return [p.licenceTrade, p.licenceNumber, p.licenceState].filter(Boolean).join(" · ");
}

export default async function AdminVerificationsPage() {
  const admin = await requireRole("ADMIN");
  const data = db();

  const queue = data.companyProfiles.filter((p) => p.backgroundCheckStatus === "IN_REVIEW");
  const allProfiles = [...data.companyProfiles].sort((a, b) => a.businessName.localeCompare(b.businessName));

  return (
    <div className="mx-auto">
      <AdminNav active="verifications" />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Verifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {admin.name}. Review background-check submissions (BrightSpark) before a pro is marked verified.
        </p>
      </div>

      <section aria-label="Review queue">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Review queue{" "}
          <span className="rounded-full bg-trust-soft px-2.5 py-0.5 text-xs font-bold text-trust">{queue.length}</span>
        </h2>
        {queue.length === 0 ? (
          <Empty title="Nothing waiting for review" body="When a pro submits verification documents, their background check will appear here as IN_REVIEW." />
        ) : (
          <div className="space-y-4">
            {queue.map((p) => {
              const owner = findUser(p.userId);
              return (
                <article key={p.id} className="card border-amber-300 bg-amber-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{p.businessName}</h3>
                      <p className="mt-0.5 text-sm text-slate-600">
                        Owner: {owner?.name ?? p.userId}
                        {owner?.email ? ` · ${owner.email}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      Background check: IN_REVIEW
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-semibold text-slate-700">Licence trade</dt>
                      <dd className="mt-0.5 text-slate-600">{p.licenceTrade ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Licence number</dt>
                      <dd className="mt-0.5 text-slate-600">{p.licenceNumber ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Licence state</dt>
                      <dd className="mt-0.5 text-slate-600">{p.licenceState ?? "—"}</dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700">Submitted bio</p>
                    <p className="mt-1 text-sm text-slate-600">{p.bio ?? "No bio submitted."}</p>
                  </div>

                  <form action={adminVerifyAction} className="mt-5 space-y-3">
                    <input type="hidden" name="profileId" value={p.id} />
                    <div>
                      <label className="label" htmlFor={`note-${p.id}`}>
                        Review note (optional, used on rejection)
                      </label>
                      <input id={`note-${p.id}`} name="note" className="input" placeholder="e.g. Licence photo was unreadable — please resubmit" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="submit" name="decision" value="approve" className="btn-trust">
                        Approve verification
                      </button>
                      <button type="submit" name="decision" value="reject" className="btn-ghost">
                        Reject
                      </button>
                    </div>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8" aria-label="All pro profiles">
        <h2 className="mb-3 text-lg font-bold text-slate-900">All pro profiles</h2>
        {allProfiles.length === 0 ? (
          <Empty title="No pro profiles yet" body="Pro profiles will appear here once pros register." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-bold">Business</th>
                  <th className="px-4 py-3 font-bold">Owner</th>
                  <th className="px-4 py-3 font-bold">Tier</th>
                  <th className="px-4 py-3 font-bold">Background check</th>
                  <th className="px-4 py-3 font-bold">Licence</th>
                  <th className="px-4 py-3 font-bold">Verified</th>
                </tr>
              </thead>
              <tbody>
                {allProfiles.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.businessName}</td>
                    <td className="px-4 py-3 text-slate-600">{findUser(p.userId)?.name ?? p.userId}</td>
                    <td className="px-4 py-3">
                      <TierBadge tier={p.verificationTier} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.backgroundCheckStatus ?? "Not submitted"}</td>
                    <td className="px-4 py-3 text-slate-600">{licenceLabel(p)}</td>
                    <td className="px-4 py-3 text-slate-600">{p.isVerified ? "Yes" : "No"}</td>
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
