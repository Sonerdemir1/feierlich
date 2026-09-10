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

// Hashtag fuer die Live-Wand-Diashow im Saal (Wasserzeichen unten rechts,
// siehe LiveWallSlideshow.tsx) — bewusst getrennt von Event.socialMediaText
// (Hashtag-Text auf der Einladungsseite selbst, editierbar im "Karten-
// Design"-Panel). Beide halten denselben Hashtag fest, aber fuer zwei
// unterschiedliche Anzeigeorte mit eigenem Speicherzyklus (siehe Fund in
// der Bestandsaufnahme zur Live-Wand-Vereinfachung) — deshalb bewusst NICHT
// zusammengefuehrt, nur an die Social-Media-Sektion des Panels verschoben.
// Landet im generischen EventModule.config-JSON, gleiches Muster wie das
// Dankeskarten-Modul (config: { message }).
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
