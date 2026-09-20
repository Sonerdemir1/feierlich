import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { WEDDING_PARTY_ROLES, type WeddingPartyRole } from "@/lib/wedding-party";

const MAX_ITEMS = 30;

function sanitizeItems(raw: unknown): { id: string; role: WeddingPartyRole; name: string; photoId: string | null }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is Record<string, unknown> => Boolean(it) && typeof it === "object")
    .slice(0, MAX_ITEMS)
    .map((it) => ({
      id: typeof it.id === "string" && it.id ? it.id : crypto.randomUUID(),
      role: WEDDING_PARTY_ROLES.includes(it.role as WeddingPartyRole) ? (it.role as WeddingPartyRole) : "TRAUZEUGE",
      name: (typeof it.name === "string" ? it.name : "").slice(0, 200),
      photoId: typeof it.photoId === "string" && it.photoId ? it.photoId : null,
    }))
    .filter((it) => it.name.trim().length > 0);
}

// Speichert die komplette Trauzeugen/Brautjungfern-Liste — gleiches "voller
// Ersatz statt Einzel-Diff"-Prinzip wie wishlist/route.ts. photoId zeigt auf
// eine bereits per /wedding-party/photo hochgeladene Media-Zeile (siehe
// dortiger Kommentar) — wird hier nur referenziert, nicht neu hochgeladen.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) return new Response("Ungültige Daten.", { status: 400 });

  const items = sanitizeItems(body.items);
  // Nur photoIds akzeptieren, die tatsaechlich zu diesem Event gehoerende
  // Media-Zeilen sind — verhindert, dass ein manipulierter Request ein
  // fremdes Foto (aus einem anderen Event) verknuepft.
  const photoIds = items.map((it) => it.photoId).filter((v): v is string => Boolean(v));
  const ownedMedia = photoIds.length > 0 ? await prisma.media.findMany({ where: { id: { in: photoIds }, eventId: id }, select: { id: true } }) : [];
  const ownedMediaIds = new Set(ownedMedia.map((m) => m.id));

  await prisma.$transaction([
    prisma.weddingPartyMember.deleteMany({ where: { eventId: id } }),
    ...items.map((item, index) =>
      prisma.weddingPartyMember.create({
        data: {
          id: item.id,
          eventId: id,
          role: item.role,
          name: item.name,
          photoId: item.photoId && ownedMediaIds.has(item.photoId) ? item.photoId : null,
          sortOrder: index,
        },
      })
    ),
  ]);
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true, items });
}
