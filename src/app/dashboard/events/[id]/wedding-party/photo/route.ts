import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateImageFile, saveEventImage } from "@/lib/uploads";

// Foto-Upload fuer EINEN Trauzeugen/Brautjungfer-Eintrag — anders als
// uploadCoverImage (Formular-Redirect) eine reine JSON-Antwort-Route, weil
// der Aufrufer (WeddingPartyList.tsx im Dashboard-iframe bzw. Gestalten) per
// fetch() aus einem Client-State-Editor heraus hochlaedt, nicht aus einem
// eigenstaendigen <form>. Gibt {mediaId, url} zurueck, das der Aufrufer dem
// betroffenen Listen-Eintrag zuordnet und beim naechsten Speichern der
// Gesamtliste (siehe /wedding-party/route.ts) mitschickt.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  const error = validateImageFile(file);
  if (error) return new Response(error, { status: 400 });

  const { url, mimeType, sizeBytes } = await saveEventImage(id, file as File);
  const media = await prisma.media.create({
    data: { eventId: id, type: "IMAGE", url, mimeType, sizeBytes, status: "APPROVED" },
  });

  return Response.json({ ok: true, mediaId: media.id, url: media.url });
}
