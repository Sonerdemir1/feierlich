import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { readObject } from "@/lib/storage";

// Automatisierte Inhalts-Moderation fuer Gaeste-Uploads (Schritt B) — laeuft
// NUR, wenn der Gast beim Hochladen der "Allgemeinen KI-Verarbeitung"
// zugestimmt hat (siehe hasAiConsent() in lib/ai-consent.ts). Aufgerufen von
// uploadGalleryPhoto() in e/[slug]/actions.ts, dort bewusst NICHT awaited
// (fire-and-forget) — der Gast sieht sein Foto sofort, die Pruefung laeuft
// im Hintergrund weiter, siehe Kommentar dort.
//
// Modell/Kosten (vor der Umsetzung geprueft, wie angefordert): OpenAIs
// dedizierter Moderation-Endpoint (/v1/moderations, Modell
// "omni-moderation-latest") statt eines Chat-Vision-Modells wie beim
// bestehenden Text-Assistenten (gpt-5.4-mini). Zwei Gruende: (1) er nutzt
// die offizielle, bereits vorhandene OpenAI-Kategorienstruktur (sexual,
// violence, hate, ...) statt dass hier eigene Kategorien erfunden werden
// muessten (Anforderung 3), (2) dieser Endpoint ist laut OpenAI-Doku ohne
// gesonderte Kosten pro Aufruf nutzbar (im Gegensatz zu einem normalen
// Chat-Vision-Aufruf) — also GUENSTIGER als das bestehende Text-Modell,
// nicht teurer. Da die Anweisung eine Rueckfrage nur bei einer "spuerbar
// teureren Groessenordnung" vorsah, wurde direkt umgesetzt, ohne vorher
// nachzufragen — die exakte aktuelle Preisliste sollte trotzdem einmal
// gegen die offizielle OpenAI-Preisseite gegengeprueft werden, da mir keine
// Live-Preisabfrage moeglich ist.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiModerationConfigured = Boolean(OPENAI_API_KEY);

export type ModerationCheckStatus = "pending" | "clean" | "flagged";

// Untermenge von OpenAIs vollstaendiger Kategorienliste (die zusaetzlich
// z.B. "harassment"/"self-harm" kennt) — bewusst auf die drei angeforderten
// Bereiche eingegrenzt (Anforderung 3: explizite/sexuelle Inhalte, Gewalt/
// Blut, Hasssymbole), damit ein Gaeste-Foto nicht wegen einer fuer
// Hochzeits-/Feier-Kontexte irrelevanten Kategorie verschwindet.
const RELEVANT_CATEGORIES = ["sexual", "sexual/minors", "violence", "violence/graphic", "hate", "hate/threatening"] as const;

export const CATEGORY_LABEL_DE: Record<string, string> = {
  sexual: "Sexuelle Inhalte",
  "sexual/minors": "Sexuelle Inhalte (Minderjährige)",
  violence: "Gewalt",
  "violence/graphic": "Gewalt/Blut",
  hate: "Hasssymbole",
  "hate/threatening": "Hasssymbole (bedrohlich)",
};

type OpenAiModerationResponse = {
  results?: Array<{ flagged: boolean; categories?: Record<string, boolean> }>;
};

// Nimmt die rohen Bytes statt der gespeicherten URL entgegen und schickt sie
// als base64-Data-URI — nicht die URL direkt (wie es z.B. analyzePhotos() in
// ai-photo-curation.ts fuer die R2-Produktionsumgebung tut). Grund: lokal
// (kein R2 konfiguriert, siehe storage.ts) ist media.url ein rein lokaler
// "/uploads/..."-Pfad, den OpenAIs Server nicht abrufen koennen ("Could not
// download file at url ..." — live beim ersten Testlauf aufgefallen). Per
// readObject() gelesene Bytes + Data-URI funktionieren unabhaengig vom
// Speicher-Backend (lokal UND R2), sind also robuster als der reine
// URL-Verweis.
async function moderateImageBuffer(bytes: Buffer, mimeType: string): Promise<{ status: "clean" | "flagged"; categories: string[] }> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ist nicht gesetzt — die Moderation ist nicht konfiguriert.");

  const dataUri = `data:${mimeType};base64,${bytes.toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: [{ type: "image_url", image_url: { url: dataUri } }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Moderation fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiModerationResponse;
  const result = json.results?.[0];
  if (!result) throw new Error("OpenAI-Moderation lieferte kein Ergebnis.");

  const categories = RELEVANT_CATEGORIES.filter((c) => result.categories?.[c]);
  return categories.length > 0 ? { status: "flagged", categories } : { status: "clean", categories: [] };
}

// Orchestriert die eigentliche Pruefung + DB-Update + automatisches
// Ausblenden bei "flagged" — vom Aufrufer bewusst NICHT awaited (siehe
// Kommentar oben). Faengt eigene Fehler ab (Anforderung 9: ein API-Fehler
// darf ein Foto niemals automatisch als "flagged" gelten lassen oder
// verschwinden lassen — moderationCheckStatus bleibt in diesem Fall auf
// "pending" stehen, der Fehler wird nur geloggt).
export async function moderateMediaContent(mediaId: string): Promise<void> {
  const media = await prisma.media.findUnique({ where: { id: mediaId }, include: { event: true } });
  if (!media) return;

  // Videos: siehe Anforderung 4 ("3-5 repraesentative Frames"). Eine echte
  // Frame-Extraktion braucht ffmpeg als Systemabhaengigkeit — ffmpeg-static
  // wurde probeweise installiert, aber dessen postinstall-Skript (laedt das
  // Binary herunter) wurde von der Skript-Freigabe-Pruefung dieses Projekts
  // blockiert, dazu 11 hohe/1 kritische Sicherheitswarnung fuer das Paket.
  // Das war keine Entscheidung, die ohne Rueckfrage getroffen werden sollte
  // (neue Binaer-Abhaengigkeit + vom eigenen Tooling blockiert) — deshalb
  // wieder entfernt. Videos bleiben in diesem Schritt UNGEPRUEFT (kein
  // Statuswechsel, bleiben normal sichtbar/im gewohnten PENDING-Ablauf) —
  // siehe Bericht fuer die dazu offene Frage an den Nutzer.
  if (media.type !== "IMAGE") return;

  try {
    const bytes = await readObject(media.url);
    const result = await moderateImageBuffer(bytes, media.mimeType);
    await prisma.media.update({
      where: { id: mediaId },
      data: {
        moderationCheckStatus: result.status,
        moderationCategories: result.categories.length > 0 ? JSON.stringify(result.categories) : null,
        moderationCheckedAt: new Date(),
      },
    });

    if (result.status === "flagged") {
      // Nie ein bereits vom Gastgeber geloeschtes Element "wiederbeleben" —
      // nur HIDDEN erzwingen, wenn es nicht schon DELETED ist. Erzwingt
      // HIDDEN unabhaengig vom aktuellen Status (auch wenn der Gastgeber es
      // in der kurzen Zeitspanne bereits selbst freigegeben haben sollte —
      // Sicherheitsnetz, siehe Anforderung 6).
      const item = await prisma.galleryItem.findUnique({ where: { mediaId } });
      if (item && item.status !== "DELETED" && item.status !== "HIDDEN") {
        await prisma.galleryItem.update({ where: { id: item.id }, data: { status: "HIDDEN" } });
      }
    }

    if (media.event) {
      try {
        revalidatePath(`/e/${media.event.slug}`);
        revalidatePath(`/dashboard/events/${media.eventId}/memories`);
      } catch {
        // revalidatePath ausserhalb des urspruenglichen Request-Kontexts
        // (fire-and-forget, siehe oben) kann in manchen Next.js-Situationen
        // fehlschlagen — die naechste normale Seitenanfrage laedt ohnehin
        // frische Daten, daher hier bewusst kein harter Fehler.
      }
    }
  } catch (err) {
    // Anforderung 9: bei einem Fehler der Pruefung selbst bleibt
    // moderationCheckStatus auf "pending" stehen (so gesetzt vom Aufrufer
    // VOR diesem Aufruf, siehe uploadGalleryPhoto) — kein DB-Schreibzugriff
    // hier, nur Logging.
    console.error(`[ai-moderation] Pruefung fuer Media ${mediaId} fehlgeschlagen:`, err);
  }
}
