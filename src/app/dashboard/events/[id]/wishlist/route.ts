import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { WISHLIST_TYPES, type WishlistItemType } from "@/lib/wishlist";

const MAX_ITEMS = 30;

function sanitizeItems(raw: unknown): { id: string; type: WishlistItemType; title: string; description: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is Record<string, unknown> => Boolean(it) && typeof it === "object")
    .slice(0, MAX_ITEMS)
    .map((it) => ({
      id: typeof it.id === "string" && it.id ? it.id : crypto.randomUUID(),
      type: WISHLIST_TYPES.includes(it.type as WishlistItemType) ? (it.type as WishlistItemType) : "GIFT",
      title: (typeof it.title === "string" ? it.title : "").slice(0, 200),
      description: (typeof it.description === "string" ? it.description : "").slice(0, 500),
      url: (typeof it.url === "string" ? it.url : "").slice(0, 500),
    }))
    .filter((it) => it.title.trim().length > 0);
}

// Speichert die komplette Wunschliste — gleiches "voller Ersatz statt
// Einzel-Diff"-Prinzip wie agenda/route.ts, hier aber gegen die echte
// WishlistItem-Tabelle (schon vor diesem Schritt vorhanden, bisher nur ueber
// das Formular unten auf der Dashboard-Seite verwaltet, siehe
// wishlist-actions.ts — die bleibt unveraendert bestehen). Ersetzt alle
// Zeilen des Events in einer Transaktion, damit keine Zwischenzustaende mit
// halb geloeschter Liste sichtbar werden. Client-Ids (auch frisch per
// crypto.randomUUID() erzeugte) werden explizit uebernommen, damit die im
// Editor ausgewaehlte Artikel-Id nach dem Speichern gueltig bleibt.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) return new Response("Ungültige Daten.", { status: 400 });

  const items = sanitizeItems(body.items);
  await prisma.$transaction([
    prisma.wishlistItem.deleteMany({ where: { eventId: id } }),
    ...items.map((item, index) =>
      prisma.wishlistItem.create({
        data: {
          id: item.id,
          eventId: id,
          type: item.type,
          title: item.title,
          description: item.description || null,
          url: item.url || null,
          sortOrder: index,
        },
      })
    ),
  ]);
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true, items });
}
