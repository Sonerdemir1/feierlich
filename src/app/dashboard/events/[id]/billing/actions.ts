"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/checkout-fulfillment";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return { session, event };
}

// Prueft einen eingegebenen Rabattcode und liefert den rabattierten
// Endpreis — wirft nie, gibt bei Ungueltigkeit stattdessen null zurueck
// (Aufrufer entscheidet, wie er das kommuniziert).
async function applyDiscount(rawCode: string, priceCents: number): Promise<{ amountCents: number; code: string } | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { amountCents: priceCents, code: "" };

  const discount = await prisma.discountCode.findUnique({ where: { code } });
  if (!discount || !discount.active) return null;
  if (discount.expiresAt && discount.expiresAt < new Date()) return null;
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) return null;

  const amountCents =
    discount.type === "PERCENT"
      ? Math.round(priceCents * (1 - discount.value / 100))
      : Math.max(0, priceCents - discount.value);

  return { amountCents: Math.max(0, amountCents), code };
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

  const discountInput = String(formData.get("discountCode") ?? "");
  const discountResult = await applyDiscount(discountInput, pkg.priceCents);
  if (!discountResult) {
    redirect(`/dashboard/events/${eventId}/billing?error=discount-invalid`);
  }
  const { amountCents, code: appliedCode } = discountResult;

  const user = await prisma.user.findUnique({ where: { id: session.user!.id } });

  const order = existingOrder
    ? await prisma.order.update({
        where: { id: existingOrder.id },
        data: { packageId: pkg.id, amountCents, status: "PENDING", discountCode: appliedCode || null },
      })
    : await prisma.order.create({
        data: {
          userId: session.user!.id,
          packageId: pkg.id,
          eventId: event.id,
          amountCents,
          partnerId: user?.partnerId ?? null,
          discountCode: appliedCode || null,
        },
      });

  // 100%-Rabatt (z.B. Freikarten fuer Messen) — kein Stripe-Aufruf noetig,
  // direkt als bezahlt erfuellen, gleicher idempotenter Helper wie der
  // Stripe-Pfad (zaehlt den Code-Verbrauch mit).
  if (amountCents === 0) {
    await markOrderPaid(order.id, null);
    redirect(`/dashboard/events/${eventId}/billing?free=1`);
  }

  if (!stripe) {
    redirect(`/dashboard/events/${eventId}/billing?error=stripe-not-configured`);
  }

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
          unit_amount: amountCents,
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
