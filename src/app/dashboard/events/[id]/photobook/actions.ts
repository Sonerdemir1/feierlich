"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventHasFeature } from "@/lib/event-features";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { order: { include: { package: true } } } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

// Persistiert die vom Paar getroffene Foto-Auswahl + Reihenfolge (siehe
// photobookMediaIds-Schema-Kommentar) — der Client (PhotobookPicker.tsx)
// haelt die Reihenfolge lokal im State und serialisiert sie erst beim
// Speichern in ein einzelnes verstecktes Formularfeld (kommagetrennte
// Media-IDs), statt bei jedem Klick einen eigenen Server-Roundtrip
// auszuloesen.
export async function savePhotobookSelection(eventId: string, formData: FormData) {
  const event = await requireOwnedEvent(eventId);
  if (!eventHasFeature(event, "photobook")) {
    throw new Error("Gästefotobuch ist in diesem Paket nicht enthalten.");
  }

  const raw = String(formData.get("selectedMediaIds") ?? "");
  const selectedIds = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  // Nur gegen tatsaechlich freigegebene Fotos dieses Events validieren —
  // verhindert, dass ueber ein manipuliertes Formularfeld fremde/nicht
  // freigegebene Media-IDs in die Auswahl gelangen.
  const validMediaIds = new Set(
    (
      await prisma.galleryItem.findMany({
        where: { eventId, status: "APPROVED", media: { type: "IMAGE" } },
        select: { mediaId: true },
      })
    ).map((g) => g.mediaId)
  );
  const cleanedIds = selectedIds.filter((id) => validMediaIds.has(id));

  await prisma.event.update({
    where: { id: eventId },
    data: { photobookMediaIds: cleanedIds.length > 0 ? JSON.stringify(cleanedIds) : null },
  });

  revalidatePath(`/dashboard/events/${eventId}/photobook`);
  redirect(`/dashboard/events/${eventId}/photobook?saved=1`);
}
