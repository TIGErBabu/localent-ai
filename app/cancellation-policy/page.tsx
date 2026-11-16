import Link from "next/link";
import type { Metadata } from "next";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = { title: "Cancellation Policy" };

export default async function CancellationPolicyPage() {
  return (
    <PolicyLayout
      title="Cancellation Policy"
      intro="Plans change. This policy explains what happens when a customer or a pro cancels or reschedules a Localent job — and what it costs, which depends on how much notice is given and whether any escrow milestone has been funded."
    >
      <PolicySection heading="1. The basic rule">
        <p>
          Cancellation is <strong className="text-slate-800">free when it happens more than 24 hours before the
          scheduled appointment</strong>. Inside 24 hours, the funded deposit may be partly or fully forfeited,
          because the other side has usually turned down other work and, for pros, may already have bought
          materials. Jobs that are cancelled before any milestone is funded cost nothing at all.
        </p>
      </PolicySection>

      <PolicySection heading="2. Cancelling before anything is funded">
        <p>
          If no milestone has been funded — for example, you posted a job and received bids but never accepted
          one, or you accepted a bid but have not yet funded the deposit — either side can cancel or withdraw at
          no cost. No fees are charged, because Localent earns fees only on completed transactions.
        </p>
      </PolicySection>

      <PolicySection heading="3. Cancelling more than 24 hours ahead">
        <p>
          If the deposit milestone has been funded but the appointment is still more than 24 hours away,
          cancellation is free: the funded milestone is refunded to the customer&rsquo;s original payment method
          in full, and no commission or service fee is charged on the cancelled job.
        </p>
      </PolicySection>

      <PolicySection heading="4. Cancelling inside 24 hours">
        <p>
          As the default rule, if a <strong className="text-slate-800">customer</strong> cancels inside 24 hours
          of the scheduled appointment, some or all of the funded deposit milestone (milestone 1, 30% of the bid)
          may be forfeited to the pro to cover reserved time and any materials already purchased for the job. The
          balance milestone (milestone 2, 70%) is never charged for work that has not been done, and any unfunded
          amount is simply cancelled.
        </p>
        <p>
          If a <strong className="text-slate-800">pro</strong> cancels inside 24 hours, the customer is refunded
          in full — the pro does not receive any of the deposit for a job they did not start. Repeated late
          cancellations or no-shows by a pro may lead to warnings, reduced visibility, or suspension, and are
          reflected in the pro&rsquo;s record on the platform.
        </p>
      </PolicySection>

      <PolicySection heading="5. No-shows">
        <p>
          If the pro does not arrive at the agreed time and does not contact the customer, that is treated as a
          pro cancellation: the customer is refunded in full. If the customer is not at the agreed address and
          cannot be reached, that is treated as a customer cancellation inside 24 hours, and the deposit rule in
          section 4 applies.
        </p>
      </PolicySection>

      <PolicySection heading="6. Rescheduling">
        <PolicyList
          items={[
            "Either side can propose a new time in the app or in chat; the appointment moves only when both sides agree to the new time.",
            "Rescheduling more than 24 hours before the appointment is always free, and funded milestones stay held for the new date — there is no need to cancel and rebook.",
            "Inside 24 hours, rescheduling is free if the other side agrees. If they do not agree and the job is cancelled instead, the cancellation rules above apply.",
            "A job can be rescheduled a reasonable number of times. If a job is repeatedly rescheduled, Localent may treat it as a cancellation so the held funds are not left in limbo.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="7. Work already done and change orders">
        <p>
          If part of the work has genuinely been completed before a cancellation — for example, an agreed first
          stage of a multi-visit job — the pro may request release for the completed portion, supported by
          before/after photos and the job chat. If the customer disagrees, either side can open a dispute and the
          held funds stay held until it is resolved, under our{" "}
          <Link href="/dispute-policy" className="font-semibold text-trust hover:underline">Dispute Policy</Link>.
          Amounts for agreed change orders follow the same rules as the milestone they were added to.
        </p>
      </PolicySection>

      <PolicySection heading="8. Emergencies and exceptions">
        <p>
          Genuine emergencies happen — illness, severe weather, a utility shut-off, or a family emergency. If an
          emergency forces a late cancellation, tell the other side in chat as soon as you can and contact
          Localent. We may waive a forfeiture where the circumstances are clear and both sides act in good faith.
          Waivers are discretionary and do not change the default rules above.
        </p>
      </PolicySection>

      <PolicySection heading="9. How refunds are paid">
        <p>
          Refunds are issued through Stripe to the customer&rsquo;s original payment method. Milestones that were
          funded but not released are refunded from the held escrow amount; milestones that were never funded are
          simply cancelled and never charged. Refund timing depends on your bank or card issuer after Stripe
          processes the refund. Localent&rsquo;s service fee is not charged on refunded amounts, and the
          pro&rsquo;s commission is not deducted from money that is refunded.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
