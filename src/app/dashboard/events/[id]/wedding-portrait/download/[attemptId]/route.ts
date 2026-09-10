import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readObject } from "@/lib/storage";

// Liefert die hochaufgeloeste, wasserzeichenfreie Version (rawUrl) EINES
// Hochzeitsportraet-Versuchs aus — nur wenn der zugehoerige
// WeddingPortraitDownload wirklich PAID ist (nicht nur "existiert"), sonst
// 402/403 statt einfach die Datei rauszugeben. Gleiches Auth-/Ownership-
// Muster wie photobook/pdf/route.ts.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const { id, attemptId } = await params;
  const session = await auth();
  if (!session?.user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  const attempt = await prisma.weddingPortraitAttempt.findUnique({
    where: { id: attemptId },
    include: { download: true },
  });
  if (!attempt || attempt.eventId !== id) {
    return new Response("Nicht gefunden.", { status: 404 });
  }
  if (attempt.download?.status !== "PAID") {
    return new Response("Der hochauflösende Download wurde noch nicht bezahlt.", { status: 403 });
  }

  const bytes = await readObject(attempt.rawUrl);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="hochzeitsportraet-${attempt.stylePreset}-${attempt.id}.png"`,
    },
  });
}
