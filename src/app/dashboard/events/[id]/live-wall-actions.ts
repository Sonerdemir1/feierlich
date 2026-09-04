"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

export async function setLiveWallMode(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);
  const mode = String(formData.get("liveWallMode") ?? "immediate");
  await prisma.event.update({
    where: { id: eventId },
    data: { liveWallMode: mode === "next-morning" ? "next-morning" : "immediate" },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

// Hashtag fuers Social-Media-Modul (siehe seed.ts "social-media") — bisher
// nirgends speicherbar, obwohl das Modul das laut eigener Beschreibung
// verspricht. Landet im generischen EventModule.config-JSON, gleiches
// Muster wie das Dankeskarten-Modul (config: { message }).
export async function setEventHashtag(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);
  const hashtag = String(formData.get("hashtag") ?? "").trim().slice(0, 40);

  const socialModule = await prisma.module.findUnique({ where: { key: "social-media" } });
  if (socialModule) {
    await prisma.eventModule.upsert({
      where: { eventId_moduleId: { eventId, moduleId: socialModule.id } },
      update: { config: JSON.stringify({ hashtag }) },
      create: { eventId, moduleId: socialModule.id, config: JSON.stringify({ hashtag }) },
    });
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
