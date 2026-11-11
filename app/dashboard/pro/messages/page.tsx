import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/store";
import { fmtDateTime } from "@/lib/utils";
import { StatusPill, Empty } from "@/components/ui";
import { ProNav } from "@/components/DashNav";

export default async function ProMessagesPage() {
  const user = await requireRole("PRO");
  const jobIds = [...new Set(db().bids.filter((b) => b.proId === user.id).map((b) => b.jobId))];
  const threads = jobIds.map((jid) => {
    const job = db().jobPosts.find((j) => j.id === jid)!;
    const msgs = db().chatMessages.filter((m) => m.jobId === jid).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return { job, last: msgs[msgs.length - 1], count: msgs.length };
  }).sort((a, b) => (b.last?.timestamp ?? "").localeCompare(a.last?.timestamp ?? ""));
  const notes = db().notifications.filter((x) => x.userId === user.id).slice().reverse();
  return (
    <div>
      <ProNav active="messages" />
      <h1 className="text-2xl font-extrabold text-slate-900">Messages</h1>
      <div className="mt-4 space-y-3">
        {threads.length === 0 && <Empty title="No conversations yet" body="Bid on a lead and your thread with that customer will appear here." />}
        {threads.map(({ job, last, count }) => (
          <Link key={job.id} href={`/dashboard/pro/jobs/${job.id}`} className="card flex items-center justify-between gap-3 p-4 transition hover:border-trust">
            <div>
              <p className="font-bold text-slate-900">{job.title}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{last ? last.messageText : "No messages yet — open the job to introduce yourself."}</p>
            </div>
            <div className="shrink-0 text-right"><StatusPill status={job.status} /><p className="mt-1 text-xs text-slate-400">{count} message{count === 1 ? "" : "s"}{last ? ` · ${fmtDateTime(last.timestamp)}` : ""}</p></div>
          </Link>
        ))}
      </div>
      {notes.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-bold text-slate-900">Notifications</h2>
          <ul className="card mt-3 divide-y divide-slate-100">{notes.map((x) => <li key={x.id} className="flex justify-between gap-3 px-5 py-3 text-sm text-slate-600"><span>{x.text}</span><span className="shrink-0 text-xs text-slate-400">{fmtDateTime(x.createdAt)}</span></li>)}</ul>
        </>
      )}
    </div>
  );
}
