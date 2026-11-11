import { requireRole } from "@/lib/session";
import { config } from "@/lib/config";
import { postJobAction } from "@/app/actions";
import { CustomerNav } from "@/components/DashNav";

export default async function NewJobPage() {
  await requireRole("CUSTOMER");
  return (
    <div className="mx-auto max-w-2xl">
      <CustomerNav active="new" />
      <h1 className="text-2xl font-extrabold text-slate-900">Post a job</h1>
      <p className="mt-1 text-sm text-slate-500">Matched pros within your area get alerted instantly. Your exact address stays private until you fund the deposit.</p>
      <form action={postJobAction} className="card mt-6 space-y-4 p-6">
        <div><label className="label" htmlFor="title">What needs doing?</label><input id="title" name="title" required className="input" placeholder="e.g. Kitchen sink leak soaking the cabinet" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="category">Category</label>
            <select id="category" name="category" className="input">
              {config.categories.filter((c) => c.launch).map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select></div>
          <div><label className="label" htmlFor="preferredDate">Preferred date</label><input id="preferredDate" name="preferredDate" type="date" className="input" /></div>
        </div>
        <div><label className="label" htmlFor="description">Describe the job</label><textarea id="description" name="description" required rows={4} className="input" placeholder="What's wrong, what have you tried, any access details that help a pro quote accurately…" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="budgetMin">Budget min ($)</label><input id="budgetMin" name="budgetMin" type="number" min="10" required className="input" placeholder="150" /></div>
          <div><label className="label" htmlFor="budgetMax">Budget max ($)</label><input id="budgetMax" name="budgetMax" type="number" min="10" required className="input" placeholder="300" /></div>
        </div>
        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold text-slate-700">Exact address — private 🔒</legend>
          <p className="mb-3 text-xs text-slate-500">Only the pro you hire sees this, and only after your deposit is funded and held in escrow. Listings show an approximate area only.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="streetAddress">Street address</label><input id="streetAddress" name="streetAddress" required className="input" /></div>
            <div><label className="label" htmlFor="unit">Unit (optional)</label><input id="unit" name="unit" className="input" /></div>
            <div><label className="label" htmlFor="zip">ZIP</label><input id="zip" name="zip" required className="input" /></div>
            <div><label className="label" htmlFor="accessNotes">Access notes</label><input id="accessNotes" name="accessNotes" className="input" placeholder="Gate code, pets, parking…" /></div>
          </div>
        </fieldset>
        <button type="submit" className="btn-action w-full">Post job &amp; alert matched pros</button>
      </form>
    </div>
  );
}
