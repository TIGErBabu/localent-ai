import Link from "next/link";
import { db, proRating } from "@/lib/store";
import { config } from "@/lib/config";
import { Stars, TierBadge } from "@/components/ui";

export default async function HomePage() {
  const featured = [...db().companyProfiles]
    .map((profile) => ({ profile, rating: proRating(profile.userId) }))
    .sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count)
    .slice(0, 3);

  const proFeePct = config.proCommissionBps / 100;
  const customerFeePct = config.customerFeeBps / 100;

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-trust text-white">
        <div className="px-6 py-12 md:px-10 md:py-16">
          <p className="text-sm font-bold uppercase tracking-widest text-white/70">
            Now serving {config.metro}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Local pros, protected payments.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Post a job, get bids from verified local pros, and pay safely through milestone
            escrow. Your money is only released when you confirm the work is done.
          </p>

          <form method="GET" action="/directory" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="hero-q">What do you need done?</label>
            <input
              id="hero-q"
              name="q"
              type="search"
              placeholder="What do you need done? e.g. leaking sink"
              className="input flex-1 border-transparent"
            />
            <label className="sr-only" htmlFor="hero-category">Category</label>
            <select id="hero-category" name="category" defaultValue="" className="input sm:w-48">
              <option value="">All categories</option>
              {config.categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-action whitespace-nowrap">
              Find a pro
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <span>✓ Escrow held until you confirm</span>
            <span>✓ Verified Pros background-checked</span>
            <span>✓ No contact sharing before funding</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">What do you need?</h2>
            <p className="mt-1 text-slate-500">Launching in {config.metro} with three trades — more on the way.</p>
          </div>
          <Link href="/directory" className="text-sm font-semibold text-trust hover:underline">
            Browse all pros →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {config.categories.map((c) =>
            c.launch ? (
              <Link key={c.slug} href={`/services/${c.slug}`} className="card group p-5 transition hover:border-trust">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl" aria-hidden>{c.icon}</span>
                  <span className="text-trust transition group-hover:translate-x-0.5" aria-hidden>→</span>
                </div>
                <h3 className="mt-3 font-bold text-slate-900">{c.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{c.blurb}</p>
              </Link>
            ) : (
              <div key={c.slug} className="card p-5 opacity-75">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl" aria-hidden>{c.icon}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                    Coming soon
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-slate-900">{c.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{c.blurb}</p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* How escrow works */}
      <section className="card p-6 md:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">How escrow works</h2>
        <p className="mt-1 text-slate-500">
          Every job runs on milestones: a {config.milestoneDepositPct}% deposit to start, then the balance on
          completion. Funds are held safely in between — never paid straight to the pro upfront.
        </p>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          <li>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-trust font-extrabold text-white">1</span>
            <h3 className="mt-3 font-bold text-slate-900">Post job</h3>
            <p className="mt-1 text-sm text-slate-500">
              Describe the work and your budget. Nearby pros with matching skills are alerted and bid with a
              flat, all-in price — the split is always shown before you accept.
            </p>
          </li>
          <li>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-trust font-extrabold text-white">2</span>
            <h3 className="mt-3 font-bold text-slate-900">Fund milestone escrow</h3>
            <p className="mt-1 text-sm text-slate-500">
              Accept a bid and fund the deposit milestone. Only then is your exact address shared, and contact
              details unmask so you can coordinate on the day.
            </p>
          </li>
          <li>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-trust font-extrabold text-white">3</span>
            <h3 className="mt-3 font-bold text-slate-900">Confirm &amp; release</h3>
            <p className="mt-1 text-sm text-slate-500">
              The pro checks in on site and shares before/after photos. You share your confirmation code and
              approve — or the balance auto-releases after {config.autoReleaseHours} hours if you raise no dispute.
            </p>
          </li>
        </ol>
      </section>

      {/* Featured pros */}
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Featured pros in {config.metro}</h2>
        <p className="mt-1 text-slate-500">Top-rated local businesses on Localent right now.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {featured.map(({ profile, rating }) => (
            <Link key={profile.id} href={`/pros/${profile.slug}`} className="card group p-5 transition hover:border-trust">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900">{profile.businessName}</h3>
                <TierBadge tier={profile.verificationTier} />
              </div>
              <div className="mt-2">
                <Stars value={rating.avg} count={rating.count} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-500">{profile.bio}</p>
              <p className="mt-3 text-sm text-slate-500">
                {profile.locationLabel} · Responds in ~{profile.responseTimeHours}h · {profile.yearsInBusiness} yrs in business
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-trust group-hover:underline">
                View storefront →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900">Verified, not just listed</h3>
          <p className="mt-1 text-sm text-slate-500">
            Verified Pros pass a background check and a licence review for their trade. ID-checked pros have
            confirmed their identity while verification is in progress — every tier is labelled on their profile.
          </p>
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-slate-900">Transparent fees</h3>
          <p className="mt-1 text-sm text-slate-500">
            Pros pay a {proFeePct}% commission and customers a {customerFeePct}% service fee, calculated on the
            accepted bid and shown in full before you fund anything. No hidden mark-ups, no off-platform payments.
          </p>
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-slate-900">Protected if it goes wrong</h3>
          <p className="mt-1 text-sm text-slate-500">
            Phone numbers and emails stay masked until escrow is funded. If the work isn&apos;t right, open a
            dispute and the held balance stays held until Localent reviews it.
          </p>
        </div>
      </section>

      {/* CTA band */}
      <section className="rounded-3xl bg-trust px-6 py-10 text-center text-white md:px-10">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Got a job that needs doing?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/85">
          Post it in a few minutes and get bids from local pros — you only pay when the work is confirmed done.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register/customer" className="btn-action">Post a job</Link>
          <Link href="/register/pro" className="btn-ghost">Join as a pro</Link>
        </div>
      </section>
    </div>
  );
}
