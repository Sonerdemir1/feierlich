import { prisma } from "./prisma";
import { sendEmail } from "./email";

// Idempotente Erfuellung nach erfolgreicher Stripe-Zahlung — wird sowohl
// vom Webhook (src/app/api/webhooks/stripe/route.ts, greift auch wenn der
// Kunde den Tab vor dem Redirect schliesst) als auch von der Success-Seite
// (sofortiges Feedback direkt nach dem Redirect) aufgerufen. Beide Pfade
// koennen fuer dieselbe Session laufen — die Statusprüfung vor dem Update
// verhindert doppelte Verarbeitung (z.B. doppelte Benachrichtigungsmail).

// Vorher inline dupliziert in Webhook UND Success-Seite — jetzt an einer
// Stelle, damit die Rabattcode-Verbrauchszaehlung nicht zweimal gepflegt
// werden muss.
export async function markOrderPaid(orderId: string, paymentIntentId: string | null) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === "PAID") return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
    });
    await tx.payment.create({
      data: {
        orderId: order.id,
        amountCents: order.amountCents,
        currency: order.currency,
        status: "SUCCEEDED",
        stripePaymentId: paymentIntentId ?? `manual-${order.id}`,
        paidAt: new Date(),
      },
    });
    if (order.discountCode) {
      await tx.discountCode.updateMany({
        where: { code: order.discountCode },
        data: { usedCount: { increment: 1 } },
      });
    }
  });
}

export async function markEventAddOnPaid(eventAddOnId: string, paymentIntentId: string | null) {
  const row = await prisma.eventAddOn.findUnique({ where: { id: eventAddOnId } });
  if (!row || row.status === "PAID") return;

  await prisma.eventAddOn.update({
    where: { id: eventAddOnId },
    data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
  });
}

export async function markWeddingPortraitDownloadPaid(downloadId: string, paymentIntentId: string | null) {
  const row = await prisma.weddingPortraitDownload.findUnique({ where: { id: downloadId } });
  if (!row || row.status === "PAID") return;

  await prisma.weddingPortraitDownload.update({
    where: { id: downloadId },
    data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
  });
}

// Gegenstueck zu den vier markXPaid()-Funktionen fuer den Fall, dass eine
// asynchrone Zahlungsmethode (SEPA-Lastschrift, Klarna, ...) NICHT
// erfolgreich abgeschlossen wird — Stripe meldet das per eigenem Event
// (checkout.session.async_payment_failed, siehe webhooks/stripe/route.ts),
// getrennt vom sofortigen Erfolgsfall. Ohne diese Funktion bliebe die
// Bestellung fuer immer auf PENDING stehen, obwohl die Zahlung nachweislich
// gescheitert ist. Setzt NUR von PENDING aus (nie ein bereits bezahltes
// oder anderweitig veraendertes Feld ueberschreiben) — der Kunde kann danach
// einfach erneut zur Kasse gehen (startCheckout()/startAddOnCheckout()/...
// legen die Zeile bei Bedarf ohnehin neu an bzw. aktualisieren sie).
export async function markOrderFailed(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") return;
  await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
}

export async function markEventAddOnFailed(eventAddOnId: string) {
  const row = await prisma.eventAddOn.findUnique({ where: { id: eventAddOnId } });
  if (!row || row.status !== "PENDING") return;
  await prisma.eventAddOn.update({ where: { id: eventAddOnId }, data: { status: "CANCELLED" } });
}

export async function markWeddingPortraitDownloadFailed(downloadId: string) {
  const row = await prisma.weddingPortraitDownload.findUnique({ where: { id: downloadId } });
  if (!row || row.status !== "PENDING") return;
  await prisma.weddingPortraitDownload.update({ where: { id: downloadId }, data: { status: "CANCELLED" } });
}

export async function markPrintOrderFailed(printOrderId: string) {
  const row = await prisma.printOrder.findUnique({ where: { id: printOrderId } });
  if (!row || row.status !== "PENDING") return;
  await prisma.printOrder.update({ where: { id: printOrderId }, data: { status: "CANCELLED" } });
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
