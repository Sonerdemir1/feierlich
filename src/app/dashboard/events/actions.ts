"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateImageFile, saveEventImage } from "@/lib/uploads";

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
  redirect(`/dashboard/events/${eventId}`);
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
