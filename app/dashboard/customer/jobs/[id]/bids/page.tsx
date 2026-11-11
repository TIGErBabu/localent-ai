import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db, findJob, bidsForJob, profileByUserId, proRating } from "@/lib/store";
import { money, fmtDateTime } from "@/lib/utils";
import { Stars, TierBadge, Empty } from "@/components/ui";
import { CustomerNav } from "@/components/DashNav";
import { acceptBidAction } from "@/app/actions";

export default async function CustomerBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;
  const job = findJob(id);
  if (!job || job.customerId !== user.id) notFound();
  const bids = bidsForJob(job.id).sort((a, b) => a.totalAmountCents - b.totalAmountCents);
  return (
    <div>
      <CustomerNav active="overview" />
      <Link href={`/dashboard/customer/jobs/${job.id}`} className="text-sm font-semibold text-trust">← Back to job</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Compare bids — {job.title}</h1>
      <p className="mt-1 text-sm text-slate-500">Prices are all-in from the pro. The Localent service fee is added on top at checkout and shown before you pay — pros never see a different number than you do.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {bids.length === 0 && <Empty title="No bids yet" body="Matched pros have been alerted. New bids appear here as they arrive." />}
        {bids.map((b) => {
          const profile = profileByUserId(b.proId);
          const rating = proRating(b.proId);
          return (
            <article key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{profile?.businessName ?? "Localent Pro"}</p>
                  <div className="mt-1 flex items-center gap-2">{profile && <TierBadge tier={profile.verificationTier} />}<Stars value={rating.avg} count={rating.count} /></div>
                </div>
                <p className="text-2xl font-extrabold text-trust">{money(b.totalAmountCents)}</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">{b.proposalText}</p>
              <dl className="mt-4 space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Pro receives (after {b.proCommissionRateBps / 100}% commission)</dt><dd className="font-semibold">{money(b.netPayoutCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Your service fee ({b.customerFeeRateBps / 100}%, on top)</dt><dd className="font-semibold">{money(b.customerFeeCents)}</dd></div>
                <div className="flex justify-between border-t border-slate-200 pt-1"><dt className="font-semibold text-slate-700">Your total if accepted</dt><dd className="font-bold text-trust">{money(b.totalAmountCents + b.customerFeeCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Typically responds in</dt><dd className="font-semibold">{profile?.responseTimeHours ?? 4}h</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Bid expires</dt><dd className="font-semibold">{fmtDateTime(b.expiresAt)}</dd></div>
              </dl>
              {b.status === "PENDING" && job.status === "OPEN" ? (
                <form action={acceptBidAction} className="mt-4">
                  <input type="hidden" name="jobId" value={job.id} /><input type="hidden" name="bidId" value={b.id} />
                  <button className="btn-action w-full" type="submit">Accept this bid</button>
                </form>
              ) : <p className="mt-4 text-center text-sm font-bold text-slate-500">{b.status}</p>}
              {profile && <Link href={`/pros/${profile.slug}`} className="mt-2 block text-center text-sm font-semibold text-trust">View storefront &amp; reviews</Link>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
