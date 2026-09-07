import { FileField } from "@/components/public/FileField";

// Unveraendert aus der frueheren eigenen "Hintergrundmusik"-Karte auf der
// Event-Seite hierher verschoben (Umsetzungsplan Phase 5) — Logik/Actions
// identisch, sitzt jetzt als Tab im Kontext-Panel statt als separate Karte.
export function MusicTab({
  eventId,
  backgroundMusicUrl,
  uploadAction,
  removeAction,
}: {
  eventId: string;
  backgroundMusicUrl: string | null;
  uploadAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
        Gäste schalten den Titel per Button auf der Einladungsseite selbst ein (kein Autoplay) — Modul
        &bdquo;Hintergrundmusik&ldquo; muss dafür aktiviert sein.
      </div>
      {backgroundMusicUrl && <audio src={backgroundMusicUrl} controls style={{ display: "block", marginBottom: 14, width: "100%" }} />}
      <form action={uploadAction} style={{ display: "flex", flexDirection: "column", gap: 10 }} key={eventId}>
        <FileField
          name="file"
          accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg"
          required
          label="Musik auswählen"
          colors={{ primary: "var(--ink)", accent: "var(--terracotta)", background: "var(--ivory)" }}
          autoSubmit
        />
        <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
          {backgroundMusicUrl ? "Titel ersetzen" : "Titel hochladen"}
        </button>
      </form>
      {backgroundMusicUrl && (
        <form action={removeAction} style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            Musik entfernen
          </button>
        </form>
      )}
    </div>
  );
}
