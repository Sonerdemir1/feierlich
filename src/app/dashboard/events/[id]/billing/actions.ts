"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return { session, event };
}

export async function startCheckout(eventId: string, formData: FormData) {
  const { session, event } = await requireOwnedEvent(eventId);

  const packageId = String(formData.get("packageId") ?? "");
  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.active) {
    redirect(`/dashboard/events/${eventId}/billing?error=bad-package`);
  }

  const existingOrder = await prisma.order.findUnique({ where: { eventId } });
  if (existingOrder?.status === "PAID") {
    redirect(`/dashboard/events/${eventId}/billing`);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user!.id } });

  const order = existingOrder
    ? await prisma.order.update({
        where: { id: existingOrder.id },
        data: { packageId: pkg.id, amountCents: pkg.priceCents, status: "PENDING" },
      })
    : await prisma.order.create({
        data: {
          userId: session.user!.id,
          packageId: pkg.id,
          eventId: event.id,
          amountCents: pkg.priceCents,
          partnerId: user?.partnerId ?? null,
        },
      });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: {
            name: `einladi – Paket ${pkg.name}`,
            description: `Event: ${event.title}`,
          },
          unit_amount: pkg.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { orderId: order.id, eventId: event.id },
    success_url: `${origin}/dashboard/events/${eventId}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/events/${eventId}/billing?cancelled=1`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");
  }

  redirect(checkoutSession.url);
}
