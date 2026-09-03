"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildQrDesignSvg, printOrderPriceCents, type PrintSize, type QrTheme } from "@/lib/qr-design";
import { safeQrColorsFromEvent } from "@/lib/qr";
import { stripe } from "@/lib/stripe";
import { markPrintOrderPaid } from "@/lib/checkout-fulfillment";
import type { QrTheme as DbQrTheme } from "@/generated/prisma/client";

// Zwei Schreibweisen fuer dieselbe Sache: qr-design.ts nutzt lesbare
// Bindestrich-Werte (fuer <select>-Optionen), die DB einen Prisma-Enum
// (SCREAMING_CASE-Konvention wie die uebrigen Enums im Schema).
const DB_THEME: Record<QrTheme, DbQrTheme> = { classic: "CLASSIC", "modern-block": "MODERN_BLOCK", "gold-frame": "GOLD_FRAME" };

function themeFromForm(formData: FormData): QrTheme {
  const raw = String(formData.get("theme") ?? "classic");
  return raw === "modern-block" || raw === "gold-frame" ? raw : "classic";
}

function sizeFromForm(formData: FormData): PrintSize {
  const raw = String(formData.get("size") ?? "A6");
  return raw === "A5" || raw === "A4" ? raw : "A6";
}

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { template: true } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return { event, session };
}

type Target = { kind: "EVENT_PAGE" | "RSVP" } | { kind: "TABLE"; tableId: string };

function targetFromForm(formData: FormData): Target {
  const tableId = String(formData.get("tableId") ?? "").trim();
  if (tableId) return { kind: "TABLE", tableId };
  return { kind: String(formData.get("qrType") ?? "EVENT_PAGE") === "RSVP" ? "RSVP" : "EVENT_PAGE" };
}

// `title` landet im Namens-Kaestchen unten auf der Karte — soll immer die
// eigentlichen Namen zeigen (Paar/Firma/Geburtstagskind, = Event.title),
// nicht ein generisches Wort wie "Einladung". Der Tisch-Bezug bei
// Tisch-QR-Codes steht stattdessen mit im Untertitel.
async function resolveTarget(eventId: string, slug: string, eventTitle: string, target: Target) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (target.kind === "TABLE") {
    const table = await prisma.table.findFirst({ where: { id: target.tableId, eventId } });
    if (!table) throw new Error("Tisch nicht gefunden.");
    return {
      targetUrl: `${baseUrl}/e/${slug}?tisch=${table.id}#galerie`,
      title: eventTitle,
      subtitle: `${table.name} · Fotos & Videos teilen`,
    };
  }

  const path = target.kind === "RSVP" ? `/e/${slug}#rsvp` : `/e/${slug}`;
  return {
    targetUrl: `${baseUrl}${path}`,
    title: eventTitle,
    subtitle: target.kind === "RSVP" ? "Sagt uns Bescheid" : "Scannt für alle Infos",
  };
}

// Erzeugt die druckfertige QR-Design-SVG (A6/A5) und schickt sie als Anhang
// an die E-Mail-Adresse des eingeloggten Nutzers — automatisch, sobald
// diese Action aufgerufen wird (kein separater "jetzt senden"-Zwischenschritt
// noetig, das Auslösen der Action IST der Sende-Vorgang).
export async function emailQrDesign(eventId: string, formData: FormData) {
  const { event, session } = await requireOwnedEvent(eventId);
  const size: PrintSize = sizeFromForm(formData);
  const theme = themeFromForm(formData);
  const target = targetFromForm(formData);
  const resolved = await resolveTarget(eventId, event.slug, event.title, target);
  const templateColors: { primary: string; accent: string; background: string } = JSON.parse(event.template.colors);
  const activeColors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  // Gleicher Kontrast-Schutz wie bei der Live-Vorschau (design-preview/route.ts)
  // — sonst waere bei dunklen Vorlagen (helle Schrift auf dunklem Vorlagen-
  // hintergrund) der Titel auf dem hellen Kartenhintergrund unsichtbar.
  const { dark: safePrimary, light: safeBackground } = safeQrColorsFromEvent(activeColors.primary, activeColors.background);

  const svg = await buildQrDesignSvg({
    size,
    theme,
    title: resolved.title,
    subtitle: resolved.subtitle,
    targetUrl: resolved.targetUrl,
    primary: safePrimary,
    accent: activeColors.accent,
    background: safeBackground,
  });

  const to = session.user!.email!;
  await sendEmail({
    to,
    subject: `Euer QR-Design (${size}) — ${event.title}`,
    html: `<p>Anbei euer QR-Code-Design als druckfertige SVG-Datei (${size}).</p>
<p>Zum Selbstausdrucken, oder antwortet einfach auf diese Mail mit eurer Adresse, wenn ihr es lieber gedruckt & verschickt haben wollt.</p>`,
    attachments: [
      {
        filename: `qr-design-${size.toLowerCase()}-${resolved.title.toLowerCase().replace(/\s+/g, "-")}.svg`,
        content: Buffer.from(svg, "utf-8").toString("base64"),
      },
    ],
  });

  const redirectBase = target.kind === "TABLE" ? `/dashboard/events/${eventId}/seating` : `/dashboard/events/${eventId}`;
  redirect(`${redirectBase}?qrEmail=success`);
}

// Legt einen Druck-&-Versand-Auftrag an (Status PENDING) und schickt den
// Kunden zu Stripe. Der Betreiber wird erst benachrichtigt, sobald die
// Zahlung tatsaechlich eingegangen ist (siehe markPrintOrderPaid in
// checkout-fulfillment.ts, aufgerufen von Webhook + Success-Seite) — nicht
// schon beim Anlegen, sonst wuerde jeder abgebrochene Checkout eine
// "neuer Auftrag"-Mail ausloesen.
export async function createPrintOrder(eventId: string, formData: FormData) {
  const { event, session } = await requireOwnedEvent(eventId);

  // Liegt auf der Event-Hauptseite (nicht mehr /seating) — Kartendesign und
  // Sitzplan sind zwei getrennte Anliegen, die Design-Vorschau soll ohne
  // Unterseiten-Wechsel erreichbar sein.
  const redirectBase = `/dashboard/events/${eventId}`;

  const size: PrintSize = sizeFromForm(formData);
  const theme = themeFromForm(formData);
  const quantity = Math.max(1, Math.min(500, Number(formData.get("quantity") ?? 1) || 1));
  const target = targetFromForm(formData);

  const shippingName = String(formData.get("shippingName") ?? "").trim().slice(0, 120);
  const shippingStreet = String(formData.get("shippingStreet") ?? "").trim().slice(0, 160);
  const shippingZip = String(formData.get("shippingZip") ?? "").trim().slice(0, 20);
  const shippingCity = String(formData.get("shippingCity") ?? "").trim().slice(0, 120);

  if (!shippingName || !shippingStreet || !shippingZip || !shippingCity) {
    redirect(`${redirectBase}?error=missing-address`);
  }

  if (target.kind === "TABLE") {
    const table = await prisma.table.findFirst({ where: { id: target.tableId, eventId } });
    if (!table) redirect(`${redirectBase}?error=table-not-found`);
  }

  const priceCents = printOrderPriceCents(size, quantity);

  const printOrder = await prisma.printOrder.create({
    data: {
      eventId,
      tableId: target.kind === "TABLE" ? target.tableId : null,
      size,
      theme: DB_THEME[theme],
      quantity,
      priceCents,
      shippingName,
      shippingStreet,
      shippingZip,
      shippingCity,
    },
  });

  // ADMIN-Testkonten sollen Druckaufträge durchtesten koennen, ohne echtes
  // Geld ueber Stripe zu bewegen (gleiches Muster wie startAddOnCheckout).
  if (session.user.role === "ADMIN") {
    await markPrintOrderPaid(printOrder.id, "test-admin-bypass");
    redirect(`${redirectBase}`);
  }

  if (!stripe) redirect(`${redirectBase}?error=stripe-not-configured`);

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `einladi – Druckauftrag ${size} × ${quantity}`,
            description: `Event: ${event.title}`,
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { kind: "printOrder", printOrderId: printOrder.id, eventId },
    success_url: `${origin}/dashboard/events/${eventId}/billing/success?session_id={CHECKOUT_SESSION_ID}&kind=printOrder`,
    cancel_url: `${origin}${redirectBase}?error=print-cancelled`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");
  }

  redirect(checkoutSession.url);
}
