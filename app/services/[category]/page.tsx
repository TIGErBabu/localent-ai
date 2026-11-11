import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db, proRating } from "@/lib/store";
import { categoryBySlug, config } from "@/lib/config";
import { Empty, Stars, TierBadge } from "@/components/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) return { title: "Service not found" };
  return {
    title: `${cat.label} pros in ${config.metro}`,
    description: cat.blurb,
  };
}

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) notFound();

  const pros = db()
    .companyProfiles.filter((p) => p.skillsArray.includes(cat.slug))
    .map((profile) => ({ profile, rating: proRating(profile.userId) }))
    .sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-trust px-6 py-10 text-white md:px-10">
        <p className="text-sm font-bold uppercase tracking-widest text-white/70">{config.metro}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
          <span aria-hidden>{cat.icon} </span>
          {cat.label}
        </h1>
        <p className="mt-3 max-w-2xl text-white/85">{cat.blurb}</p>
        {!cat.launch && (
          <p className="mt-5 inline-flex rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold">
            Launching soon in Gainesville — {cat.label} is not live yet. Join as a pro to be first in line,
            or post a plumbing, electrical or handyman job today.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          {cat.label} pros near {config.metro}
        </h2>
        {pros.length === 0 ? (
          <div className="mt-4">
            <Empty
              title={`No ${cat.label.toLowerCase()} pros yet`}
              body={
                cat.launch
                  ? "New pros are joining Localent every week. Post your job and we will alert matching pros as they come on board."
                  : `${cat.label} launches soon in Gainesville. Check back shortly, or browse the trades that are already live.`
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {pros.map(({ profile, rating }) => (
              <Link key={profile.id} href={`/pros/${profile.slug}`} className="card group p-5 transition hover:border-trust">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900">{profile.businessName}</h3>
                  <TierBadge tier={profile.verificationTier} />
                </div>
                <div className="mt-2">
                  <Stars value={rating.avg} count={rating.count} />
                </div>
                {profile.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{profile.bio}</p>}
                <p className="mt-3 text-sm text-slate-500">
                  {profile.locationLabel} · Responds in ~{profile.responseTimeHours}h · {profile.yearsInBusiness} yrs in business
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-trust group-hover:underline">
                  View storefront →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-extrabold tracking-tight text-slate-900">How it works</h2>
        <ol className="mt-4 grid gap-4 text-sm text-slate-600 md:grid-cols-3">
          <li>
            <span className="font-bold text-trust">1. Post job — </span>
            describe the work and get bids from matched local pros.
          </li>
          <li>
            <span className="font-bold text-trust">2. Fund milestone escrow — </span>
            the deposit is held safely, never paid upfront.
          </li>
          <li>
            <span className="font-bold text-trust">3. Confirm &amp; release — </span>
            payment is released only when you confirm the job is done.
          </li>
        </ol>
      </section>

      <section className="rounded-3xl bg-trust-soft px-6 py-8 text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-trust">Need {cat.label.toLowerCase()} help?</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-slate-600">
          Post your job for free and compare bids — every payment runs through milestone escrow.
        </p>
        <Link href="/register/customer" className="btn-action mt-4">Post a job</Link>
      </section>
    </div>
  );
}
