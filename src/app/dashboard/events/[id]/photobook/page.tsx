import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventHasFeature } from "@/lib/event-features";
import { savePhotobookSelection } from "./actions";
import { PhotobookPicker } from "./PhotobookPicker";

export default async function PhotobookPage({ params, searchParams }: PageProps<"/dashboard/events/[id]/photobook">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  const event = await prisma.event.findUnique({
    where: { id },
    include: { order: { include: { package: true } } },
  });
  if (!event || event.ownerId !== session!.user.id) notFound();

  const hasAccess = eventHasFeature(event, "photobook");

  if (!hasAccess) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        <Link href={`/dashboard/events/${id}`} className="studio-back">
          ← Zurück
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginTop: 20, marginBottom: 12 }}>Gästefotobuch</h1>
        <div style={{ border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "24px 26px" }}>
          <p style={{ fontSize: 14, color: "var(--ink)", marginBottom: 14 }}>
            Freigegebene Gäste-Fotos zu einem herunterladbaren PDF-Fotobuch zusammenstellen — mit frei wählbarer
            Reihenfolge und Deckblatt.
          </p>
          <p style={{ fontSize: 13, color: "var(--terracotta-dark)", fontWeight: 600, marginBottom: 16 }}>
            Ab Premium Plus verfügbar — im aktuell gebuchten Paket noch nicht enthalten.
          </p>
          <Link href={`/dashboard/events/${id}/billing`} className="btn btn-primary">
            Paket ansehen
          </Link>
        </div>
      </main>
    );
  }

  const galleryItems = await prisma.galleryItem.findMany({
    where: { eventId: id, status: "APPROVED", media: { type: "IMAGE" } },
    include: { media: true },
    orderBy: { createdAt: "desc" },
  });

  const photos = galleryItems.map((item) => ({
    mediaId: item.mediaId,
    url: item.media.url,
    thumbnailUrl: item.media.thumbnailUrl,
    mimeType: item.media.mimeType,
    uploaderName: item.media.uploaderName,
  }));

  // Gegen aktuell noch gueltige (freigegebene, IMAGE-) Fotos abgleichen —
  // seit dem letzten Speichern versteckte/geloeschte Fotos fallen dabei
  // automatisch aus der Auswahl, ohne separate Aufraeum-Logik.
  const validMediaIds = new Set(photos.map((p) => p.mediaId));
  const savedOrder: string[] = event.photobookMediaIds ? JSON.parse(event.photobookMediaIds) : [];
  const initialSelectedIds = savedOrder.filter((mediaId) => validMediaIds.has(mediaId));

  const eventDateLabel = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 100px" }}>
      <Link href={`/dashboard/events/${id}`} className="studio-back">
        ← Zurück
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginTop: 20, marginBottom: 6 }}>Gästefotobuch</h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 4 }}>
        Wählt aus euren freigegebenen Gäste-Fotos aus, bringt sie in die gewünschte Reihenfolge und ladet euer
        persönliches Erinnerungs-Fotobuch als PDF herunter.
      </p>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 24 }}>
        Deckblatt: {event.title} · {eventDateLabel}. Nur Fotos im JPEG-/PNG-Format lassen sich ins PDF einbetten —
        andere Formate sind ausgegraut.
      </p>

      {sp.saved === "1" && (
        <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "10px 14px", fontSize: 13, marginBottom: 20 }}>
          Auswahl gespeichert.
        </div>
      )}

      {photos.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "var(--ink-faint)" }}>
          Noch keine freigegebenen Gäste-Fotos. Sobald in der{" "}
          <Link href={`/dashboard/events/${id}/memories`} style={{ color: "var(--terracotta-dark)" }}>
            Galerie
          </Link>{" "}
          Fotos freigegeben sind, könnt ihr sie hier fürs Fotobuch auswählen.
        </p>
      ) : (
        <form action={savePhotobookSelection.bind(null, id)}>
          <PhotobookPicker photos={photos} initialSelectedIds={initialSelectedIds} />
          <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }}>
            Auswahl speichern
          </button>
        </form>
      )}

      {initialSelectedIds.length > 0 && (
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
          <a href={`/dashboard/events/${id}/photobook/pdf`} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            PDF generieren ({initialSelectedIds.length} {initialSelectedIds.length === 1 ? "Foto" : "Fotos"})
          </a>
          <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 8 }}>
            Öffnet den PDF-Download basierend auf der zuletzt gespeicherten Auswahl. Neue Änderungen an der
            Reihenfolge oben erst nach „Auswahl speichern&rdquo; übernehmen.
          </p>
        </div>
      )}
    </main>
  );
}
