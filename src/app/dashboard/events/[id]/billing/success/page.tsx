import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

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
  if (!sessionId) redirect(`/dashboard/events/${id}/billing`);

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const orderId = checkoutSession.metadata?.orderId;

  // Primaerer Bestaetigungspfad: direkt nach dem Redirect von Stripe die
  // Session serverseitig verifizieren, statt nur auf den Webhook zu warten
  // (der Kunde soll seinen Status sofort sehen). Der Webhook (route.ts)
  // deckt den Fall ab, dass der Kunde den Tab vor dem Redirect schliesst.
  if (checkoutSession.payment_status === "paid" && orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order && order.eventId === id && order.status !== "PAID") {
      const paymentIntentId =
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent?.id;

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

  const order = await prisma.order.findUnique({ where: { eventId: id }, include: { package: true } });

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 12 }}>
        {order?.status === "PAID" ? "Zahlung erfolgreich" : "Zahlung wird verarbeitet"}
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 24 }}>
        {order?.status === "PAID"
          ? `Danke! Das Paket „${order.package.name}“ ist jetzt für dein Event freigeschaltet.`
          : "Falls die Zahlung gerade erst abgeschlossen wurde, lade diese Seite in ein paar Sekunden neu."}
      </p>
      <Link href={`/dashboard/events/${id}`} className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
        Zurück zum Event
      </Link>
    </div>
  );
}
