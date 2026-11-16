import { changePasswordAction } from "@/app/actions";

// Shared change-password form (customer settings + pro profile). `back` is the
// path the action redirects to with ?pw=saved|error|weak.
export default function ChangePasswordForm({ back, pw }: { back: string; pw?: string }) {
  return (
    <section className="card mt-4 p-6">
      <p className="font-bold text-slate-900">Change password</p>
      {pw === "saved" && <p className="mt-2 rounded-lg bg-trust-soft px-3 py-2 text-sm font-semibold text-trust">Password changed. Your other sessions were signed out.</p>}
      {pw === "error" && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Your current password didn&apos;t match. Try again.</p>}
      {pw === "weak" && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">New password must be at least 8 characters.</p>}
      <form action={changePasswordAction} className="mt-3 space-y-3">
        <input type="hidden" name="back" value={back} />
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">New password (8+ characters)</label>
          <input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <button className="btn-ghost" type="submit">Change password</button>
      </form>
    </section>
  );
}
