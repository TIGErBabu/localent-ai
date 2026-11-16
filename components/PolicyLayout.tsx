import type { ReactNode } from "react";

export const POLICY_EFFECTIVE_DATE = "November 16, 2026";

export const POLICY_UPDATE_NOTE =
  "These policies may be updated from time to time; the version posted here applies to jobs booked after its effective date.";

export function PolicySection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">{heading}</h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function PolicyList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PolicyLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <article className="card p-6 md:p-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{intro}</p>
        <p className="mt-3 text-sm text-slate-500">
          Effective date: <span className="font-semibold text-slate-700">{POLICY_EFFECTIVE_DATE}</span>
        </p>
        <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">{POLICY_UPDATE_NOTE}</p>
        <div className="mt-2">{children}</div>
      </article>
    </div>
  );
}
