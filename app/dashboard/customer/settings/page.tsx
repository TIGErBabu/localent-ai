import { requireRole } from "@/lib/session";
import { CustomerNav } from "@/components/DashNav";
import { updateSettingsAction } from "@/app/actions";

export default async function CustomerSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireRole("CUSTOMER");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <CustomerNav active="settings" />
      <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
      {sp.saved && <p className="mt-3 rounded-xl bg-trust-soft px-4 py-3 text-sm font-semibold text-trust">Saved.</p>}
      <form action={updateSettingsAction} className="card mt-5 space-y-4 p-6">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" name="name" className="input" defaultValue={user.name} /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" defaultValue={user.email} disabled /><p className="mt-1 text-xs text-slate-400">Email changes need a support ticket in production.</p></div>
        <div><label className="label" htmlFor="phone">Phone (for appointment SMS)</label><input id="phone" name="phone" className="input" defaultValue={user.phoneNumber ?? ""} /></div>
        <button className="btn-action" type="submit">Save settings</button>
      </form>
      <section className="card mt-4 p-6 text-sm text-slate-600">
        <p className="font-bold text-slate-900">Your privacy on Localent</p>
        <p className="mt-1">Your exact address and phone number are only shared with a pro after you fund that job&apos;s deposit. Everything before that is approximate area + in-app chat with automatic contact masking.</p>
      </section>
    </div>
  );
}
