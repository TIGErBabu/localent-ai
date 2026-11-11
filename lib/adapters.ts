// Env-gated external service adapters. In DEMO MODE (no keys configured) every
// adapter simulates its side effect and returns a clearly-labeled demo result.
// TODO(live): wire the real SDK calls behind the same interfaces when accounts exist.

export interface PaymentResult { mode: "demo" | "live"; paymentIntentId: string; note: string; }
export async function chargeToEscrow(jobId: string, amountCents: number): Promise<PaymentResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { mode: "demo", paymentIntentId: `pi_demo_${jobId.replace(/[^a-z0-9]/gi, "")}_${Date.now().toString(36)}`, note: "Simulated Stripe test charge — no real money moved. Set STRIPE_SECRET_KEY to go live." };
  }
  // TODO(live): Stripe PaymentIntent on the platform account, transfer_group = `job:${jobId}`,
  // confirmed by the /api/webhooks/stripe webhook — never by the browser redirect.
  throw new Error("Stripe live mode not yet wired — see docs/LOCALENT_BLUEPRINT_V2.md §6");
}
export async function transferToPro(stripeAccountId: string, amountCents: number): Promise<{ mode: "demo" | "live"; transferId: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { mode: "demo", transferId: `tr_demo_${stripeAccountId.replace(/[^a-z0-9]/gi, "")}_${Date.now().toString(36)}` };
  }
  // TODO(live): stripe.transfers.create({ amount: amountCents, destination: stripeAccountId })
  throw new Error("Stripe live mode not yet wired");
}
export async function refundPaymentIntent(paymentIntentId: string): Promise<{ mode: "demo" | "live" }> {
  if (!process.env.STRIPE_SECRET_KEY) return { mode: "demo" };
  // TODO(live): stripe.refunds.create({ payment_intent: paymentIntentId })
  throw new Error("Stripe live mode not yet wired");
}

export async function sendSms(phone: string, _text: string): Promise<{ mode: "demo" | "live"; delivered: boolean }> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return { mode: "demo", delivered: false }; // notification row is still created in-app
  }
  // TODO(live): Twilio messages.create — body must never contain the other party's phone number (blueprint 4.3).
  throw new Error("Twilio live mode not yet wired");
}

export async function runBackgroundCheck(proUserId: string): Promise<{ mode: "demo" | "live"; status: string }> {
  if (!process.env.CHECKR_API_KEY) return { mode: "demo", status: "IN_REVIEW" };
  // TODO(live): Checkr candidate + report creation; webhook updates backgroundCheckStatus.
  throw new Error("Checkr live mode not yet wired");
}

export function storageUrl(storageKey: string): string {
  // Demo evidence/portfolio items are placeholders keyed demo://…; live mode
  // returns a short-lived Supabase signed URL after an ownership check.
  return storageKey;
}
