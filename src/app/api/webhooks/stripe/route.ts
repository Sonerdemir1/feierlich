import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { markEventAddOnPaid, markPrintOrderPaid } from "@/lib/checkout-fulfillment";

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

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;

    if (checkoutSession.payment_status === "paid") {
      const paymentIntentId =
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent?.id;

      // `kind` unterscheidet, welches Modell diese Checkout-Session erfuellt
      // — fehlt er (aeltere/Order-Sessions), ist "order" der Default.
      const kind = checkoutSession.metadata?.kind ?? "order";

      if (kind === "order") {
        const orderId = checkoutSession.metadata?.orderId;
        if (orderId) {
          const order = await prisma.order.findUnique({ where: { id: orderId } });
          if (order && order.status !== "PAID") {
            await prisma.$transaction([
              prisma.order.update({
                where: { id: order.id },
                data: { status: "PAID", stripePaymentIntentId: paymentIntentId ?? null },
              }),
              prisma.payment.create({
                data: {
                  orderId: order.id,
                  amountCents: order.amountCents,
                  currency: order.currency,
                  status: "SUCCEEDED",
                  stripePaymentId: paymentIntentId ?? checkoutSession.id,
                  paidAt: new Date(),
                },
              }),
            ]);
          }
        }
      } else if (kind === "eventAddOn") {
        const eventAddOnId = checkoutSession.metadata?.eventAddOnId;
        if (eventAddOnId) await markEventAddOnPaid(eventAddOnId, paymentIntentId ?? null);
      } else if (kind === "printOrder") {
        const printOrderId = checkoutSession.metadata?.printOrderId;
        if (printOrderId) await markPrintOrderPaid(printOrderId, paymentIntentId ?? null);
      }
    }
  }

  return NextResponse.json({ received: true });
}
