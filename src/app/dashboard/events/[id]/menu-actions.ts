"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { MenuCourse } from "@/generated/prisma/client";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

const MENU_COURSES: MenuCourse[] = ["STARTER", "MAIN", "DESSERT", "DRINK"];

export async function createMenuItem(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);
  const courseRaw = String(formData.get("course") ?? "MAIN");
  const course: MenuCourse = MENU_COURSES.includes(courseRaw as MenuCourse) ? (courseRaw as MenuCourse) : "MAIN";
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Name ist erforderlich.");

  const count = await prisma.menuItem.count({ where: { eventId, course } });
  await prisma.menuItem.create({ data: { eventId, course, name, description, sortOrder: count } });

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function deleteMenuItem(eventId: string, itemId: string) {
  await requireOwnedEvent(eventId);
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item || item.eventId !== eventId) throw new Error("Eintrag nicht gefunden.");

  await prisma.menuItem.delete({ where: { id: itemId } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
