import Link from "next/link";
import type { Metadata } from "next";
import { db, proRating } from "@/lib/store";
import { categoryLabel, config } from "@/lib/config";
import { Empty, Stars, TierBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: `Find a pro in ${config.metro}`,
  description: "Browse verified local pros on Localent — plumbing, electrical and handyman services with escrow-protected payments.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const category = (sp.category ?? "").trim();
  const needle = q.toLowerCase();

  const results = db().companyProfiles.filter((p) => {
    if (category && !p.skillsArray.includes(category)) return false;
    if (!needle) return true;
    const haystack = [
      p.businessName,
      p.bio ?? "",
      p.locationLabel,
      ...p.skillsArray,
      ...p.skillsArray.map((s) => categoryLabel(s)),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  const sorted = [...results]
    .map((profile) => ({ profile, rating: proRating(profile.userId) }))
    .sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Find a pro in {config.metro}</h1>
        <p className="mt-1 text-slate-500">
          Every pro below takes Localent escrow payments — your money is held until the work is confirmed done.
        </p>
      </section>

      <form method="GET" action="/directory" className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="dir-q">Search</label>
          <input
            id="dir-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by business, service or keyword…"
            className="input"
          />
        </div>
        <div className="sm:w-56">
          <label className="label" htmlFor="dir-category">Category</label>
          <select id="dir-category" name="category" defaultValue={category} className="input">
            <option value="">All categories</option>
            {config.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
                {c.launch ? "" : " (coming soon)"}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-action">Search</button>
        {(q || category) && (
          <Link href="/directory" className="btn-ghost">Clear</Link>
        )}
      </form>

      <p className="text-sm text-slate-500" aria-live="polite">
        {sorted.length} pro{sorted.length === 1 ? "" : "s"} found
        {category ? ` in ${categoryLabel(category)}` : ""}
        {q ? ` matching “${q}”` : ""}
      </p>

      {sorted.length === 0 ? (
        <Empty
          title="No pros match that search"
          body="Try a broader keyword or a different category — or post your job and Localent will alert matching pros as they join."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map(({ profile, rating }) => (
            <Link key={profile.id} href={`/pros/${profile.slug}`} className="card group p-5 transition hover:border-trust">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-900">{profile.businessName}</h2>
                <TierBadge tier={profile.verificationTier} />
              </div>
              <div className="mt-2">
                <Stars value={rating.avg} count={rating.count} />
              </div>
              {profile.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{profile.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.skillsArray.map((skill) => (
                  <span key={skill} className="rounded-full bg-trust-soft px-2.5 py-0.5 text-xs font-semibold text-trust">
                    {categoryLabel(skill)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {profile.locationLabel} · Responds in ~{profile.responseTimeHours}h · {profile.yearsInBusiness} yrs in business ·
                Serves {profile.serviceRadiusMiles} mi radius
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-trust group-hover:underline">
                View storefront →
              </span>
            </Link>
          ))}
        </div>
      )}

      <section className="rounded-3xl bg-trust px-6 py-8 text-center text-white">
        <h2 className="text-xl font-extrabold tracking-tight">Can&apos;t find the right fit?</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-white/85">
          Post your job and Localent matches it to nearby pros with the right skills automatically.
        </p>
        <Link href="/register/customer" className="btn-action mt-4">Post a job</Link>
      </section>
    </div>
  );
}
