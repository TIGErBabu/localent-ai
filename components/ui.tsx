import type { JobStatus, VerificationTier } from "@/lib/types";

export function Stars({ value, count }: { value: number; count?: number }) {
  if (!count) return <span className="text-sm text-slate-500">New on Localent</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-action-dark" aria-hidden>★</span>
      <span className="font-semibold text-slate-900">{value.toFixed(1)}</span>
      <span className="text-slate-500">({count} review{count === 1 ? "" : "s"})</span>
    </span>
  );
}
export function TierBadge({ tier }: { tier: VerificationTier }) {
  if (tier === "VERIFIED_PRO") return <span className="inline-flex items-center gap-1 rounded-full bg-trust px-2.5 py-0.5 text-xs font-bold text-white">✓ Verified Pro</span>;
  if (tier === "BASIC_ID") return <span className="inline-flex items-center gap-1 rounded-full bg-trust-soft px-2.5 py-0.5 text-xs font-bold text-trust">ID checked</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Verification pending</span>;
}
const STATUS_STYLES: Record<JobStatus, string> = {
  OPEN: "bg-emerald-100 text-emerald-800",
  ACCEPTED: "bg-sky-100 text-sky-800",
  SCHEDULED: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-trust-soft text-trust",
  DISPUTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};
export function StatusPill({ status }: { status: JobStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[status]}`}>{status.replace(/_/g, " ")}</span>;
}
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}
