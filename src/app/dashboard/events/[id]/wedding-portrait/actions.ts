"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateImageFile, saveEventImage } from "@/lib/uploads";
import { putObject, readObject } from "@/lib/storage";
import {
  generateWeddingPortraitImage,
  weddingPortraitStyleByKey,
  WEDDING_PORTRAIT_ATTEMPT_QUOTA,
  WEDDING_PORTRAIT_DOWNLOAD_PRICE_CENTS,
} from "@/lib/ai-wedding-portrait";
import { AiBudgetExceededError } from "@/lib/ai-budget-constants";
import { composeWeddingPortraitPreview } from "@/lib/wedding-portrait-preview";
import { stripe } from "@/lib/stripe";
import { markWeddingPortraitDownloadPaid } from "@/lib/checkout-fulfillment";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return { session, event };
}

// Eigenes Foto des Brautpaares — bewusst getrennt vom Titelbild-Upload
// (uploadCoverImage), eigenes Feld (weddingPortraitSourceId), siehe Schema-
// Kommentar. Ueberschreibt ein evtl. vorheriges Foto (wie coverImageId),
// bisherige Portraet-Versuche (WeddingPortraitAttempt) bleiben unabhaengig
// davon erhalten.
export async function uploadWeddingPortraitSource(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const file = formData.get("file");
  const error = validateImageFile(file);
  if (error) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=${error}`);

  const { url, mimeType, sizeBytes } = await saveEventImage(eventId, file as File);
  const media = await prisma.media.create({
    data: { eventId, type: "IMAGE", url, mimeType, sizeBytes, status: "APPROVED" },
  });
  await prisma.event.update({ where: { id: eventId }, data: { weddingPortraitSourceId: media.id } });

  revalidatePath(`/dashboard/events/${eventId}/wedding-portrait`);
  redirect(`/dashboard/events/${eventId}/wedding-portrait`);
}

// Generiert EIN Portraet im gewaehlten Stil — Kontingent (WEDDING_PORTRAIT_
// ATTEMPT_QUOTA) wird ueber die Anzahl bisheriger WeddingPortraitAttempt-
// Zeilen pro Event gezaehlt, da jeder Versuch echte OpenAI-Kosten verursacht
// (siehe ai-wedding-portrait.ts). rawUrl (ohne Overlay/Wasserzeichen) wird
// zusaetzlich zur previewUrl gespeichert, damit ein spaeterer bezahlter
// hochaufgeloester Download OHNE erneute Generierung moeglich ist.
export async function generateWeddingPortrait(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const styleKey = String(formData.get("style") ?? "");
  const style = weddingPortraitStyleByKey(styleKey);
  if (!style) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-no-style`);

  const attemptCount = await prisma.weddingPortraitAttempt.count({ where: { eventId } });
  if (attemptCount >= WEDDING_PORTRAIT_ATTEMPT_QUOTA) {
    redirect(`/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-quota`);
  }

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { weddingPortraitSource: true } });
  if (!event?.weddingPortraitSource) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-no-source`);

  const dateLabel = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(event.eventDate);

  let rawResult: Buffer;
  let previewResult: Buffer;
  try {
    const source = await readObject(event.weddingPortraitSource.url);
    rawResult = await generateWeddingPortraitImage(source, event.weddingPortraitSource.mimeType, style);
    previewResult = await composeWeddingPortraitPreview(rawResult, style, event.title, dateLabel);
  } catch (err) {
    if (err instanceof AiBudgetExceededError) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=ai-budget`);
    redirect(`/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-failed`);
  }

  const [rawUrl, previewUrl] = await Promise.all([
    putObject(`events/${eventId}/wedding-portrait/${randomUUID()}-raw.png`, rawResult, "image/png"),
    putObject(`events/${eventId}/wedding-portrait/${randomUUID()}-preview.png`, previewResult, "image/png"),
  ]);

  await prisma.weddingPortraitAttempt.create({ data: { eventId, stylePreset: style.key, rawUrl, previewUrl } });

  revalidatePath(`/dashboard/events/${eventId}/wedding-portrait`);
  redirect(`/dashboard/events/${eventId}/wedding-portrait`);
}

// Stripe-Checkout fuer den Einzelkauf EINES hochaufgeloesten Downloads —
// gleiches Muster wie startAddOnCheckout() (events/actions.ts) und
// startCheckout() (billing/actions.ts): WeddingPortraitDownload wird als
// PENDING angelegt/wiederverwendet, ADMIN-Testkonten bekommen den Bypass
// ohne echten Stripe-Aufruf (siehe dortiger Kommentar), sonst echte
// Checkout-Session mit `kind: "weddingPortraitDownload"` fuer den
// gemeinsamen Webhook-/Success-Seiten-Dispatcher.
export async function startWeddingPortraitDownloadCheckout(eventId: string, attemptId: string) {
  const { session, event } = await requireOwnedEvent(eventId);

  const attempt = await prisma.weddingPortraitAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.eventId !== eventId) {
    throw new Error("Hochzeitsporträt nicht gefunden.");
  }

  const download = await prisma.weddingPortraitDownload.upsert({
    where: { attemptId },
    update: {},
    create: { attemptId, eventId, amountCents: WEDDING_PORTRAIT_DOWNLOAD_PRICE_CENTS },
  });

  if (download.status === "PAID") {
    redirect(`/dashboard/events/${eventId}/wedding-portrait`);
  }

  if (session.user!.role === "ADMIN") {
    await markWeddingPortraitDownloadPaid(download.id, "test-admin-bypass");
    revalidatePath(`/dashboard/events/${eventId}/wedding-portrait`);
    redirect(`/dashboard/events/${eventId}/wedding-portrait`);
  }

  if (!stripe) redirect(`/dashboard/events/${eventId}/wedding-portrait?error=stripe-not-configured`);

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: download.currency.toLowerCase(),
          product_data: { name: "einladi – Hochzeitsporträt (hochauflösend)", description: `Event: ${event.title}` },
          unit_amount: download.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { kind: "weddingPortraitDownload", downloadId: download.id, eventId },
    success_url: `${origin}/dashboard/events/${eventId}/billing/success?session_id={CHECKOUT_SESSION_ID}&kind=weddingPortraitDownload&return=wedding-portrait`,
    cancel_url: `${origin}/dashboard/events/${eventId}/wedding-portrait?error=wedding-portrait-download-cancelled`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");
  }

  redirect(checkoutSession.url);
}
