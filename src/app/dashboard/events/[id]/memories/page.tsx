import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { moderateGalleryItem, moderateGuestbookEntry, analyzeGalleryPhotos, analyzeGuestbookEntries } from "./actions";
import { aiPhotoCurationConfigured } from "@/lib/ai-photo-curation";
import { aiGuestbookCurationConfigured } from "@/lib/ai-guestbook-curation";

const statusLabel: Record<string, string> = { PENDING: "Wartet auf Freigabe", APPROVED: "Freigegeben", HIDDEN: "Ausgeblendet", DELETED: "Gelöscht" };
const statusColor: Record<string, string> = { PENDING: "#B9975B", APPROVED: "#5B7A4E", HIDDEN: "#8A7F6E", DELETED: "#B2543A" };

const verdictLabel: Record<string, string> = { empfehlung: "Empfehlung", unscharf: "Unscharf", duplikat: "Duplikat", ok: "In Ordnung" };
const verdictColor: Record<string, string> = { empfehlung: "#5B7A4E", unscharf: "#B2543A", duplikat: "#8A7F6E", ok: "#B9975B" };
const verdictRank: Record<string, number> = { empfehlung: 0, ok: 1, unscharf: 2, duplikat: 3 };

const guestbookVerdictLabel: Record<string, string> = { unangemessen: "Bitte prüfen", herzlich: "Besonders herzlich", ok: "In Ordnung" };
const guestbookVerdictColor: Record<string, string> = { unangemessen: "#B2543A", herzlich: "#5B7A4E", ok: "#B9975B" };
const guestbookVerdictRank: Record<string, number> = { unangemessen: 0, herzlich: 1, ok: 2 };

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

export default async function MemoriesPage({ params, searchParams }: PageProps<"/dashboard/events/[id]/memories">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  const [galleryItemsRaw, guestbookEntries] = await Promise.all([
    prisma.galleryItem.findMany({ where: { eventId: id, status: { not: "DELETED" } }, include: { media: true }, orderBy: { createdAt: "desc" } }),
    prisma.guestbookEntry.findMany({ where: { eventId: id, status: { not: "DELETED" } }, include: { media: true }, orderBy: { createdAt: "desc" } }),
  ]);

  // PENDING-Fotos mit KI-Empfehlung nach oben, unter sich nach Verdict
  // sortiert — der Rest (bereits moderiert) bleibt danach chronologisch.
  const galleryItems = [...galleryItemsRaw].sort((a, b) => {
    const aPending = a.status === "PENDING" ? 0 : 1;
    const bPending = b.status === "PENDING" ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    if (aPending === 0) {
      const aRank = verdictRank[a.media.aiVerdict ?? ""] ?? 1;
      const bRank = verdictRank[b.media.aiVerdict ?? ""] ?? 1;
      if (aRank !== bRank) return aRank - bRank;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  const pendingPhotoCount = galleryItemsRaw.filter((item) => item.status === "PENDING" && item.media.type === "IMAGE").length;
  const curationError = sp.error === "photo-curation-failed";

  // Gleiches Sortiermuster wie bei den Fotos: PENDING zuerst, darunter nach
  // Verdict (unangemessen ganz oben, damit es nicht in der Menge untergeht).
  const guestbookEntriesSorted = [...guestbookEntries].sort((a, b) => {
    const aPending = a.status === "PENDING" ? 0 : 1;
    const bPending = b.status === "PENDING" ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    if (aPending === 0) {
      const aRank = guestbookVerdictRank[a.aiVerdict ?? ""] ?? 1;
      const bRank = guestbookVerdictRank[b.aiVerdict ?? ""] ?? 1;
      if (aRank !== bRank) return aRank - bRank;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  const pendingMessageCount = guestbookEntries.filter((e) => e.status === "PENDING" && e.message).length;
  const guestbookCurationError = sp.error === "guestbook-curation-failed";

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 28px" }}>
        Gästebuch &amp; Galerie — {event.title}
      </h1>

      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>Galerie ({galleryItems.length})</div>
          {aiPhotoCurationConfigured && pendingPhotoCount > 0 && (
            <form action={analyzeGalleryPhotos.bind(null, id)}>
              <button type="submit" className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: 11.5 }}>
                KI-Fotos sortieren
              </button>
            </form>
          )}
        </div>
        {curationError && (
          <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "10px 14px", fontSize: 12.5, marginBottom: 16 }}>
            Die Foto-Analyse ist gerade nicht verfügbar. Bitte später erneut versuchen.
          </div>
        )}
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
                  {item.media.aiVerdict && (
                    <div
                      title={item.media.aiVerdictReason ?? undefined}
                      style={{ display: "inline-block", fontSize: 10, color: verdictColor[item.media.aiVerdict], fontWeight: 600, border: `1px solid ${verdictColor[item.media.aiVerdict]}55`, padding: "2px 7px", marginBottom: 6 }}
                    >
                      {verdictLabel[item.media.aiVerdict] ?? item.media.aiVerdict}
                    </div>
                  )}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>Gästebuch ({guestbookEntries.length})</div>
          {aiGuestbookCurationConfigured && pendingMessageCount > 0 && (
            <form action={analyzeGuestbookEntries.bind(null, id)}>
              <button type="submit" className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: 11.5 }}>
                KI-Nachrichten sortieren
              </button>
            </form>
          )}
        </div>
        {guestbookCurationError && (
          <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "10px 14px", fontSize: 12.5, marginBottom: 16 }}>
            Die Nachrichten-Analyse ist gerade nicht verfügbar. Bitte später erneut versuchen.
          </div>
        )}
        {guestbookEntries.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Noch keine Nachrichten.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {guestbookEntriesSorted.map((entry) => (
              <div key={entry.id} style={{ border: "1px solid var(--line)", padding: "14px 16px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.authorName}</div>
                  {entry.aiVerdict && (
                    <div
                      title={entry.aiVerdictReason ?? undefined}
                      style={{
                        display: "inline-block",
                        fontSize: 10,
                        color: guestbookVerdictColor[entry.aiVerdict],
                        fontWeight: 600,
                        border: `1px solid ${guestbookVerdictColor[entry.aiVerdict]}55`,
                        padding: "2px 7px",
                        marginTop: 6,
                      }}
                    >
                      {guestbookVerdictLabel[entry.aiVerdict] ?? entry.aiVerdict}
                    </div>
                  )}
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
