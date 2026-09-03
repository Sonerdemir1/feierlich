"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { WishlistType } from "@/generated/prisma/client";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

const WISHLIST_TYPES: WishlistType[] = ["GIFT", "CASH", "HONEYMOON", "EXTERNAL"];

export async function createWishlistItem(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);
  const typeRaw = String(formData.get("type") ?? "GIFT");
  const type: WishlistType = WISHLIST_TYPES.includes(typeRaw as WishlistType) ? (typeRaw as WishlistType) : "GIFT";
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  if (!title) throw new Error("Titel ist erforderlich.");

  const count = await prisma.wishlistItem.count({ where: { eventId } });
  await prisma.wishlistItem.create({ data: { eventId, type, title, description, url, sortOrder: count } });

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function deleteWishlistItem(eventId: string, itemId: string) {
  await requireOwnedEvent(eventId);
  const item = await prisma.wishlistItem.findUnique({ where: { id: itemId } });
  if (!item || item.eventId !== eventId) throw new Error("Eintrag nicht gefunden.");

  await prisma.wishlistItem.delete({ where: { id: itemId } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
