import { prisma } from "./prisma";
import { sendEmail } from "./email";

// Idempotente Erfuellung nach erfolgreicher Stripe-Zahlung — wird sowohl
// vom Webhook (src/app/api/webhooks/stripe/route.ts, greift auch wenn der
// Kunde den Tab vor dem Redirect schliesst) als auch von der Success-Seite
// (sofortiges Feedback direkt nach dem Redirect) aufgerufen. Beide Pfade
// koennen fuer dieselbe Session laufen — die Statusprüfung vor dem Update
// verhindert doppelte Verarbeitung (z.B. doppelte Benachrichtigungsmail).

export async function markEventAddOnPaid(eventAddOnId: string, paymentIntentId: string | null) {
  const row = await prisma.eventAddOn.findUnique({ where: { id: eventAddOnId } });
  if (!row || row.status === "PAID") return;

  await prisma.eventAddOn.update({
    where: { id: eventAddOnId },
    data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
  });
}

export async function markPrintOrderPaid(printOrderId: string, paymentIntentId: string | null) {
  const row = await prisma.printOrder.findUnique({
    where: { id: printOrderId },
    include: { event: true, table: true },
  });
  if (!row || row.status === "PAID") return;

  await prisma.printOrder.update({
    where: { id: printOrderId },
    data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
  });

  const notifyEmail = process.env.PRINT_ORDER_NOTIFY_EMAIL;
  if (notifyEmail) {
    await sendEmail({
      to: notifyEmail,
      subject: `Bezahlter Druckauftrag — ${row.event.title}`,
      html: `<p>Druckauftrag jetzt bezahlt:</p>
<ul>
  <li>Event: ${row.event.title} (${row.event.slug})</li>
  <li>Ziel: ${row.table ? `Tisch ${row.table.name}` : "Allgemeine Einladungsseite"}</li>
  <li>Größe: ${row.size} × ${row.quantity}</li>
  <li>Betrag: ${(row.priceCents / 100).toFixed(2)} €</li>
  <li>Versand an: ${row.shippingName}, ${row.shippingStreet}, ${row.shippingZip} ${row.shippingCity}</li>
</ul>`,
    });
  }
}
