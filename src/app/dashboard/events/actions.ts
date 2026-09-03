"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateImageFile, saveEventImage, validateVideoFile, validateAudioFile, saveEventMedia, saveEventAudio } from "@/lib/uploads";
import { putObject, readObject } from "@/lib/storage";
import { removeImageBackground } from "@/lib/background-removal";
import { generateAiDesignImage, AI_DESIGN_ADDON_KEY, AI_DESIGN_ATTEMPT_QUOTA } from "@/lib/ai-design";
import { generateInvitationCopy } from "@/lib/ai-text";
import { stripe } from "@/lib/stripe";
import { markEventAddOnPaid } from "@/lib/checkout-fulfillment";

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

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  const locationLatRaw = formData.get("locationLat");
  const locationLngRaw = formData.get("locationLng");
  const locationLat = locationLatRaw ? Number(locationLatRaw) : null;
  const locationLng = locationLngRaw ? Number(locationLngRaw) : null;
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
      locationLat,
      locationLng,
      description,
      ownerId: session.user.id,
    },
  });

  redirect(`/dashboard/events/${event.id}`);
}

// Wird direkt (nicht per <form action>) aus NewEventWizard.tsx aufgerufen,
// waehrend das Event noch gar nicht existiert — daher kein eventId/
// AiTextAttempt-Kontingent wie beim spaeteren Text-Assistenten, nur ein
// einfacher eingeloggt-Check. Gibt den Vorschlag direkt zurueck statt zu
// redirecten, da der Aufrufer eine Client-Komponente ist.
export async function suggestEventDescription(input: { names: string; eventType: string; keyDetails: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht angemeldet.");

  return generateInvitationCopy({ names: input.names, eventType: input.eventType, tone: "herzlich-leger", keyDetails: input.keyDetails });
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

// Video statt der Standard-Umschlag-Animation — beim Antippen spielt das
// Video, danach erscheint die eigentliche Einladung (siehe VideoEnvelope.tsx).
export async function uploadEnvelopeVideo(eventId: string, formData: FormData) {
  const { event } = await requireOwnedEvent(eventId);

  const file = formData.get("file");
  const error = validateVideoFile(file);
  if (error) redirect(`/dashboard/events/${eventId}?error=${error}`);

  const { url, mimeType, sizeBytes } = await saveEventMedia(eventId, file as File);
  const media = await prisma.media.create({ data: { eventId, type: "VIDEO", url, mimeType, sizeBytes, status: "APPROVED" } });
  await prisma.event.update({ where: { id: eventId }, data: { envelopeVideoId: media.id } });

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function removeEnvelopeVideo(eventId: string) {
  const { event } = await requireOwnedEvent(eventId);
  await prisma.event.update({ where: { id: eventId }, data: { envelopeVideoId: null } });
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/dashboard/events/${eventId}`);
}

// Hintergrundmusik — kein Autoplay (Browser-Policy + respektiert die
// Gaeste), Gaeste schalten sie selbst per Button auf der Einladungsseite ein.
export async function uploadBackgroundMusic(eventId: string, formData: FormData) {
  const { event } = await requireOwnedEvent(eventId);

  const file = formData.get("file");
  const error = validateAudioFile(file);
  if (error) redirect(`/dashboard/events/${eventId}?error=${error}`);

  const { url, mimeType, sizeBytes } = await saveEventAudio(eventId, file as File);
  const media = await prisma.media.create({ data: { eventId, type: "AUDIO", url, mimeType, sizeBytes, status: "APPROVED" } });
  await prisma.event.update({ where: { id: eventId }, data: { backgroundMusicId: media.id } });

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function removeBackgroundMusic(eventId: string) {
  const { event } = await requireOwnedEvent(eventId);
  await prisma.event.update({ where: { id: eventId }, data: { backgroundMusicId: null } });
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
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
  const { session, event } = await requireOwnedEvent(eventId);

  const addOnKey = String(formData.get("addOnKey") ?? "");
  const addOn = await prisma.addOn.findUnique({ where: { key: addOnKey } });
  if (!addOn || !addOn.active) redirect(`/dashboard/events/${eventId}?error=ai-design-unavailable`);

  const eventAddOn = await prisma.eventAddOn.upsert({
    where: { eventId_addOnId: { eventId, addOnId: addOn.id } },
    update: {},
    create: { eventId, addOnId: addOn.id, amountCents: addOn.priceCents },
  });

  if (eventAddOn.status === "PAID") redirect(`/dashboard/events/${eventId}`);

  // ADMIN-Testkonten (siehe publishEvent) sollen Zusatzpakete freischalten
  // koennen, ohne echtes Geld ueber Stripe zu bewegen — sonst gibt es
  // keine Moeglichkeit, kostenpflichtige Features gefahrlos durchzutesten.
  if (session.user.role === "ADMIN") {
    await markEventAddOnPaid(eventAddOn.id, "test-admin-bypass");
    revalidatePath(`/dashboard/events/${eventId}`);
    redirect(`/dashboard/events/${eventId}`);
  }

  if (!stripe) redirect(`/dashboard/events/${eventId}?error=stripe-not-configured`);

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

// Module, die per AddOn.moduleKeys an ein kostenpflichtiges Zusatzpaket
// gebunden sind, duerfen nur aktiviert werden, wenn dieses AddOn fuer das
// Event bezahlt ist — sonst liesse sich z.B. "Foto & Video Sammlung"
// (49 EUR) einfach per Haekchen gratis freischalten. Client-seitig blendet
// page.tsx solche Module fuer nicht zahlende Events aus, aber das reicht
// nicht: ohne diese serverseitige Pruefung koennte man das Haekchen per
// manuell nachgebautem POST trotzdem durchschmuggeln.
export async function gatedModuleKeys(eventId: string): Promise<Set<string>> {
  const [activeAddOns, paidEventAddOns] = await Promise.all([
    prisma.addOn.findMany({ where: { active: true } }),
    prisma.eventAddOn.findMany({ where: { eventId, status: "PAID" } }),
  ]);
  const paidAddOnIds = new Set(paidEventAddOns.map((ea) => ea.addOnId));

  const gated = new Set<string>();
  for (const addOn of activeAddOns) {
    if (paidAddOnIds.has(addOn.id)) continue;
    const keys: string[] = JSON.parse(addOn.moduleKeys || "[]");
    keys.forEach((k) => gated.add(k));
  }
  return gated;
}

export async function saveModules(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const [modules, gated] = await Promise.all([prisma.module.findMany(), gatedModuleKeys(eventId)]);
  const selectedKeys = new Set(formData.getAll("modules").map(String));

  await prisma.$transaction(
    modules.map((m) =>
      prisma.eventModule.upsert({
        where: { eventId_moduleId: { eventId, moduleId: m.id } },
        update: { enabled: !gated.has(m.key) && selectedKeys.has(m.key) },
        create: { eventId, moduleId: m.id, enabled: !gated.has(m.key) && selectedKeys.has(m.key) },
      })
    )
  );

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}?modulesSaved=1`);
}

// Modul-spezifische Konfiguration ("thank-you-card") liegt im generischen
// EventModule.config-JSON-Feld — gleiches Muster wie Event.colorOverride,
// keine eigene Spalte noetig.
export async function saveThankYouCard(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const message = String(formData.get("thankYouMessage") ?? "").trim().slice(0, 500);
  const thankYouModule = await prisma.module.findUnique({ where: { key: "thank-you-card" } });
  if (!thankYouModule) redirect(`/dashboard/events/${eventId}`);

  await prisma.eventModule.upsert({
    where: { eventId_moduleId: { eventId, moduleId: thankYouModule.id } },
    update: { config: message ? JSON.stringify({ message }) : null },
    create: { eventId, moduleId: thankYouModule.id, enabled: true, config: message ? JSON.stringify({ message }) : null },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}?thankYouSaved=1`);
}

export async function saveDesign(eventId: string, formData: FormData) {
  const { event } = await requireOwnedEvent(eventId);

  // Nur nicht-leere Felder aufnehmen — beim Lesen wird ueber die Template-
  // Standardfarben gemergt ({ ...templateColors, ...override }), ein
  // leerer String wuerde die Template-Farbe sonst kaputt auf "" setzen
  // statt sie einfach unveraendert zu lassen.
  const override: Record<string, string> = {};
  for (const key of ["primary", "accent", "background"] as const) {
    const value = String(formData.get(key) ?? "").trim();
    if (value) override[key] = value;
  }

  // fontId/ornaments sind echte Editor-Einstellungen fuer die oeffentliche
  // Event-Seite (siehe /e/[slug]/page.tsx), unabhaengig von den Farben —
  // eigenes JSON-Feld statt in colorOverride mit reingemischt, damit beide
  // unabhaengig voneinander zurueckgesetzt werden koennen.
  const fontId = String(formData.get("fontId") ?? "").trim();
  const ornaments = formData.get("ornaments") === "on";
  const style: Record<string, unknown> = {};
  if (fontId) style.fontId = fontId;
  if (ornaments) style.ornaments = true;

  // Pro-Element Groesse/Farbe (Anlass-Label/Titel/Untertitel/Familiennamen/
  // Datum/Beschreibung) — siehe src/lib/text-style.ts. Nur nicht-"md"/nicht-
  // leere Werte aufnehmen, gleiches Muster wie bei den Farben oben.
  const elements: Record<string, { size?: string; color?: string }> = {};
  for (const key of ["eventLabel", "title", "subtitle", "family", "date", "description"] as const) {
    const size = String(formData.get(`${key}Size`) ?? "").trim();
    const colorOn = formData.get(`${key}ColorOn`) === "on";
    const color = colorOn ? String(formData.get(`${key}Color`) ?? "").trim() : "";
    const entry: { size?: string; color?: string } = {};
    if (size && size !== "md") entry.size = size;
    if (color) entry.color = color;
    if (entry.size || entry.color) elements[key] = entry;
  }
  if (Object.keys(elements).length > 0) style.elements = elements;

  await prisma.event.update({
    where: { id: eventId },
    data: { colorOverride: JSON.stringify(override), styleJson: JSON.stringify(style) },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function resetDesign(eventId: string) {
  const { event } = await requireOwnedEvent(eventId);
  await prisma.event.update({ where: { id: eventId }, data: { colorOverride: null, styleJson: null } });
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/dashboard/events/${eventId}`);
}

// Vorlage jederzeit wechseln, statt nur bei Erstellung festzulegen (siehe
// createEvent oben) — colorOverride/styleJson werden dabei zurueckgesetzt,
// sonst blieben Farben/Schriftart der alten Vorlage haengen, die zur neuen
// nicht mehr passen.
export async function changeTemplate(eventId: string, formData: FormData) {
  const { event } = await requireOwnedEvent(eventId);

  const templateId = String(formData.get("templateId") ?? "").trim();
  if (!templateId || templateId === event.templateId) {
    redirect(`/dashboard/events/${eventId}`);
  }

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template || template.status !== "ACTIVE") {
    redirect(`/dashboard/events/${eventId}?error=template-not-found`);
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { templateId, colorOverride: null, styleJson: null },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/dashboard/events/${eventId}?templateSaved=1`);
}

export async function publishEvent(eventId: string) {
  const { session, event } = await requireOwnedEvent(eventId);
  if (event.status === "PUBLISHED") {
    redirect(`/dashboard/events/${eventId}`);
  }

  // Veroeffentlichen macht die Seite oeffentlich erreichbar/teilbar — das
  // darf ohne bezahltes Einladungs-Paket nicht moeglich sein, sonst
  // umgeht man den kompletten Kauf-Flow. ADMIN-Accounts (eigenes Test-
  // Konto) sind ausgenommen, um frei durchtesten zu koennen.
  if (session.user.role !== "ADMIN") {
    const order = await prisma.order.findUnique({ where: { eventId } });
    if (!order || order.status !== "PAID") {
      redirect(`/dashboard/events/${eventId}?error=payment-required`);
    }
  }

  await prisma.event.update({ where: { id: eventId }, data: { status: "PUBLISHED" } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

// Eigener Link-Name statt des zufaellig generierten Vorschlags aus
// createEvent (slugify oben) — Kunden-Feedback (Konkurrenz-Screenshot
// "Davetiye Linkinizi Oluşturun") wollte den Link selbst waehlen koennen,
// bevor er geteilt wird.
export async function updateSlug(eventId: string, formData: FormData) {
  const { event } = await requireOwnedEvent(eventId);
  const clean = sanitizeSlug(String(formData.get("slug") ?? ""));

  if (!clean || clean.length < 3) {
    redirect(`/dashboard/events/${eventId}?error=slug-invalid`);
  }
  if (clean === event.slug) {
    redirect(`/dashboard/events/${eventId}`);
  }
  const existing = await prisma.event.findUnique({ where: { slug: clean } });
  if (existing) {
    redirect(`/dashboard/events/${eventId}?error=slug-taken`);
  }

  await prisma.event.update({ where: { id: eventId }, data: { slug: clean } });
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${clean}`);
  redirect(`/dashboard/events/${eventId}?slugSaved=1`);
}

// Bisher liessen sich Titel/Datum/Uhrzeit/Location nur bei der Event-
// Erstellung setzen (oder Untertitel/Beschreibung nur ueber den KI-Text-
// Assistenten ueberschreiben) — kein manueller Weg, einen Tippfehler im
// Titel zu korrigieren oder Datum/Ort nachtraeglich anzupassen. Diese
// Action schliesst genau diese Luecke.
export async function updateEventDetails(eventId: string, formData: FormData) {
  const { event } = await requireOwnedEvent(eventId);

  const title = String(formData.get("title") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "");
  if (!title || !eventDate) {
    redirect(`/dashboard/events/${eventId}?error=details-invalid`);
  }

  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const eventTime = String(formData.get("eventTime") ?? "").trim() || null;
  const locationName = String(formData.get("locationName") ?? "").trim() || null;
  const locationAddress = String(formData.get("locationAddress") ?? "").trim() || null;
  const locationLatRaw = formData.get("locationLat");
  const locationLngRaw = formData.get("locationLng");
  const locationLat = locationLatRaw ? Number(locationLatRaw) : null;
  const locationLng = locationLngRaw ? Number(locationLngRaw) : null;
  const description = String(formData.get("description") ?? "").trim() || null;
  // Leeres Feld = wieder auf Standard zurueck (EventType.name) bzw. Block
  // ausblenden — kein separater "entfernen"-Schalter noetig, das Leeren
  // des Textfelds selbst ist bereits das Entfernen.
  const eventLabel = String(formData.get("eventLabel") ?? "").trim() || null;
  const familyLeft = String(formData.get("familyLeft") ?? "").trim() || null;
  const familyRight = String(formData.get("familyRight") ?? "").trim() || null;

  await prisma.event.update({
    where: { id: event.id },
    data: {
      title,
      subtitle,
      eventDate: new Date(eventDate),
      eventTime,
      locationName,
      locationAddress,
      locationLat,
      locationLng,
      description,
      eventLabel,
      familyLeft,
      familyRight,
    },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/dashboard/events/${eventId}?detailsSaved=1`);
}
