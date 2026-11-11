import Link from "next/link";
import { db, profileByUserId } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { Empty } from "@/components/ui";
import { requireRole } from "@/lib/session";
import { AdminNav } from "@/components/DashNav";

export default async function AdminUsersPage() {
  const admin = await requireRole("ADMIN");
  const data = db();

  const users = [...data.users].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto">
      <AdminNav active="users" />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {admin.name}. All {users.length} accounts on Localent — customers, pros and admins.
        </p>
      </div>

      {users.length === 0 ? (
        <Empty title="No users yet" body="Registered users will appear here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Phone</th>
                <th className="px-4 py-3 font-bold">Phone verified</th>
                <th className="px-4 py-3 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const profile = user.role === "PRO" ? profileByUserId(user.id) : undefined;
                return (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {profile ? (
                        <Link href={`/pros/${profile.slug}`} className="text-trust hover:underline">
                          {user.name}
                        </Link>
                      ) : (
                        user.name
                      )}
                      {profile ? (
                        <span className="block text-xs font-normal text-slate-500">
                          {profile.businessName} · /pros/{profile.slug}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          user.role === "ADMIN"
                            ? "bg-trust text-white"
                            : user.role === "PRO"
                              ? "bg-trust-soft text-trust"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.phoneNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{user.phoneVerified ? "Yes" : "No"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDate(user.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
