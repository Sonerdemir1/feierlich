import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";
import { saveDraftMedia, validateDraftVideoFile, validateDraftAudioFile } from "@/lib/uploads";

// Anonyme Upload-Route fuer Umschlag-Video/Hintergrundmusik/Audio-/Video-
// Einladung im Gestalten-Editor (Editor-Konsistenz-Auftrag, Teil A) — vor
// dem Signup gibt es noch kein Event, an das die Datei haengen koennte,
// daher hier ein clientseitig generierter Schluessel (draftId) statt einer
// echten eventId, siehe Media.anonymousDraftId/draftKind (Schema-Kommentar).
// Beim Signup (apply-draft/route.ts) werden diese Zeilen aufs echte Event
// umgehaengt.
//
// Gleiches IP-Zeitfenster-Limit-Muster wie die anonyme Textvorschlag-Route
// (gestalten/suggest-description/route.ts) — hier bewusst STRENGER (8 statt
// 20 pro Stunde), da ein Datei-Upload echte Speicherkosten verursacht,
// waehrend ein einzelner Text-Vorschlag nur einen kleinen Bruchteil eines
// Cents kostet.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_PER_IP = 8;
const hits = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_PER_IP;
}

type DraftKind = "envelope-video" | "background-music" | "audio-invitation" | "video-message";
const KIND_VALIDATOR: Record<DraftKind, (f: FormDataEntryValue | null) => ReturnType<typeof validateDraftVideoFile>> = {
  "envelope-video": validateDraftVideoFile,
  "video-message": validateDraftVideoFile,
  "background-music": validateDraftAudioFile,
  "audio-invitation": validateDraftAudioFile,
};
const KIND_MEDIA_TYPE: Record<DraftKind, "VIDEO" | "AUDIO"> = {
  "envelope-video": "VIDEO",
  "video-message": "VIDEO",
  "background-music": "AUDIO",
  "audio-invitation": "AUDIO",
};

// draftId wird Teil des Speicherpfads (siehe saveDraftMedia) — nur ein
// crypto.randomUUID()-foermiger Wert wird akzeptiert, damit hier niemand
// per praepariertem Wert aus dem Upload-Verzeichnis ausbrechen kann.
const DRAFT_ID_PATTERN = /^[a-z0-9-]{10,80}$/i;

// Kein Cron-Job im Projekt vorhanden (siehe Recherche zum Missbrauchsschutz-
// Schritt) — statt neuer Infrastruktur laeuft die Aufraeumung als Nebeneffekt
// echter Anfragen an diese Route: verwaiste anonyme Entwurfs-Uploads (nie zu
// einem echten Event geworden) werden geloescht, sobald sie aelter als 7
// Tage sind. Bewusst NICHT awaited (fire-and-forget, siehe Kommentar am
// Aufruf) — verzoegert die eigentliche Upload-Antwort nicht. Das begrenzt
// die STEHENDE Speichermenge unabhaengig von der Upload-Rate auf ungefaehr
// "7 Tage x realistisches Aufkommen" statt unbegrenzt zu wachsen (siehe
// Kosten-Einordnung im Bericht zu diesem Schritt).
async function cleanupExpiredDraftMedia(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const expired = await prisma.media.findMany({
    where: { anonymousDraftId: { not: null }, createdAt: { lt: cutoff } },
    select: { id: true, url: true },
    take: 50,
  });
  for (const m of expired) {
    await deleteObject(m.url).catch((err) => console.error("[upload-media] Aufraeumen fehlgeschlagen:", err));
  }
  if (expired.length > 0) {
    await prisma.media.deleteMany({ where: { id: { in: expired.map((m) => m.id) } } });
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) return new Response("Zu viele Anfragen.", { status: 429 });

  cleanupExpiredDraftMedia().catch(() => {});

  const formData = await request.formData().catch(() => null);
  if (!formData) return new Response("Ungültige Daten.", { status: 400 });

  const draftId = String(formData.get("draftId") ?? "");
  const kindRaw = String(formData.get("kind") ?? "");
  if (!DRAFT_ID_PATTERN.test(draftId)) return new Response("Ungültige Entwurfs-ID.", { status: 400 });
  if (!(kindRaw in KIND_VALIDATOR)) return new Response("Ungültige Art.", { status: 400 });
  const kind = kindRaw as DraftKind;

  const file = formData.get("file");
  const error = KIND_VALIDATOR[kind](file);
  if (error) return Response.json({ ok: false, error }, { status: 400 });

  const { url, mimeType, sizeBytes } = await saveDraftMedia(draftId, file as File);

  // Ersetzt eine evtl. vorherige Datei fuer denselben (Entwurf, Art). Die
  // alte Storage-Datei muss hier AKTIV geloescht werden, nicht der
  // 7-Tage-Aufraeumung ueberlassen werden: der upsert unten ueberschreibt
  // die `url`-Spalte derselben Zeile, wodurch der Zeiger auf die alte Datei
  // sofort verloren geht — die 7-Tage-Query findet danach nur noch die
  // NEUE url dieser Zeile, nie die ueberschriebene alte. Ohne diesen Schritt
  // waeren wiederholte Ersetzungen (z. B. Nutzer probiert mehrere
  // Hintergrundmusik-Dateien nacheinander durch, ohne "Entfernen" zu
  // nutzen) ein dauerhaftes Speicher-Leck, nicht nur ein 7-Tage-Leck.
  const previous = await prisma.media.findUnique({
    where: { anonymousDraftId_draftKind: { anonymousDraftId: draftId, draftKind: kind } },
    select: { url: true },
  });

  await prisma.media.upsert({
    where: { anonymousDraftId_draftKind: { anonymousDraftId: draftId, draftKind: kind } },
    update: { url, mimeType, sizeBytes, type: KIND_MEDIA_TYPE[kind] },
    create: { anonymousDraftId: draftId, draftKind: kind, type: KIND_MEDIA_TYPE[kind], url, mimeType, sizeBytes, status: "APPROVED" },
  });

  if (previous && previous.url !== url) {
    await deleteObject(previous.url).catch((err) => console.error("[upload-media] Alte Datei nicht geloescht:", err));
  }

  return Response.json({ ok: true, url });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const draftId = typeof body?.draftId === "string" ? body.draftId : "";
  const kindRaw = typeof body?.kind === "string" ? body.kind : "";
  if (!DRAFT_ID_PATTERN.test(draftId) || !(kindRaw in KIND_VALIDATOR)) {
    return new Response("Ungültige Daten.", { status: 400 });
  }

  const media = await prisma.media.findUnique({
    where: { anonymousDraftId_draftKind: { anonymousDraftId: draftId, draftKind: kindRaw } },
  });
  if (media) {
    await deleteObject(media.url).catch((err) => console.error("[upload-media] Loeschen fehlgeschlagen:", err));
    await prisma.media.delete({ where: { id: media.id } });
  }

  return Response.json({ ok: true });
}
