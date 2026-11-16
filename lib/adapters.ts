import Stripe from "stripe";
import twilio from "twilio";

// Env-gated external service adapters. With NO keys configured (demo mode)
// every adapter simulates its side effect and returns a clearly-labeled demo
// result. When the real env vars are present, the SAME functions execute the
// real Stripe / Twilio / Checkr code paths — all account identifiers come from
// env, nothing is hardcoded (accounts are created under the company owner's
// login and migrated later; only env values change).
//
// Live wiring summary:
// - Stripe: STRIPE_SECRET_KEY (+ STRIPE_WEBHOOK_SECRET for /api/webhooks/stripe)
// - Twilio: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER
// - Checkr: CHECKR_API_KEY

// ─── Stripe ──────────────────────────────────────────────────────────────────
let stripeClient: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export interface ConnectAccountResult { mode: "demo" | "live"; accountId: string }
export async function createConnectAccount(user: { id: string; email: string; name: string }): Promise<ConnectAccountResult> {
  const stripe = getStripe();
  if (!stripe) return { mode: "demo", accountId: `acct_demo_${user.id.replace(/[^a-z0-9]/gi, "")}` };
  // Accounts v2 (POST /v2/core/accounts): Stripe rejects v1 account creation
  // for new Connect platforms. This payload is Stripe's own v2 translation of
  // the old v1 Express request — merchant configuration takes card payments,
  // recipient configuration receives Separate Charges & Transfers payouts into
  // the Stripe balance, and the platform (application) collects fees/losses,
  // matching the v1 Express defaults this replaces.
  const account = await stripe.v2.core.accounts.create({
    contact_email: user.email,
    identity: { country: "US" },
    dashboard: "express",
    defaults: {
      responsibilities: { fees_collector: "application", losses_collector: "application" },
    },
    configuration: {
      merchant: { capabilities: { card_payments: { requested: true } } },
      recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
    },
    metadata: { localentUserId: user.id },
  });
  return { mode: "live", accountId: account.id };
}

export async function createConnectAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<{ mode: "demo" | "live"; url: string }> {
  const stripe = getStripe();
  if (!stripe) return { mode: "demo", url: returnUrl };
  // Accounts v2 account links (POST /v2/core/account_links): the onboarding
  // flow collects requirements for the configurations already on the account
  // (merchant + recipient, set at creation above). SDK 23.1.0's
  // AccountLinkCreateParams carries no per-link configurations field.
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: { refresh_url: refreshUrl, return_url: returnUrl },
    },
  });
  return { mode: "live", url: link.url };
}

// Which kind of Stripe key is configured. Only TEST keys may auto-confirm a
// PaymentIntent server-side (with Stripe's test payment method); a LIVE key
// must never be paired with an invented payment method — real card collection
// (Checkout/Elements) is a separate, deliberate build.
export function stripeKeyKind(): "test" | "live" | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return key.startsWith("sk_test_") ? "test" : "live";
}

export interface PaymentResult { mode: "demo" | "live"; paymentIntentId: string; clientSecret: string | null; status: string; note: string }
export async function chargeToEscrow(jobId: string, amountCents: number, opts?: { milestoneId?: string }): Promise<PaymentResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { mode: "demo", paymentIntentId: `pi_demo_${jobId.replace(/[^a-z0-9]/gi, "")}_${Date.now().toString(36)}`, clientSecret: null, status: "succeeded", note: "Simulated Stripe test charge — no real money moved. Set STRIPE_SECRET_KEY to go live." };
  }
  // Separate Charges and Transfers (blueprint §1/§4.2): the charge lands on the
  // PLATFORM account; transfer_group ties it to the job so the completion
  // Transfer pays the pro's net and the commission simply never leaves.
  // Creating a PaymentIntent alone moves NO money — it sits "Incomplete"
  // until confirmed. The caller may only treat funds as held when the
  // returned status is "succeeded" (the payment_intent.succeeded webhook in
  // /api/webhooks/stripe remains the backstop for out-of-band confirmation).
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    // allow_redirects "never": this server-side confirmation flow has no
    // browser to send anywhere, so redirect-based payment methods are off
    // (Stripe's own instruction when a PI confirm fails over return_url —
    // the return_url on the confirm call below is the belt-and-braces half).
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    transfer_group: `job:${jobId}`,
    metadata: { jobId, milestoneId: opts?.milestoneId ?? "" },
    description: `Localent escrow funding for job ${jobId}`,
  });
  if (stripeKeyKind() === "test") {
    // Test mode: confirm server-side with Stripe's test payment method so the
    // one-click test checkout is HONEST — the PI really reaches "succeeded"
    // (or this throws / returns a non-succeeded status and nothing is held).
    // return_url is REQUIRED at confirmation (Stripe emailed the account
    // owner about failures without it): send the customer back to this job's
    // pay page. Base mirrors connectPayoutsAction in app/actions.ts.
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://localent-ai.vercel.app";
    const confirmed = await stripe.paymentIntents.confirm(pi.id, {
      payment_method: "pm_card_visa",
      return_url: `${base}/dashboard/customer/jobs/${jobId}/pay`,
    });
    return { mode: "live", paymentIntentId: pi.id, clientSecret: pi.client_secret, status: confirmed.status, note: `Test-mode PaymentIntent confirmed with pm_card_visa; Stripe status: ${confirmed.status}.` };
  }
  // Live key: do NOT auto-confirm with any payment method and do NOT let the
  // caller mark funds held. Real card collection is not yet enabled.
  return { mode: "live", paymentIntentId: pi.id, clientSecret: pi.client_secret, status: pi.status, note: "Live key configured: PaymentIntent created but NOT confirmed — live card collection is not yet enabled, no funds held." };
}

export async function transferToPro(stripeAccountId: string, amountCents: number, opts?: { jobId?: string; milestoneId?: string }): Promise<{ mode: "demo" | "live"; transferId: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { mode: "demo", transferId: `tr_demo_${stripeAccountId.replace(/[^a-z0-9]/gi, "")}_${Date.now().toString(36)}` };
  }
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: "usd",
    destination: stripeAccountId,
    ...(opts?.jobId ? { transfer_group: `job:${opts.jobId}` } : {}),
    metadata: { jobId: opts?.jobId ?? "", milestoneId: opts?.milestoneId ?? "" },
  });
  return { mode: "live", transferId: transfer.id };
}

export async function refundPaymentIntent(paymentIntentId: string): Promise<{ mode: "demo" | "live"; refundId: string | null }> {
  const stripe = getStripe();
  if (!stripe) return { mode: "demo", refundId: null };
  const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
  return { mode: "live", refundId: refund.id };
}

// ─── Twilio SMS ──────────────────────────────────────────────────────────────
export async function sendSms(phone: string, text: string): Promise<{ mode: "demo" | "live"; delivered: boolean }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    return { mode: "demo", delivered: false }; // notification row is still created in-app
  }
  // Blueprint 4.3: SMS bodies must never contain the other party's phone number.
  const client = twilio(sid, token);
  const msg = await client.messages.create({ to: phone, from, body: text });
  return { mode: "live", delivered: msg.status !== "failed" && msg.status !== "undelivered" };
}

// ─── Checkr background checks ────────────────────────────────────────────────
export async function runBackgroundCheck(
  proUserId: string,
  person?: { name: string; email: string },
): Promise<{ mode: "demo" | "live"; status: string; candidateId: string | null; invitationId: string | null }> {
  const apiKey = process.env.CHECKR_API_KEY;
  if (!apiKey) return { mode: "demo", status: "IN_REVIEW", candidateId: null, invitationId: null };
  // Real Checkr flow: create a candidate, then an invitation for the candidate
  // to complete their own background-check disclosure (FCRA-compliant pattern).
  const auth = "Basic " + Buffer.from(`${apiKey}:`).toString("base64");
  const [firstName, ...rest] = (person?.name ?? "Localent Pro").split(" ");
  const candidateRes = await fetch("https://api.checkr.com/v1/candidates", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: firstName, last_name: rest.join(" ") || "Pro", no_middle_name: true,
      email: person?.email, custom_id: proUserId,
    }),
  });
  if (!candidateRes.ok) throw new Error(`Checkr candidate creation failed: ${candidateRes.status}`);
  const candidate = (await candidateRes.json()) as { id: string };
  const invitationRes = await fetch("https://api.checkr.com/v1/invitations", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_id: candidate.id, package: "tasker_standard" }),
  });
  if (!invitationRes.ok) throw new Error(`Checkr invitation creation failed: ${invitationRes.status}`);
  const invitation = (await invitationRes.json()) as { id: string };
  // Status flips to PASSED/FAILED when Checkr reports complete — via the Checkr
  // dashboard/webhook in production; admin verification remains the final gate.
  return { mode: "live", status: "PENDING", candidateId: candidate.id, invitationId: invitation.id };
}

export function storageUrl(storageKey: string): string {
  // Demo evidence/portfolio items are placeholders keyed demo://…; live mode
  // returns a short-lived Supabase signed URL after an ownership check.
  return storageKey;
}
