import Link from "next/link";
import { requireRole } from "@/lib/session";
import { profileByUserId, proRating } from "@/lib/store";
import { config } from "@/lib/config";
import { TierBadge, Stars } from "@/components/ui";
import { ProNav } from "@/components/DashNav";
import { updateProfileAction, submitVerificationAction } from "@/app/actions";

export default async function ProProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; verification?: string }> }) {
  const user = await requireRole("PRO");
  const sp = await searchParams;
  const p = profileByUserId(user.id);
  if (!p) return <div><ProNav active="profile" /><p className="card p-5">No company profile found for this account.</p></div>;
  const rating = proRating(user.id);
  return (
    <div className="mx-auto max-w-3xl">
      <ProNav active="profile" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">Company profile</h1>
        <Link href={`/pros/${p.slug}`} className="btn-ghost text-sm">View public storefront</Link>
      </div>
      <div className="mt-2 flex items-center gap-2"><TierBadge tier={p.verificationTier} /><Stars value={rating.avg} count={rating.count} /></div>
      {sp.saved && <p className="mt-3 rounded-xl bg-trust-soft px-4 py-3 text-sm font-semibold text-trust">Profile saved.</p>}
      {sp.verification === "submitted" && <p className="mt-3 rounded-xl bg-trust-soft px-4 py-3 text-sm font-semibold text-trust">Verification submitted — our team reviews licence + background check, usually within 2 business days.</p>}
      <form action={updateProfileAction} className="card mt-5 space-y-4 p-6">
        <div><label className="label" htmlFor="businessName">Business name</label><input id="businessName" name="businessName" className="input" defaultValue={p.businessName} /></div>
        <div><label className="label" htmlFor="bio">Bio</label><textarea id="bio" name="bio" rows={4} className="input" defaultValue={p.bio ?? ""} /></div>
        <fieldset>
          <legend className="label">Skills</legend>
          <div className="flex flex-wrap gap-2">
            {config.categories.map((c) => (
              <label key={c.slug} className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium">
                <input type="checkbox" name="skills" value={c.slug} defaultChecked={p.skillsArray.includes(c.slug)} className="h-4 w-4 accent-[#1E3A8A]" /> {c.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="radius">Service radius (miles)</label><input id="radius" name="radius" type="number" min="1" max="100" className="input" defaultValue={p.serviceRadiusMiles} /></div>
          <div><label className="label" htmlFor="responseTime">Typical response (hours)</label><input id="responseTime" name="responseTime" type="number" min="1" max="48" className="input" defaultValue={p.responseTimeHours} /></div>
        </div>
        <div>
          <label className="label" htmlFor="portfolioLabel">Portfolio — current items ({p.portfolioUrls.length}/8)</label>
          <ul className="mb-2 flex flex-wrap gap-2">{p.portfolioUrls.map((u) => <li key={u} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">🖼 {u.replace("demo://portfolio/", "")}</li>)}</ul>
          <input id="portfolioLabel" name="portfolioLabel" className="input" placeholder="Add an item label, e.g. panel-upgrade-before-after" />
          <p className="mt-1 text-xs text-slate-400">Demo mode stores labels as placeholder keys; live mode uploads to private Supabase storage.</p>
        </div>
        <button className="btn-action" type="submit">Save profile</button>
      </form>

      <section className="card mt-4 p-6">
        <h2 className="font-bold text-slate-900">Verification</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Current tier</dt><dd className="font-semibold">{p.verificationTier.replace(/_/g, " ")}</dd></div>
          <div><dt className="text-slate-500">Background check</dt><dd className="font-semibold">{p.backgroundCheckStatus ?? "Not started"}</dd></div>
          <div><dt className="text-slate-500">Licence</dt><dd className="font-semibold">{p.licenceNumber ? `${p.licenceTrade} · ${p.licenceNumber} (${p.licenceState})` : "None on file"}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-slate-600"><strong>Basic</strong> = ID checked. <strong>Verified Pro</strong> = background check passed + trade licence reviewed. Customers see the difference — Verified Pros win more bids.</p>
        <form action={submitVerificationAction} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input name="licenceTrade" className="input" placeholder="Trade (e.g. Plumbing)" defaultValue={p.licenceTrade ?? ""} aria-label="Licence trade" />
          <input name="licenceNumber" className="input" placeholder="Licence number" defaultValue={p.licenceNumber ?? ""} aria-label="Licence number" />
          <input name="licenceState" className="input" placeholder="State" defaultValue={p.licenceState ?? "FL"} aria-label="Licence state" />
          <button className="btn-trust sm:col-span-3" type="submit">Submit for verification</button>
        </form>
      </section>
    </div>
  );
}
