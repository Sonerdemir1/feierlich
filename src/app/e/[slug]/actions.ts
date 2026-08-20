"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { validateImageFile, saveEventImage } from "@/lib/uploads";

export async function submitRsvp(eventId: string, slug: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`/e/${slug}?rsvp=error`);

  const attending = formData.get("attending") === "yes";
  const countRaw = Number(formData.get("count") ?? 1);
  const count = Number.isFinite(countRaw) && countRaw > 0 ? Math.min(countRaw, 20) : 1;
  const message = String(formData.get("message") ?? "").trim() || null;

  const guest = await prisma.guest.create({
    data: { eventId, firstName: name, invitedCount: count },
  });
  await prisma.rSVP.create({
    data: {
      guestId: guest.id,
      status: attending ? "YES" : "NO",
      attendingCount: attending ? count : 0,
      message,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/e/${slug}`);
  redirect(`/e/${slug}?rsvp=success`);
}

export async function findSeat(eventId: string, slug: string, formData: FormData) {
  const name = String(formData.get("seatName") ?? "").trim();
  if (!name) redirect(`/e/${slug}#sitzplatz`);

  const guest = await prisma.guest.findFirst({
    where: { eventId, firstName: { contains: name } },
    include: { seat: { include: { table: true } } },
  });

  const result = guest?.seat ? encodeURIComponent(guest.seat.table.name) : "notfound";
  redirect(`/e/${slug}?seat=${result}#sitzplatz`);
}

export async function uploadGalleryPhoto(eventId: string, slug: string, formData: FormData) {
  const file = formData.get("file");
  const error = validateImageFile(file);
  if (error) redirect(`/e/${slug}?galleryError=${error}#galerie`);

  const { url, mimeType, sizeBytes } = await saveEventImage(eventId, file as File);
  const uploaderName = String(formData.get("uploaderName") ?? "").trim().slice(0, 80) || null;

  const media = await prisma.media.create({
    data: { eventId, type: "IMAGE", url, mimeType, sizeBytes, uploaderName, status: "PENDING" },
  });
  await prisma.galleryItem.create({ data: { eventId, mediaId: media.id, status: "PENDING" } });

  revalidatePath(`/e/${slug}`);
  redirect(`/e/${slug}?gallery=success#galerie`);
}

export async function submitGuestbookEntry(eventId: string, slug: string, formData: FormData) {
  const authorName = String(formData.get("authorName") ?? "").trim().slice(0, 80);
  const message = String(formData.get("message") ?? "").trim().slice(0, 1000) || null;
  if (!authorName) redirect(`/e/${slug}?guestbookError=no-name#gaestebuch`);

  const file = formData.get("file");
  let mediaId: string | undefined;
  if (file instanceof File && file.size > 0) {
    const error = validateImageFile(file);
    if (error) redirect(`/e/${slug}?guestbookError=${error}#gaestebuch`);
    const { url, mimeType, sizeBytes } = await saveEventImage(eventId, file);
    const media = await prisma.media.create({
      data: { eventId, type: "IMAGE", url, mimeType, sizeBytes, uploaderName: authorName, status: "PENDING" },
    });
    mediaId = media.id;
  }

  await prisma.guestbookEntry.create({
    data: { eventId, authorName, message, mediaId, status: "PENDING" },
  });

  revalidatePath(`/e/${slug}`);
  redirect(`/e/${slug}?guestbook=success#gaestebuch`);
}
