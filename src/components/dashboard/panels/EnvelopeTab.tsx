import { FileField } from "@/components/public/FileField";

// Unveraendert aus der frueheren eigenen "Video-Umschlag"-Karte auf der
// Event-Seite hierher verschoben (Umsetzungsplan Phase 5) — Logik/Actions
// identisch, sitzt jetzt als Tab im Kontext-Panel statt als separate Karte.
export function EnvelopeTab({
  eventId,
  envelopeVideoUrl,
  uploadAction,
  removeAction,
}: {
  eventId: string;
  envelopeVideoUrl: string | null;
  uploadAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
        Statt der Standard-Animation spielt beim Antippen euer eigenes Video, danach erscheint die Einladung — Modul
        &bdquo;Video-Einladung&ldquo; muss dafür aktiviert sein.
      </div>
      {envelopeVideoUrl && (
        <div style={{ marginBottom: 14 }}>
          <video src={envelopeVideoUrl} controls style={{ width: "100%", display: "block", border: "1px solid var(--line)" }} />
        </div>
      )}
      <form action={uploadAction} style={{ display: "flex", flexDirection: "column", gap: 10 }} key={eventId}>
        <FileField
          name="file"
          accept="video/mp4,video/quicktime,video/webm"
          required
          label="Video auswählen"
          colors={{ primary: "var(--ink)", accent: "var(--terracotta)", background: "var(--ivory)" }}
          autoSubmit
        />
        <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
          {envelopeVideoUrl ? "Video ersetzen" : "Video hochladen"}
        </button>
      </form>
      {envelopeVideoUrl && (
        <form action={removeAction} style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            Video entfernen
          </button>
        </form>
      )}
    </div>
  );
}
