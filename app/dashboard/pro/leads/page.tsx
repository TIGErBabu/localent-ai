import { requireRole } from "@/lib/session";
import { db, profileByUserId, matchProsForJob } from "@/lib/store";
import { money, haversineMiles } from "@/lib/utils";
import { categoryLabel } from "@/lib/config";
import { Empty } from "@/components/ui";
import { ProNav } from "@/components/DashNav";
import { submitBidAction } from "@/app/actions";

export default async function ProLeadsPage() {
  const user = await requireRole("PRO");
  const profile = profileByUserId(user.id);
  const open = db().jobPosts.filter((j) => j.status === "OPEN");
  const leads = profile
    ? open.map((j) => ({ job: j, match: matchProsForJob(j).find((m) => m.profile.userId === user.id), myBid: db().bids.find((b) => b.jobId === j.id && b.proId === user.id) }))
        .filter((x) => x.match || x.myBid)
        .sort((a, b) => (a.match?.distanceMiles ?? haversineMiles(a.job.locationLat, a.job.locationLng, profile.locationLat, profile.locationLng)) - (b.match?.distanceMiles ?? 0))
    : [];
  return (
    <div>
      <ProNav active="leads" />
      <h1 className="text-2xl font-extrabold text-slate-900">Job leads near you</h1>
      <p className="mt-1 text-sm text-slate-500">Matched to your skills and service radius, closest first. Locations are approximate until a customer funds the deposit — that rule protects customers, and it protects you from time-wasters.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {leads.length === 0 && <Empty title="No leads right now" body="New jobs matching your skills and radius will appear here — and arrive by SMS when live notifications are on." />}
        {leads.map(({ job, match, myBid }) => (
          <article key={job.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-slate-900">{job.title}</p>
              <span className="shrink-0 rounded-full bg-trust-soft px-2.5 py-0.5 text-xs font-bold text-trust">{categoryLabel(job.category)}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{job.locationLabel} · ~{(match?.distanceMiles ?? 0).toFixed(1)} mi away · Budget {money(job.budgetMinCents)}–{money(job.budgetMaxCents)}</p>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">{job.description}</p>
            {myBid ? (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">Your bid: {money(myBid.totalAmountCents)} — you receive {money(myBid.netPayoutCents)} · {myBid.status}</p>
            ) : (
              <form action={submitBidAction} className="mt-4 space-y-2">
                <input type="hidden" name="jobId" value={job.id} />
                <div className="flex gap-2">
                  <input name="totalDollars" type="number" min="10" step="1" required className="input" placeholder="Your total price ($)" aria-label="Bid total in dollars" />
                </div>
                <textarea name="proposal" required rows={2} className="input" placeholder="What is included, warranty, when you can start…" aria-label="Proposal" />
                <button className="btn-action w-full" type="submit">Submit bid</button>
                <p className="text-center text-xs text-slate-400">Split preview: the confirmation shows your net after the platform commission — the customer&apos;s service fee is charged on top, never deducted from you.</p>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
