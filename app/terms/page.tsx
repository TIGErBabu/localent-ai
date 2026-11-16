import Link from "next/link";
import type { Metadata } from "next";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Service"
      intro="These terms explain how Localent.ai works and what you agree to when you use it — whether you are posting a job, offering services, or administering the platform. We have written them in plain English."
    >
      <PolicySection heading="1. What Localent is">
        <p>
          Localent.ai is an online marketplace that connects people who need home services
          (&ldquo;customers&rdquo;) with independent local service businesses (&ldquo;pros&rdquo;). Customers post
          jobs, pros bid on them, and payment for accepted work is handled through milestone escrow so money is
          only released when the work is confirmed done.
        </p>
        <p>
          Localent is a marketplace, not a service provider. We do not perform plumbing, electrical, handyman, or
          any other trade work ourselves, and we are not a bank. The contract for the work itself is between the
          customer and the pro they hire.
        </p>
      </PolicySection>

      <PolicySection heading="2. Accounts and roles">
        <p>Every account has one of three roles:</p>
        <PolicyList
          items={[
            <><strong className="text-slate-800">Customer</strong> — posts jobs, reviews bids, funds escrow milestones, and confirms completion.</>,
            <><strong className="text-slate-800">Pro</strong> — an independent business or tradesperson who browses jobs, submits bids, and carries out the work.</>,
            <><strong className="text-slate-800">Admin</strong> — Localent staff who verify pros, review disputes, and operate the platform.</>,
          ]}
        />
        <p>
          You must be at least 18 years old to hold an account, and you must provide accurate information when you
          register. You are responsible for activity on your account and for keeping your sign-in details safe.
          Tell us promptly if you believe your account has been accessed by someone else.
        </p>
      </PolicySection>

      <PolicySection heading="3. Pros are independent businesses">
        <p>
          Pros on Localent are independent businesses, not employees, agents, or contractors of Localent. Each pro
          sets their own prices, schedule, and methods of work, and is responsible for their own taxes, insurance,
          licences, tools, and employees or helpers. A pro&rsquo;s listing on Localent does not mean Localent
          endorses the quality of their work beyond the verification steps described below.
        </p>
      </PolicySection>

      <PolicySection heading="4. Verification tiers">
        <p>Pro profiles carry one of two verification tiers, shown on their profile so you can decide who to hire:</p>
        <PolicyList
          items={[
            <><strong className="text-slate-800">Basic ID</strong> — the pro has confirmed their identity with us. Background and licence checks have not been completed for this tier.</>,
            <><strong className="text-slate-800">Verified Pro</strong> — in addition to identity confirmation, the pro has passed a background check and a review of the licence(s) for their trade, carried out through our verification partners.</>,
          ]}
        />
        <p>
          Verification is a point-in-time check based on the information available to us. It reduces risk but
          cannot guarantee a pro&rsquo;s future conduct or workmanship.
        </p>
      </PolicySection>

      <PolicySection heading="5. Jobs, bids, and accepting work">
        <p>
          A customer posts a job describing the work needed. Matched pros may submit a flat, all-in bid. Nothing is
          owed by either side until the customer accepts a bid and funds the first escrow milestone — at that
          point the job is booked on the terms of the accepted bid, including any agreed change orders added later
          through the platform.
        </p>
        <p>
          Both sides are expected to communicate through Localent chat, show up at the agreed time, and describe
          the work — and any change to it — honestly. Change orders for extra work should be agreed in the app
          before the extra work starts, so the escrow amount always matches the agreed price.
        </p>
      </PolicySection>

      <PolicySection heading="6. Fees">
        <p>Localent&rsquo;s fees are simple and are shown in full before anything is funded:</p>
        <PolicyList
          items={[
            <>Pros pay a <strong className="text-slate-800">10% commission</strong>, deducted from the pro&rsquo;s payout.</>,
            <>Customers pay a <strong className="text-slate-800">5% service fee</strong>, charged on top of the accepted bid total.</>,
            <>Localent earns fees <strong className="text-slate-800">only on completed transactions</strong>. If a job is refunded through the dispute process, the corresponding fees are not earned on the refunded amount.</>,
          ]}
        />
        <p>There are no listing fees, subscription fees, or hidden mark-ups on bids.</p>
      </PolicySection>

      <PolicySection heading="7. Payments and milestone escrow">
        <p>
          Payments run through milestone escrow powered by Stripe Connect. When a bid is accepted, the job is
          split into two milestones: <strong className="text-slate-800">milestone 1 is 30%</strong> of the bid
          (deposit and materials) and <strong className="text-slate-800">milestone 2 is 70%</strong> (the balance,
          due on completion).
        </p>
        <p>
          Funded milestone money is held on Localent&rsquo;s Stripe account — it is not paid straight to the pro.
          When a milestone is released, the held funds are transferred to the pro&rsquo;s connected Stripe account,
          minus the 10% commission. Because funds are held by our payment processor as part of this escrow flow,
          they are not a bank deposit and Localent is not acting as a bank.
        </p>
        <p>
          If the customer does not confirm completion or open a dispute within{" "}
          <strong className="text-slate-800">72 hours</strong> of the pro&rsquo;s completion request, the held
          balance auto-releases to the pro. See our{" "}
          <Link href="/dispute-policy" className="font-semibold text-trust hover:underline">Dispute Policy</Link>{" "}
          and{" "}
          <Link href="/cancellation-policy" className="font-semibold text-trust hover:underline">Cancellation Policy</Link>{" "}
          for how holds, refunds, and cancellations work.
        </p>
      </PolicySection>

      <PolicySection heading="8. Completion code and confirmation">
        <p>
          When the deposit milestone is funded, the customer is issued a{" "}
          <strong className="text-slate-800">6-digit completion code</strong>. The pro must obtain this code from
          the customer on site in order to request completion. Only share your code when you are satisfied the
          work covered by the job is done — sharing it tells Localent the job can move to release. If you are not
          satisfied, do not share the code; instead, talk to the pro in chat or open a dispute while the funds are
          still held.
        </p>
      </PolicySection>

      <PolicySection heading="9. No circumventing the platform">
        <p>
          If a job starts on Localent, it must be paid for through Localent. You agree not to move a Localent job
          off-platform — for example by exchanging contact details to arrange direct payment — in order to avoid
          the platform&rsquo;s fees. Contact details are masked until escrow is funded partly for this reason.
          Accounts that repeatedly circumvent the platform may be suspended, and fees that would have been payable
          on a circumvented job may still be charged.
        </p>
      </PolicySection>

      <PolicySection heading="10. Reviews">
        <p>
          Reviews can only be left for completed jobs, by the customer and pro who took part in that job. Reviews
          must be honest and based on your own experience. We may remove reviews that are abusive, discriminatory,
          or clearly unrelated to the job, but we do not edit the substance of genuine reviews.
        </p>
      </PolicySection>

      <PolicySection heading="11. Acceptable use">
        <p>You agree not to:</p>
        <PolicyList
          items={[
            "Post false, misleading, or fraudulent jobs, bids, profiles, or reviews.",
            "Use Localent for any unlawful work, or ask a pro to carry out work that requires a licence you know they do not hold.",
            "Harass, threaten, or discriminate against another user.",
            "Attempt to access another user's account, scrape the platform, or interfere with its operation.",
            "Share another user's private contact details outside the platform without their consent.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="12. Suspension and account closure">
        <p>
          We may warn, suspend, or close accounts that break these terms, repeatedly cancel or fail to show up,
          are the subject of substantiated safety complaints, or misuse the payment or dispute systems. You may
          close your account at any time, but jobs already booked — and any escrow, cancellation, or dispute rules
          attached to them — continue to apply until they are finished.
        </p>
      </PolicySection>

      <PolicySection heading="13. Liability and the limits of our role">
        <p>
          Because Localent is a marketplace, the customer and the pro are responsible for the work itself: its
          quality, safety, legality, and any damage or injury arising from it. Localent is responsible for
          operating the marketplace — listings, matching, escrow handling, and dispute review — with reasonable
          care.
        </p>
        <p>
          To the extent permitted by law, Localent&rsquo;s total liability arising from a job is limited to the
          fees Localent earned on that job, and Localent is not liable for indirect or consequential losses such
          as lost income or the cost of alternative arrangements. Nothing in these terms limits liability that
          cannot be limited by law. Escrow funds held for a job are held for that job&rsquo;s parties and are
          released or refunded only under these terms and our dispute and cancellation policies.
        </p>
      </PolicySection>

      <PolicySection heading="14. Changes to these terms">
        <p>
          We may update these terms as the platform evolves. The version posted on this page applies to jobs
          booked after its effective date; jobs already booked continue under the version in force when they were
          booked. If a change materially affects fees or escrow, we will highlight it on this page before it takes
          effect for new bookings.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
