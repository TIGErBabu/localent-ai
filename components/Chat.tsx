import { db } from "@/lib/store";
import { fmtDateTime } from "@/lib/utils";
import { sendMessageAction } from "@/app/actions";
import type { JobPost } from "@/lib/types";

export default function Chat({ job, viewerId, funded, back }: { job: JobPost; viewerId: string; funded: boolean; back: string }) {
  const messages = db().chatMessages.filter((m) => m.jobId === job.id).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return (
    <section className="card p-5" aria-label="Job messages">
      <h3 className="font-bold text-slate-900">Messages</h3>
      {!funded && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          🔒 Contact details stay hidden until the deposit is funded — phone numbers and emails typed here are masked automatically. This protects both sides from off-platform scams.
        </p>
      )}
      <div className="mt-4 space-y-3">
        {messages.length === 0 && <p className="text-sm text-slate-500">No messages yet. Say hello — quotes and scheduling happen right here.</p>}
        {messages.map((m) => {
          const sender = db().users.find((u) => u.id === m.senderId);
          const mine = m.senderId === viewerId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "bg-trust text-white" : "bg-slate-100 text-slate-800"}`}>
                <p className={`text-[11px] font-bold ${mine ? "text-white/70" : "text-slate-500"}`}>{mine ? "You" : sender?.name} · {fmtDateTime(m.timestamp)}</p>
                <p className="mt-0.5 whitespace-pre-wrap">{m.messageText}</p>
                {m.flagged && <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-amber-700"}`}>Some contact details were masked by Localent.</p>}
              </div>
            </div>
          );
        })}
      </div>
      <form action={sendMessageAction} className="mt-4 flex gap-2">
        <input type="hidden" name="jobId" value={job.id} />
        <input type="hidden" name="back" value={back} />
        <input name="text" required placeholder="Write a message…" className="input" aria-label="Message text" />
        <button className="btn-action shrink-0" type="submit">Send</button>
      </form>
    </section>
  );
}
