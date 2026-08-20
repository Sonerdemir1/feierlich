"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function uploadCoverImage(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/events/${eventId}?error=no-file`);
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    redirect(`/dashboard/events/${eventId}?error=bad-type`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    redirect(`/dashboard/events/${eventId}?error=too-large`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "events", eventId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  const url = `/uploads/events/${eventId}/${filename}`;

  // Eigene Uploads des Gastgebers sind sofort freigegeben; Gaeste-Uploads
  // (Phase 12) starten dagegen mit status: PENDING zur Moderation.
  const media = await prisma.media.create({
    data: { eventId, type: "IMAGE", url, mimeType: file.type, sizeBytes: file.size, status: "APPROVED" },
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
