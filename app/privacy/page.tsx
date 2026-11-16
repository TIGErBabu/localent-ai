import type { Metadata } from "next";
import PolicyLayout, { PolicyList, PolicySection } from "@/components/PolicyLayout";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      intro="This policy explains what information Localent.ai collects, how it is used, and who it is shared with. Localent is built around a simple privacy idea: your exact address and contact details stay private until you have actually hired someone and funded the job."
    >
      <PolicySection heading="1. Information we collect">
        <PolicyList
          items={[
            <><strong className="text-slate-800">Account information</strong> — your name, email address, phone number, and account role (customer, pro, or admin). Pro accounts also include business details such as business name, service area, trades, and years in business.</>,
            <><strong className="text-slate-800">Job information</strong> — job descriptions, categories, budgets, photos you upload, scheduled appointment times, bids, change orders, and reviews.</>,
            <><strong className="text-slate-800">Address information</strong> — the address where work will take place. Your exact street address is stored separately from your general job location (such as neighbourhood or ZIP area).</>,
            <><strong className="text-slate-800">Payment information</strong> — payments are processed by Stripe. We receive payment status, amounts, and payout records, but we do not store your full card number on our own systems.</>,
            <><strong className="text-slate-800">Verification information</strong> — for pros, identity and background-check information handled through our verification partners, and the resulting verification tier.</>,
            <><strong className="text-slate-800">Communications and usage</strong> — in-app chat messages, completion-code records, and basic technical information such as sign-in sessions and device/browser details needed to run the site securely.</>,
          ]}
        />
      </PolicySection>

      <PolicySection heading="2. How we use your information">
        <p>We use your information to:</p>
        <PolicyList
          items={[
            "Run the marketplace — matching jobs with pros, showing bids, scheduling appointments, and managing change orders.",
            "Operate milestone escrow — taking payments, holding funds, releasing payouts, and handling refunds.",
            "Keep jobs safe — verifying pros, masking contact details until funding, reviewing disputes, and preventing fraud and platform circumvention.",
            "Communicate with you about your account and jobs, including booking confirmations, reminders, and payment or dispute updates by email and SMS.",
            "Improve the platform and meet our legal, tax, and accounting obligations.",
          ]}
        />
        <p>We do not sell your personal information.</p>
      </PolicySection>

      <PolicySection heading="3. Your address stays private until funding">
        <p>
          When you post a job, other users see only a general location — never your exact street address. Your
          exact street address is stored separately and is shown to one person only:{" "}
          <strong className="text-slate-800">
            the pro you have hired, and only after the deposit milestone (milestone 1) for that job has been
            funded
          </strong>
          . Pros who are browsing or bidding on your job cannot see it, and it is never shown publicly.
        </p>
      </PolicySection>

      <PolicySection heading="4. Chat masking until funding">
        <p>
          In-app chat is automatically screened before a job is funded: phone numbers, email addresses, and
          similar contact patterns in messages are{" "}
          <strong className="text-slate-800">masked until the deposit milestone is funded</strong>. Once the job
          is funded, the customer and the hired pro can see each other&rsquo;s contact details so they can
          coordinate on the day. Masking protects your privacy and keeps Localent jobs on the platform, where
          escrow protection applies.
        </p>
      </PolicySection>

      <PolicySection heading="5. Who we share information with">
        <p>
          We share information only as needed to run the service, with the processors who perform specific jobs
          for us:
        </p>
        <PolicyList
          items={[
            <><strong className="text-slate-800">Stripe</strong> — payment processing, escrow holding, and pro payouts through Stripe Connect. Stripe receives the payment and payout details needed for your transactions.</>,
            <><strong className="text-slate-800">Twilio</strong> — SMS delivery, such as booking confirmations, appointment reminders, and verification codes. Twilio receives the phone number and message content needed to deliver each message.</>,
            <><strong className="text-slate-800">Checkr</strong> — background checks for pros seeking or holding Verified Pro status. Checkr receives the identity details the pro provides for the check, and we receive the check outcome and verification status.</>,
            <><strong className="text-slate-800">The other party to your job</strong> — the customer and hired pro see the job details, chat, photos, and (after funding, as described above) address and contact details needed to carry out the work.</>,
            <><strong className="text-slate-800">Authorities and legal requests</strong> — where we are required by law, or where disclosure is needed to protect users from fraud or serious harm.</>,
          ]}
        />
        <p>Each processor handles your information under its own privacy policy and only for the service it provides to us.</p>
      </PolicySection>

      <PolicySection heading="6. Photos and job records">
        <p>
          Pros check in on site and share before-and-after photos as part of the job record, and customers may
          upload photos when posting a job. These photos, the chat record, and the completion-code record are
          kept as the job&rsquo;s evidence trail and may be reviewed by Localent admin if a dispute is opened.
          Please do not upload photos containing sensitive personal information that is not relevant to the job.
        </p>
      </PolicySection>

      <PolicySection heading="7. Cookies and sessions">
        <p>
          Localent uses session cookies to keep you signed in and to remember the account you are using. These
          cookies are essential to the service — the site cannot keep you logged in without them. We do not use
          third-party advertising trackers. If analytics are used, they are limited to understanding overall usage
          of the platform.
        </p>
      </PolicySection>

      <PolicySection heading="8. How long we keep information">
        <p>
          We keep account and job records for as long as your account is active and for a reasonable period
          afterwards, so that payment records, reviews, and dispute evidence remain available and we can meet tax
          and accounting requirements. Verification outcomes are retained while a pro holds the corresponding
          tier. When information is no longer needed, we delete or anonymise it.
        </p>
      </PolicySection>

      <PolicySection heading="9. Your choices">
        <PolicyList
          items={[
            "You can view and update your account details in your profile settings.",
            "You can ask us what personal information we hold about you, and ask for a copy of it.",
            "You can ask us to correct inaccurate information, or to delete your account and personal information — subject to records we must keep for legal, tax, or dispute purposes.",
            "You can opt out of non-essential messages at any time; messages needed to run a booked job (such as payment and dispute notices) will still be sent.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="10. Security">
        <p>
          Access to personal information is limited by role: customers, pros, and admins each see only what their
          role requires, and sensitive details such as exact addresses are gated behind funding status, as
          described above. No online service can guarantee perfect security, but we apply reasonable technical
          and organisational measures to protect your information and review them as the platform grows.
        </p>
      </PolicySection>

      <PolicySection heading="11. Changes to this policy">
        <p>
          We may update this policy as the platform evolves or as our processors change. The version posted on
          this page applies to jobs booked after its effective date. If a change materially expands what we
          collect or who we share it with, we will highlight it on this page before it takes effect.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
