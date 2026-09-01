import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { moderateGalleryItem, moderateGuestbookEntry } from "./actions";

const statusLabel: Record<string, string> = { PENDING: "Wartet auf Freigabe", APPROVED: "Freigegeben", HIDDEN: "Ausgeblendet", DELETED: "Gelöscht" };
const statusColor: Record<string, string> = { PENDING: "#B9975B", APPROVED: "#5B7A4E", HIDDEN: "#8A7F6E", DELETED: "#B2543A" };

function ModerationButtons({ approve, hide, del }: { approve: () => Promise<void>; hide: () => Promise<void>; del: () => Promise<void> }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <form action={approve}>
        <button type="submit" style={{ fontSize: 11, color: "#5B7A4E", background: "none", border: "1px solid #5B7A4E55", padding: "4px 9px", cursor: "pointer" }}>
          Freigeben
        </button>
      </form>
      <form action={hide}>
        <button type="submit" style={{ fontSize: 11, color: "#8A7F6E", background: "none", border: "1px solid var(--line)", padding: "4px 9px", cursor: "pointer" }}>
          Ausblenden
        </button>
      </form>
      <form action={del}>
        <button type="submit" style={{ fontSize: 11, color: "#B2543A", background: "none", border: "1px solid #B2543A55", padding: "4px 9px", cursor: "pointer" }}>
          Löschen
        </button>
      </form>
    </div>
  );
}

export default async function MemoriesPage({ params }: PageProps<"/dashboard/events/[id]/memories">) {
  const { id } = await params;
  const session = await auth();
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  const [galleryItems, guestbookEntries] = await Promise.all([
    prisma.galleryItem.findMany({ where: { eventId: id, status: { not: "DELETED" } }, include: { media: true }, orderBy: { createdAt: "desc" } }),
    prisma.guestbookEntry.findMany({ where: { eventId: id, status: { not: "DELETED" } }, include: { media: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 28px" }}>
        Gästebuch &amp; Galerie — {event.title}
      </h1>

      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Galerie ({galleryItems.length})</div>
        {galleryItems.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Noch keine Fotos hochgeladen.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {galleryItems.map((item) => (
              <div key={item.id} style={{ border: "1px solid var(--line)" }}>
                {item.media.type === "VIDEO" ? (
                  <video src={item.media.url} controls style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- guest upload, unknown dimensions
                  <img src={item.media.url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                )}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 11, color: statusColor[item.status], fontWeight: 600, marginBottom: 6 }}>{statusLabel[item.status]}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-faint)", marginBottom: 8 }}>{item.media.uploaderName ?? "Anonym"}</div>
                  <ModerationButtons
                    approve={moderateGalleryItem.bind(null, id, item.id, "APPROVED")}
                    hide={moderateGalleryItem.bind(null, id, item.id, "HIDDEN")}
                    del={moderateGalleryItem.bind(null, id, item.id, "DELETED")}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ border: "1px solid var(--line)", padding: "20px 22px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Gästebuch ({guestbookEntries.length})</div>
        {guestbookEntries.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Noch keine Nachrichten.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {guestbookEntries.map((entry) => (
              <div key={entry.id} style={{ border: "1px solid var(--line)", padding: "14px 16px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.authorName}</div>
                  {entry.message && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>{entry.message}</div>}
                  {entry.translatedMessage && (
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4, fontStyle: "italic" }}>
                      Deutsch ({entry.detectedLanguage}): {entry.translatedMessage}
                    </div>
                  )}
                  {entry.media && entry.media.type === "VIDEO" && (
                    <video src={entry.media.url} controls style={{ width: 160, marginTop: 8, display: "block" }} />
                  )}
                  {entry.media && entry.media.type !== "VIDEO" && (
                    // eslint-disable-next-line @next/next/no-img-element -- guest upload, unknown dimensions
                    <img src={entry.media.url} alt="" style={{ width: 100, marginTop: 8, display: "block" }} />
                  )}
                  <div style={{ fontSize: 11, color: statusColor[entry.status], fontWeight: 600, marginTop: 8 }}>{statusLabel[entry.status]}</div>
                </div>
                <ModerationButtons
                  approve={moderateGuestbookEntry.bind(null, id, entry.id, "APPROVED")}
                  hide={moderateGuestbookEntry.bind(null, id, entry.id, "HIDDEN")}
                  del={moderateGuestbookEntry.bind(null, id, entry.id, "DELETED")}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
