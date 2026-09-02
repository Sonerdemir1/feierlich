import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { markOrderPaid, markEventAddOnPaid, markPrintOrderPaid } from "@/lib/checkout-fulfillment";

export default async function BillingSuccessPage({
  params,
  searchParams,
}: PageProps<"/dashboard/events/[id]/billing/success">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) notFound();

  const sessionId = typeof sp.session_id === "string" ? sp.session_id : undefined;
  if (!sessionId || !stripe) redirect(`/dashboard/events/${id}/billing`);

  const kind = typeof sp.kind === "string" ? sp.kind : "order";
  const backHref =
    sp.return === "seating" ? `/dashboard/events/${id}/seating` : `/dashboard/events/${id}`;
  const backLabel = sp.return === "seating" ? "Zurück zum Sitzplan" : "Zurück zum Event";

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = checkoutSession.payment_status === "paid";

  // Primaerer Bestaetigungspfad: direkt nach dem Redirect von Stripe die
  // Session serverseitig verifizieren, statt nur auf den Webhook zu warten
  // (der Kunde soll seinen Status sofort sehen). Der Webhook (route.ts)
  // deckt den Fall ab, dass der Kunde den Tab vor dem Redirect schliesst —
  // beide Pfade rufen dieselben idempotenten Erfuellungs-Helfer auf.
  if (paid && kind === "eventAddOn") {
    const eventAddOnId = checkoutSession.metadata?.eventAddOnId;
    if (eventAddOnId) {
      const paymentIntentId =
        typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : (checkoutSession.payment_intent?.id ?? null);
      await markEventAddOnPaid(eventAddOnId, paymentIntentId);
    }
  } else if (paid && kind === "printOrder") {
    const printOrderId = checkoutSession.metadata?.printOrderId;
    if (printOrderId) {
      const paymentIntentId =
        typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : (checkoutSession.payment_intent?.id ?? null);
      await markPrintOrderPaid(printOrderId, paymentIntentId);
    }
  } else if (paid && kind === "order") {
    const orderId = checkoutSession.metadata?.orderId;
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order && order.eventId === id) {
        const paymentIntentId =
          typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : (checkoutSession.payment_intent?.id ?? null);
        await markOrderPaid(order.id, paymentIntentId);
      }
    }
  }

  let heading = "Zahlung wird verarbeitet";
  let message = "Falls die Zahlung gerade erst abgeschlossen wurde, lade diese Seite in ein paar Sekunden neu.";

  if (paid && kind === "eventAddOn") {
    heading = "Zahlung erfolgreich";
    message = "Danke! Das Zusatzpaket ist jetzt für dein Event freigeschaltet.";
  } else if (paid && kind === "printOrder") {
    heading = "Zahlung erfolgreich";
    message = "Danke! Euer Druckauftrag ist bezahlt — wir drucken und verschicken die Karten.";
  } else if (paid && kind === "order") {
    const order = await prisma.order.findUnique({ where: { eventId: id }, include: { package: true } });
    if (order?.status === "PAID") {
      heading = "Zahlung erfolgreich";
      message = `Danke! Das Paket „${order.package.name}“ ist jetzt für dein Event freigeschaltet.`;
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 12 }}>
        {heading}
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 24 }}>{message}</p>
      <Link href={backHref} className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
        {backLabel}
      </Link>
    </div>
  );
}
