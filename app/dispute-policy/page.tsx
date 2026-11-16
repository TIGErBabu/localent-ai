import type { Metadata } from "next";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = { title: "Dispute Policy" };

export default async function DisputePolicyPage() {
  return (
    <PolicyLayout
      title="Dispute Policy"
      intro="If a job goes wrong — the work is not finished, is not up to the agreed standard, or the two sides disagree about payment — either the customer or the pro can open a dispute. While a dispute is open, the held escrow funds stay held: nobody gets paid until Localent has reviewed the job."
    >
      <PolicySection heading="1. When you can open a dispute">
        <p>
          Either party to a job — the customer or the hired pro — may open a dispute{" "}
          <strong className="text-slate-800">while funds for that job are still held in escrow</strong>. Common
          reasons include:
        </p>
        <PolicyList
          items={[
            "The work was not completed, or was completed to a standard materially different from what was agreed.",
            "The pro did not show up, or the customer was not available at the agreed time and address.",
            "The amount requested does not match the accepted bid or an agreed change order.",
            "The customer has not confirmed completion and the pro believes the work is done.",
            "Damage to the property is alleged to have happened during the job.",
          ]}
        />
        <p>
          Disputes are for jobs booked and paid through Localent. We cannot review or act on payments made outside
          the platform.
        </p>
      </PolicySection>

      <PolicySection heading="2. Opening a dispute freezes release">
        <p>
          Opening a dispute <strong className="text-slate-800">freezes the release of the held funds</strong> for
          that job. The money is not transferred to the pro and is not refunded to the customer while the dispute
          is open — including funds that would otherwise have auto-released. The freeze lasts until an admin
          resolves the dispute.
        </p>
      </PolicySection>

      <PolicySection heading="3. The 72-hour window and auto-release">
        <p>
          When a pro requests completion, the customer has{" "}
          <strong className="text-slate-800">72 hours</strong> to confirm completion or open a dispute. If the
          customer does neither within 72 hours, the held balance auto-releases to the pro. Opening a dispute
          within that window stops the auto-release, so if something is wrong, open the dispute in time rather
          than waiting. Once funds have been released and paid out, they can no longer be frozen through this
          process.
        </p>
      </PolicySection>

      <PolicySection heading="4. How to open a dispute">
        <p>
          Open the dispute from the job page in your Localent account. State what went wrong and what outcome you
          are asking for — release of the funds, a refund, or completion of specific outstanding work. Opening a
          dispute is free, and you should keep communicating politely in the job chat; many disputes are resolved
          by the two sides once payment is safely frozen.
        </p>
      </PolicySection>

      <PolicySection heading="5. The evidence we review">
        <p>
          Localent admin resolves disputes on the job&rsquo;s own record. The evidence standard is the trail the
          platform keeps for every job:
        </p>
        <PolicyList
          items={[
            <><strong className="text-slate-800">Before-and-after photos</strong> — the pro&rsquo;s on-site check-in and the before/after photos shared for the job, plus any photos the customer uploaded.</>,
            <><strong className="text-slate-800">The in-app chat record</strong> — what was agreed, including the accepted bid, any change orders, scheduling messages, and what each side said when the problem arose.</>,
            <><strong className="text-slate-800">The completion-code record</strong> — whether and when the customer&rsquo;s 6-digit completion code was provided to the pro, which indicates the customer accepted the work on site.</>,
          ]}
        />
        <p>
          Agreements made outside the app — by phone, text, or in person — are much harder to verify, which is why
          we ask both sides to keep job communication in Localent chat.
        </p>
      </PolicySection>

      <PolicySection heading="6. Providing your evidence">
        <p>
          Both parties agree to provide their evidence and respond to admin questions{" "}
          <strong className="text-slate-800">within a reasonable window</strong> after a dispute is opened — we
          will tell you the deadline when we contact you, and we may proceed on the evidence available if a party
          does not respond in time. Upload photos through the job page and keep your explanation factual and
          specific: what was agreed, what happened, and when.
        </p>
      </PolicySection>

      <PolicySection heading="7. How disputes are resolved">
        <p>
          An admin reviews the evidence and resolves the dispute in one of two ways for the held funds:
        </p>
        <PolicyList
          items={[
            <><strong className="text-slate-800">Release to the pro</strong> — the held funds are transferred to the pro (minus the standard 10% commission), where the record shows the work was done as agreed.</>,
            <><strong className="text-slate-800">Refund to the customer</strong> — the held funds are returned to the customer&rsquo;s original payment method through Stripe, where the record shows the work was not done or not done as agreed. Localent does not earn its service fee or commission on refunded amounts.</>,
          ]}
        />
        <p>
          Where a job has more than one milestone, a resolution can release one milestone and refund another if
          the evidence supports it — for example, releasing the deposit for materials genuinely supplied while
          refunding the balance for work not completed. The resolution, and the reasons for it, are recorded on
          the job and shared with both parties. Admin resolutions under this policy are final within the platform.
        </p>
      </PolicySection>

      <PolicySection heading="8. After a resolution">
        <p>
          Released funds are transferred to the pro&rsquo;s connected Stripe account, and refunds are issued to
          the customer&rsquo;s original payment method; bank and card processing times then apply. Both parties
          may still leave an honest review of the completed job. Repeated disputes, or disputes involving
          dishonest evidence, may affect an account&rsquo;s standing and can lead to suspension.
        </p>
      </PolicySection>

      <PolicySection heading="9. Talk first, where you can">
        <p>
          A dispute freezes payment — it does not fix a job. If a quick conversation or a return visit can put the
          work right, we encourage both sides to try that first, and to record whatever you agree in the job chat
          so it becomes part of the job record. If you cannot agree, the dispute process above is there to make
          sure the held money follows the evidence.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
