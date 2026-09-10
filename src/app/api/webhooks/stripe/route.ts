import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  markOrderPaid,
  markEventAddOnPaid,
  markPrintOrderPaid,
  markWeddingPortraitDownloadPaid,
  markOrderFailed,
  markEventAddOnFailed,
  markPrintOrderFailed,
  markWeddingPortraitDownloadFailed,
} from "@/lib/checkout-fulfillment";

// Verarbeitet eine erfuellte Checkout-Session anhand ihres `kind`-Metadatums
// — gemeinsam genutzt vom sofortigen Erfolgsfall (checkout.session.completed
// mit payment_status "paid") und vom verzoegerten Erfolgsfall einer
// asynchronen Zahlungsmethode (checkout.session.async_payment_succeeded,
// siehe POST() unten).
async function fulfillCheckoutSession(checkoutSession: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : (checkoutSession.payment_intent?.id ?? null);
  const kind = checkoutSession.metadata?.kind ?? "order";

  if (kind === "order") {
    const orderId = checkoutSession.metadata?.orderId;
    if (orderId) await markOrderPaid(orderId, paymentIntentId);
  } else if (kind === "eventAddOn") {
    const eventAddOnId = checkoutSession.metadata?.eventAddOnId;
    if (eventAddOnId) await markEventAddOnPaid(eventAddOnId, paymentIntentId);
  } else if (kind === "printOrder") {
    const printOrderId = checkoutSession.metadata?.printOrderId;
    if (printOrderId) await markPrintOrderPaid(printOrderId, paymentIntentId);
  } else if (kind === "weddingPortraitDownload") {
    const downloadId = checkoutSession.metadata?.downloadId;
    if (downloadId) await markWeddingPortraitDownloadPaid(downloadId, paymentIntentId);
  }
}

// Gegenstueck fuer eine asynchrone Zahlungsmethode, die NICHT erfolgreich
// abgeschlossen wurde (checkout.session.async_payment_failed).
async function failCheckoutSession(checkoutSession: Stripe.Checkout.Session) {
  const kind = checkoutSession.metadata?.kind ?? "order";

  if (kind === "order") {
    const orderId = checkoutSession.metadata?.orderId;
    if (orderId) await markOrderFailed(orderId);
  } else if (kind === "eventAddOn") {
    const eventAddOnId = checkoutSession.metadata?.eventAddOnId;
    if (eventAddOnId) await markEventAddOnFailed(eventAddOnId);
  } else if (kind === "printOrder") {
    const printOrderId = checkoutSession.metadata?.printOrderId;
    if (printOrderId) await markPrintOrderFailed(printOrderId);
  } else if (kind === "weddingPortraitDownload") {
    const downloadId = checkoutSession.metadata?.downloadId;
    if (downloadId) await markWeddingPortraitDownloadFailed(downloadId);
  }
}

// Zweiter, robusterer Bestaetigungspfad neben der Success-Seite: greift auch
// dann, wenn der Kunde den Tab schliesst, bevor Stripe zurueck-redirected.
// Erfordert einen konfigurierten Webhook-Endpunkt (Dashboard oder
// `stripe listen`) und STRIPE_WEBHOOK_SECRET in der Umgebung.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !stripe) {
    return NextResponse.json({ error: "Webhook nicht konfiguriert." }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Fehlende Signatur." }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  // Seit der Umstellung von payment_method_types: ["card"] auf automatisch
  // von Stripe gewaehlte Zahlungsmethoden kann eine Checkout-Session auch
  // per asynchroner Methode (SEPA-Lastschrift, Klarna, ...) abgeschlossen
  // werden — dort ist die Zahlung beim checkout.session.completed-Event noch
  // NICHT abgerechnet (payment_status "unpaid"/"no_payment_required" ist
  // hier nicht "paid"), das eigentliche Ergebnis kommt verzoegert per
  // eigenem Event nach. Drei Faelle statt vorher einem:
  //   1. checkout.session.completed + payment_status "paid" — sofortiger
  //      Erfolg (Kreditkarte & Co.), wie bisher.
  //   2. checkout.session.async_payment_succeeded — verzoegerter Erfolg
  //      einer asynchronen Methode.
  //   3. checkout.session.async_payment_failed — die asynchrone Methode ist
  //      NICHT durchgegangen (z.B. Lastschrift geplatzt); ohne diesen Fall
  //      bliebe die Bestellung fuer immer faelschlich auf PENDING stehen.
  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    if (checkoutSession.payment_status === "paid") {
      await fulfillCheckoutSession(checkoutSession);
    }
  } else if (event.type === "checkout.session.async_payment_succeeded") {
    await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
  } else if (event.type === "checkout.session.async_payment_failed") {
    await failCheckoutSession(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}
