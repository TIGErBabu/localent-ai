import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db, findJob, acceptedBid, proName } from "@/lib/store";
import { Stars } from "@/components/ui";
import { CustomerNav } from "@/components/DashNav";
import { submitReviewAction } from "@/app/actions";

export default async function CustomerReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;
  const job = findJob(id);
  if (!job || job.customerId !== user.id) notFound();
  const bid = acceptedBid(job.id);
  const existing = bid ? db().reviews.find((r) => r.jobId === job.id && r.proId === bid.proId && r.customerId === user.id) : undefined;
  return (
    <div className="mx-auto max-w-2xl">
      <CustomerNav active="overview" />
      <Link href={`/dashboard/customer/jobs/${job.id}`} className="text-sm font-semibold text-trust">← Back to job</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Review — {job.title}</h1>
      {existing ? (
        <section className="card mt-5 p-5">
          <p className="font-bold text-slate-900">Your verified review</p>
          <div className="mt-1"><Stars value={existing.ratingValue} count={1} /></div>
          <p className="mt-2 text-slate-700">{existing.reviewText}</p>
          <p className="mt-2 text-xs font-semibold text-trust">✓ Verified — this review is tied to a completed, paid job.</p>
        </section>
      ) : job.status !== "COMPLETED" || !bid ? (
        <section className="card mt-5 p-5 text-sm text-slate-600">
          Reviews unlock when a job is <strong>completed and the escrow has been released</strong>. That rule is what makes Localent reviews trustworthy — nobody can review a job they didn&apos;t actually pay for through the platform.
        </section>
      ) : (
        <form action={submitReviewAction} className="card mt-5 space-y-4 p-5">
          <input type="hidden" name="jobId" value={job.id} />
          <p className="text-sm text-slate-600">How was {proName(bid.proId)}?</p>
          <div><label className="label" htmlFor="rating">Rating</label>
            <select id="rating" name="rating" className="input">
              <option value="5">★★★★★ — Excellent</option><option value="4">★★★★ — Good</option><option value="3">★★★ — Okay</option><option value="2">★★ — Poor</option><option value="1">★ — Bad</option>
            </select></div>
          <div><label className="label" htmlFor="text">Your review</label><textarea id="text" name="text" rows={4} required className="input" placeholder="Punctuality, quality, communication, price honesty…" /></div>
          <button className="btn-action w-full" type="submit">Publish verified review</button>
        </form>
      )}
    </div>
  );
}
