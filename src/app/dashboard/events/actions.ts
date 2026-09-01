"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateImageFile, saveEventImage } from "@/lib/uploads";
import { putObject, readObject } from "@/lib/storage";
import { removeImageBackground } from "@/lib/background-removal";
import { generateAiDesignImage, AI_DESIGN_ADDON_KEY, AI_DESIGN_ATTEMPT_QUOTA } from "@/lib/ai-design";
import { stripe } from "@/lib/stripe";

const REFERRAL_COOKIE = "ref_partner";

// Ordnet einen Kunden bei seinem ersten Event dem Partner zu, ueber
// dessen Empfehlungslink (/p/<slug>) er gekommen ist. Einmalig: ein
// bereits zugeordneter Kunde behaelt seinen Partner dauerhaft.
async function attachReferralPartner(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.partnerId) return;

  const jar = await cookies();
  const slug = jar.get(REFERRAL_COOKIE)?.value;
  if (!slug) return;

  const partner = await prisma.partner.findUnique({ where: { slug } });
  if (!partner) return;

  await prisma.user.update({ where: { id: userId }, data: { partnerId: partner.id } });
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "event"}-${suffix}`;
}

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return { session, event };
}

export async function createEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const eventTypeId = String(formData.get("eventTypeId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const eventDate = String(formData.get("eventDate") ?? "");
  const eventTime = String(formData.get("eventTime") ?? "").trim() || null;
  const locationName = String(formData.get("locationName") ?? "").trim() || null;
  const locationAddress = String(formData.get("locationAddress") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!title || !eventTypeId || !templateId || !eventDate) {
    throw new Error("Bitte Eventtyp, Template, Titel und Datum ausfüllen.");
  }

  await attachReferralPartner(session.user.id);

  const event = await prisma.event.create({
    data: {
      title,
      slug: slugify(title),
      eventTypeId,
      templateId,
      eventDate: new Date(eventDate),
      eventTime,
      locationName,
      locationAddress,
      description,
      ownerId: session.user.id,
    },
  });

  redirect(`/dashboard/events/${event.id}`);
}

export async function uploadCoverImage(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const file = formData.get("file");
  const error = validateImageFile(file);
  if (error) redirect(`/dashboard/events/${eventId}?error=${error}`);

  const { url, mimeType, sizeBytes } = await saveEventImage(eventId, file as File);

  // Eigene Uploads des Gastgebers sind sofort freigegeben; Gaeste-Uploads
  // starten dagegen mit status: PENDING zur Moderation (siehe Gaestebuch/
  // Galerie-Actions).
  const media = await prisma.media.create({
    data: { eventId, type: "IMAGE", url, mimeType, sizeBytes, status: "APPROVED" },
  });
  await prisma.event.update({ where: { id: eventId }, data: { coverImageId: media.id } });

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

// Erzeugt aus dem aktuellen Titelbild eine freigestellte Version (remove.bg)
// und setzt sie als neues Titelbild. Das Original bleibt als eigener
// Media-Eintrag erhalten (nicht ueberschrieben) — falls das Ergebnis nicht
// gefaellt, laesst sich einfach ein neues Bild hochladen.
export async function removeCoverImageBackground(eventId: string) {
  await requireOwnedEvent(eventId);

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { coverImage: true } });
  if (!event?.coverImage) redirect(`/dashboard/events/${eventId}?error=no-cover-image`);

  let freistehend: Buffer;
  try {
    const source = await readObject(event.coverImage.url);
    freistehend = await removeImageBackground(source, event.coverImage.mimeType);
  } catch {
    redirect(`/dashboard/events/${eventId}?error=bg-removal-failed`);
  }

  const url = await putObject(`events/${eventId}/${randomUUID()}.png`, freistehend, "image/png");
  const media = await prisma.media.create({
    data: { eventId, type: "IMAGE", url, mimeType: "image/png", sizeBytes: freistehend.length, status: "APPROVED" },
  });
  await prisma.event.update({ where: { id: eventId }, data: { coverImageId: media.id } });

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

// Generischer Stripe-Checkout fuer ein beliebiges AddOn (aktuell "ai-design",
// aber genauso fuer z.B. "photo-video-collection" nutzbar) — legt/aktualisiert
// den EventAddOn-Datensatz als PENDING und schickt den Kunden zu Stripe.
// Das Kontingent fuer generateAiDesignForCover() greift erst, sobald der
// Webhook/die Success-Seite den Status auf PAID setzt.
export async function startAddOnCheckout(eventId: string, formData: FormData) {
  const { event } = await requireOwnedEvent(eventId);

  if (!stripe) redirect(`/dashboard/events/${eventId}?error=stripe-not-configured`);

  const addOnKey = String(formData.get("addOnKey") ?? "");
  const addOn = await prisma.addOn.findUnique({ where: { key: addOnKey } });
  if (!addOn || !addOn.active) redirect(`/dashboard/events/${eventId}?error=ai-design-unavailable`);

  const eventAddOn = await prisma.eventAddOn.upsert({
    where: { eventId_addOnId: { eventId, addOnId: addOn.id } },
    update: {},
    create: { eventId, addOnId: addOn.id, amountCents: addOn.priceCents },
  });

  if (eventAddOn.status === "PAID") redirect(`/dashboard/events/${eventId}`);

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: eventAddOn.currency.toLowerCase(),
          product_data: { name: `einladi – ${addOn.name}`, description: `Event: ${event.title}` },
          unit_amount: eventAddOn.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { kind: "eventAddOn", eventAddOnId: eventAddOn.id, eventId },
    success_url: `${origin}/dashboard/events/${eventId}/billing/success?session_id={CHECKOUT_SESSION_ID}&kind=eventAddOn`,
    cancel_url: `${origin}/dashboard/events/${eventId}?error=addon-cancelled`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");
  }

  redirect(checkoutSession.url);
}

// Bearbeitet das aktuelle Titelbild per KI-Prompt (gpt-image-2, Bild-zu-
// Bild) und setzt das Ergebnis als neues Titelbild — gleiches Muster wie
// removeCoverImageBackground(): Original bleibt als eigener Media-Eintrag
// erhalten. Kontingent (AI_DESIGN_ATTEMPT_QUOTA) wird pro Event anhand
// der AiDesignAttempt-Zeilen gezaehlt, unabhaengig vom Zahlungsstatus des
// AddOns, da jeder Versuch echte OpenAI-Kosten verursacht.
export async function generateAiDesignForCover(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const prompt = String(formData.get("prompt") ?? "").trim().slice(0, 500);
  if (!prompt) redirect(`/dashboard/events/${eventId}?error=ai-design-no-prompt`);

  const addOn = await prisma.addOn.findUnique({ where: { key: AI_DESIGN_ADDON_KEY } });
  const eventAddOn = addOn
    ? await prisma.eventAddOn.findUnique({ where: { eventId_addOnId: { eventId, addOnId: addOn.id } } })
    : null;
  if (!eventAddOn || eventAddOn.status !== "PAID") redirect(`/dashboard/events/${eventId}?error=ai-design-not-activated`);

  const attemptCount = await prisma.aiDesignAttempt.count({ where: { eventId } });
  if (attemptCount >= AI_DESIGN_ATTEMPT_QUOTA) redirect(`/dashboard/events/${eventId}?error=ai-design-quota`);

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { coverImage: true } });
  if (!event?.coverImage) redirect(`/dashboard/events/${eventId}?error=no-cover-image`);

  let result: Buffer;
  try {
    const source = await readObject(event.coverImage.url);
    result = await generateAiDesignImage(source, event.coverImage.mimeType, prompt);
  } catch {
    redirect(`/dashboard/events/${eventId}?error=ai-design-failed`);
  }

  const url = await putObject(`events/${eventId}/${randomUUID()}.png`, result, "image/png");
  const media = await prisma.media.create({
    data: { eventId, type: "IMAGE", url, mimeType: "image/png", sizeBytes: result.length, status: "APPROVED" },
  });
  await prisma.aiDesignAttempt.create({ data: { eventId, prompt, resultUrl: url } });
  await prisma.event.update({ where: { id: eventId }, data: { coverImageId: media.id } });

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function saveModules(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const modules = await prisma.module.findMany();
  const selectedKeys = new Set(formData.getAll("modules").map(String));

  await prisma.$transaction(
    modules.map((m) =>
      prisma.eventModule.upsert({
        where: { eventId_moduleId: { eventId, moduleId: m.id } },
        update: { enabled: selectedKeys.has(m.key) },
        create: { eventId, moduleId: m.id, enabled: selectedKeys.has(m.key) },
      })
    )
  );

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}?modulesSaved=1`);
}

export async function saveDesign(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const colorOverride = JSON.stringify({
    primary: String(formData.get("primary") ?? ""),
    accent: String(formData.get("accent") ?? ""),
    background: String(formData.get("background") ?? ""),
  });

  await prisma.event.update({ where: { id: eventId }, data: { colorOverride } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function publishEvent(eventId: string) {
  const { event } = await requireOwnedEvent(eventId);
  if (event.status === "PUBLISHED") {
    redirect(`/dashboard/events/${eventId}`);
  }
  await prisma.event.update({ where: { id: eventId }, data: { status: "PUBLISHED" } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
