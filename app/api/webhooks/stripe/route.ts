import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/adapters";
import { db } from "@/lib/store";

// Stripe webhook — the ONLY place live payment state is confirmed (blueprint
// §1/§4.2: webhooks, never browser redirects). Signature-verified with
// STRIPE_WEBHOOK_SECRET. Every handler is idempotent: replayed events find the
// milestone/payment already in its target state and change nothing.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhooks are not configured on this deployment." }, { status: 501 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const ms =
        db().paymentMilestones.find((m) => m.paymentIntentId === pi.id) ??
        (pi.metadata?.milestoneId ? db().paymentMilestones.find((m) => m.id === pi.metadata.milestoneId) : undefined);
      if (ms && ms.status === "UNFUNDED") {
        ms.status = "HELD";
        ms.paymentIntentId = pi.id;
        const pay = db().payments.find((p) => p.milestoneId === ms.id);
        if (pay && pay.status === "REQUIRES_PAYMENT") pay.status = "HELD";
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const pay = db().payments.find((p) => p.paymentIntentId === pi.id);
      if (pay && pay.status !== "RELEASED") pay.status = "FAILED";
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : (charge.payment_intent?.id ?? null);
      if (piId) {
        const ms = db().paymentMilestones.find((m) => m.paymentIntentId === piId);
        if (ms && ms.status === "HELD") ms.status = "REFUNDED";
        const pay = db().payments.find((p) => p.paymentIntentId === piId);
        if (pay && pay.status !== "RELEASED") pay.status = "REFUNDED";
      }
      break;
    }
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const pa = db().proPayoutAccounts.find((a) => a.stripeAccountId === account.id);
      if (pa) {
        pa.payoutsEnabled = Boolean(account.payouts_enabled);
        pa.onboardingStatus = account.details_submitted ? "COMPLETE" : "PENDING";
        if (account.payouts_enabled) pa.kycStatus = "VERIFIED";
      }
      break;
    }
    default:
      break; // Unhandled event types are acknowledged so Stripe stops retrying.
  }
  return NextResponse.json({ received: true });
}
