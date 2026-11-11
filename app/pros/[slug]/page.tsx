import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, findUser, profileBySlug, proRating } from "@/lib/store";
import { categoryLabel, config } from "@/lib/config";
import { fmtDate } from "@/lib/utils";
import { getSessionUser } from "@/lib/session";
import { reportProfileAction } from "@/app/actions";
import { Empty, Stars, TierBadge } from "@/components/ui";

function portfolioLabel(url: string, index: number): string {
  const tail = url.split("/").filter(Boolean).pop() ?? "";
  const cleaned = tail.replace(/^portfolio[-_]?/i, "").replace(/[-_]+/g, " ").trim();
  return cleaned ? `Project ${cleaned}` : `Project ${index + 1}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = profileBySlug(slug);
  if (!profile) return { title: "Pro not found" };
  return {
    title: `${profile.businessName} — ${profile.locationLabel}`,
    description: profile.bio ?? `${profile.businessName} on Localent in ${config.metro}.`,
  };
}

export default async function ProStorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const profile = profileBySlug(slug);
  if (!profile) notFound();

  const rating = proRating(profile.userId);
  const owner = findUser(profile.userId);
  const sessionUser = await getSessionUser();

  const reviews = db()
    .reviews.filter((r) => r.proId === profile.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const quoteHref =
    sessionUser?.role === "CUSTOMER" ? "/dashboard/customer/jobs/new" : "/register/customer";

  return (
    <div className="space-y-8">
      {sp.reported && (
        <p className="rounded-lg bg-trust-soft px-4 py-3 text-sm font-semibold text-trust" role="status">
          Thanks — your report has been received. Localent will review this profile.
        </p>
      )}

      {/* Storefront header */}
      <section className="card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{profile.businessName}</h1>
              <TierBadge tier={profile.verificationTier} />
            </div>
            <div className="mt-2">
              <Stars value={rating.avg} count={rating.count} />
            </div>
            {owner && <p className="mt-1 text-sm text-slate-500">Run by {owner.name}</p>}
            <p className="mt-1 text-sm text-slate-500">
              {profile.locationLabel} · On Localent since {fmtDate(profile.createdAt)}
            </p>
          </div>
          <Link href={quoteHref} className="btn-action">Request a quote</Link>
        </div>

        {profile.bio && <p className="mt-5 max-w-3xl text-slate-700">{profile.bio}</p>}

        <div className="mt-5 flex flex-wrap gap-1.5">
          {profile.skillsArray.map((skill) => (
            <Link
              key={skill}
              href={`/services/${skill}`}
              className="rounded-full bg-trust-soft px-3 py-1 text-xs font-semibold text-trust hover:underline"
            >
              {categoryLabel(skill)}
            </Link>
          ))}
        </div>

        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-semibold text-slate-700">Service area</dt>
            <dd className="mt-0.5 text-slate-500">
              {profile.locationLabel} — {profile.serviceRadiusMiles} mi radius
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Typical response</dt>
            <dd className="mt-0.5 text-slate-500">~{profile.responseTimeHours} hour{profile.responseTimeHours === 1 ? "" : "s"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Experience</dt>
            <dd className="mt-0.5 text-slate-500">{profile.yearsInBusiness} years in business</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Verification</dt>
            <dd className="mt-0.5 text-slate-500">
              {profile.verificationTier === "VERIFIED_PRO"
                ? profile.licenceNumber
                  ? `${profile.licenceTrade ?? "Trade"} licence ${profile.licenceNumber} (${profile.licenceState ?? "FL"}) · Background check passed`
                  : "Background check passed"
                : profile.verificationTier === "BASIC_ID"
                  ? "Identity checked — full verification in progress"
                  : "Verification pending"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Portfolio */}
      <section>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Recent work</h2>
        {profile.portfolioUrls.length === 0 ? (
          <div className="mt-4">
            <Empty title="No portfolio pieces yet" body={`${profile.businessName} hasn't added project photos yet. Completed Localent jobs and reviews will appear here.`} />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.portfolioUrls.map((url, i) => (
              <div
                key={url}
                className="grid aspect-[4/3] place-items-center rounded-2xl border border-slate-200 bg-slate-100 p-4 text-center"
              >
                <div>
                  <p className="text-2xl" aria-hidden>🖼️</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{portfolioLabel(url, i)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{profile.businessName} · {config.metro}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          Reviews{reviews.length ? ` (${reviews.length})` : ""}
        </h2>
        {reviews.length === 0 ? (
          <div className="mt-4">
            <Empty
              title="No reviews yet"
              body="Reviews appear here after a customer's escrow job is completed and confirmed on Localent."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((review) => {
              const customer = findUser(review.customerId);
              const job = db().jobPosts.find((j) => j.id === review.jobId);
              return (
                <li key={review.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm" aria-label={`${review.ratingValue} out of 5 stars`}>
                      <span className="text-action-dark" aria-hidden>{"★".repeat(review.ratingValue)}{"☆".repeat(5 - review.ratingValue)}</span>
                      <span className="ml-1.5 font-semibold text-slate-900">{review.ratingValue}.0</span>
                    </span>
                    <span className="text-xs text-slate-400">{fmtDate(review.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-slate-700">{review.reviewText}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{customer?.name ?? "Localent customer"}</span>
                    {job ? <> · {job.title} · {categoryLabel(job.category)}</> : null}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* CTA + report */}
      <section className="rounded-3xl bg-trust px-6 py-8 text-center text-white">
        <h2 className="text-xl font-extrabold tracking-tight">Work with {profile.businessName}</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-white/85">
          Post your job and invite this pro to bid. Payment stays in milestone escrow until you confirm the work.
        </p>
        <Link href={quoteHref} className="btn-action mt-4">Request a quote</Link>
      </section>

      {sessionUser && sessionUser.id !== profile.userId && (
        <details className="card p-5">
          <summary className="cursor-pointer text-sm font-semibold text-slate-600">Report this profile</summary>
          <form action={reportProfileAction} className="mt-4 max-w-lg space-y-3">
            <input type="hidden" name="targetId" value={profile.userId} />
            <input type="hidden" name="slug" value={profile.slug} />
            <div>
              <label className="label" htmlFor="report-reason">What&apos;s wrong?</label>
              <textarea
                id="report-reason"
                name="reason"
                required
                rows={3}
                placeholder="Tell Localent what happened — fake listing, asked for off-platform payment, no-show…"
                className="input"
              />
            </div>
            <button type="submit" className="btn-ghost">Submit report</button>
          </form>
        </details>
      )}
    </div>
  );
}
