"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildQrDesignSvg, PRINT_PRICE_CENTS, type PrintSize } from "@/lib/qr-design";

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

async function resolveTarget(eventId: string, slug: string, target: Target) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (target.kind === "TABLE") {
    const table = await prisma.table.findFirst({ where: { id: target.tableId, eventId } });
    if (!table) throw new Error("Tisch nicht gefunden.");
    return {
      targetUrl: `${baseUrl}/e/${slug}?tisch=${table.id}#galerie`,
      title: table.name,
      subtitle: "Fotos & Videos teilen",
    };
  }

  const path = target.kind === "RSVP" ? `/e/${slug}#rsvp` : `/e/${slug}`;
  return {
    targetUrl: `${baseUrl}${path}`,
    title: target.kind === "RSVP" ? "Zusagen" : "Einladung",
    subtitle: target.kind === "RSVP" ? "Sagt uns Bescheid" : "Scannt für alle Infos",
  };
}

// Erzeugt die druckfertige QR-Design-SVG (A6/A5) und schickt sie als Anhang
// an die E-Mail-Adresse des eingeloggten Nutzers — automatisch, sobald
// diese Action aufgerufen wird (kein separater "jetzt senden"-Zwischenschritt
// noetig, das Auslösen der Action IST der Sende-Vorgang).
export async function emailQrDesign(eventId: string, formData: FormData) {
  const { event, session } = await requireOwnedEvent(eventId);
  const size: PrintSize = String(formData.get("size") ?? "A6") === "A5" ? "A5" : "A6";
  const target = targetFromForm(formData);
  const resolved = await resolveTarget(eventId, event.slug, target);
  const colors = event.template ? JSON.parse(event.template.colors) : {};

  const svg = await buildQrDesignSvg({
    size,
    title: resolved.title,
    subtitle: resolved.subtitle,
    targetUrl: resolved.targetUrl,
    primary: colors.primary,
    accent: colors.accent,
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

// Legt einen Druck-&-Versand-Auftrag an (Status PENDING — Bezahlung/
// Abwicklung laeuft manuell ausserhalb der App, kein Stripe-Checkout hier)
// und benachrichtigt den Betreiber per E-Mail, damit der Auftrag bearbeitet
// werden kann.
export async function createPrintOrder(eventId: string, formData: FormData) {
  const { event, session } = await requireOwnedEvent(eventId);
  const size: PrintSize = String(formData.get("size") ?? "A6") === "A5" ? "A5" : "A6";
  const quantity = Math.max(1, Math.min(500, Number(formData.get("quantity") ?? 1) || 1));
  const target = targetFromForm(formData);

  const shippingName = String(formData.get("shippingName") ?? "").trim().slice(0, 120);
  const shippingStreet = String(formData.get("shippingStreet") ?? "").trim().slice(0, 160);
  const shippingZip = String(formData.get("shippingZip") ?? "").trim().slice(0, 20);
  const shippingCity = String(formData.get("shippingCity") ?? "").trim().slice(0, 120);

  const redirectBase = `/dashboard/events/${eventId}/seating`;
  if (!shippingName || !shippingStreet || !shippingZip || !shippingCity) {
    redirect(`${redirectBase}?printError=missing-address`);
  }

  if (target.kind === "TABLE") {
    const table = await prisma.table.findFirst({ where: { id: target.tableId, eventId } });
    if (!table) redirect(`${redirectBase}?printError=table-not-found`);
  }

  const priceCents = PRINT_PRICE_CENTS[size] * quantity;

  await prisma.printOrder.create({
    data: {
      eventId,
      tableId: target.kind === "TABLE" ? target.tableId : null,
      size,
      quantity,
      priceCents,
      shippingName,
      shippingStreet,
      shippingZip,
      shippingCity,
    },
  });

  const notifyEmail = process.env.PRINT_ORDER_NOTIFY_EMAIL;
  if (notifyEmail) {
    await sendEmail({
      to: notifyEmail,
      subject: `Neuer Druckauftrag — ${event.title}`,
      html: `<p>Neuer Druckauftrag von <strong>${session.user!.email}</strong>:</p>
<ul>
  <li>Event: ${event.title} (${event.slug})</li>
  <li>Ziel: ${target.kind === "TABLE" ? `Tisch (${target.tableId})` : target.kind}</li>
  <li>Größe: ${size} × ${quantity}</li>
  <li>Preis: ${(priceCents / 100).toFixed(2)} € (Platzhalter-Preis, noch nicht bezahlt)</li>
  <li>Versand an: ${shippingName}, ${shippingStreet}, ${shippingZip} ${shippingCity}</li>
</ul>`,
    });
  }

  revalidatePath(redirectBase);
  redirect(`${redirectBase}?print=success`);
}
