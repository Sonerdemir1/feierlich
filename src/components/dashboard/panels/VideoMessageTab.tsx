import { FileField } from "@/components/public/FileField";

// Gleiches Muster wie EnvelopeTab.tsx — bewusst ein SEPARATER Upload vom
// Umschlag-Video (envelopeVideoId), siehe Schema-Kommentar zu
// videoMessageId. Erscheint als eigene Sektion weiter unten auf der Seite
// (VideoMessagePlayer.tsx), ersetzt nicht die Umschlag-Oeffnen-Animation.
export function VideoMessageTab({
  eventId,
  videoMessageUrl,
  uploadAction,
  removeAction,
}: {
  eventId: string;
  videoMessageUrl: string | null;
  uploadAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
        Ein eigenständiges Video, das Gäste in einem eigenen Bereich auf der Einladungsseite ansehen können — unabhängig
        vom Umschlag-Video. Modul &bdquo;Video-Einladung&ldquo; muss dafür aktiviert sein.
      </div>
      {videoMessageUrl && (
        <div style={{ marginBottom: 14 }}>
          <video src={videoMessageUrl} controls style={{ width: "100%", display: "block", border: "1px solid var(--line)" }} />
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
          {videoMessageUrl ? "Video ersetzen" : "Video hochladen"}
        </button>
      </form>
      {videoMessageUrl && (
        <form action={removeAction} style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            Video entfernen
          </button>
        </form>
      )}
    </div>
  );
}
