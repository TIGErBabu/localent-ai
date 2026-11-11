import Link from "next/link";

export function CustomerNav({ active }: { active: string }) {
  const items = [
    ["Overview", "/dashboard/customer", "overview"],
    ["Post a job", "/dashboard/customer/jobs/new", "new"],
    ["Messages", "/dashboard/customer/messages", "messages"],
    ["Settings", "/dashboard/customer/settings", "settings"],
  ] as const;
  return <DashNavShell items={items} active={active} />;
}
export function ProNav({ active }: { active: string }) {
  const items = [
    ["Overview", "/dashboard/pro", "overview"],
    ["Leads", "/dashboard/pro/leads", "leads"],
    ["Profile", "/dashboard/pro/profile", "profile"],
    ["Availability", "/dashboard/pro/availability", "availability"],
    ["Wallet", "/dashboard/pro/wallet", "wallet"],
    ["Messages", "/dashboard/pro/messages", "messages"],
  ] as const;
  return <DashNavShell items={items} active={active} />;
}
export function AdminNav({ active }: { active: string }) {
  const items = [
    ["Overview", "/admin", "overview"],
    ["Verifications", "/admin/verifications", "verifications"],
    ["Disputes", "/admin/disputes", "disputes"],
    ["Reports", "/admin/reports", "reports"],
    ["Users", "/admin/users", "users"],
    ["Jobs", "/admin/jobs", "jobs"],
    ["Payments", "/admin/payments", "payments"],
  ] as const;
  return <DashNavShell items={items} active={active} />;
}
function DashNavShell({ items, active }: { items: readonly (readonly [string, string, string])[]; active: string }) {
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Dashboard">
      {items.map(([label, href, key]) => (
        <Link key={key} href={href} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${key === active ? "bg-trust text-white" : "border border-slate-300 bg-white text-slate-600 hover:border-trust hover:text-trust"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
