import { FileField } from "@/components/public/FileField";

// Gleiches Muster wie MusicTab.tsx/EnvelopeTab.tsx — Schritt 7: vorher gab
// es fuer "Audio-Einladung" ueberhaupt keine echte Upload-/Wiedergabe-
// Funktion, nur ein dekoratives Mockup im Marketing-Customizer. Anders als
// Hintergrundmusik (Endlosschleife) ist das hier eine einmalige
// Sprachnachricht, siehe AudioMessagePlayer.tsx (kein loop).
export function AudioInvitationTab({
  eventId,
  audioInvitationUrl,
  uploadAction,
  removeAction,
}: {
  eventId: string;
  audioInvitationUrl: string | null;
  uploadAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
        Eine persönliche Sprachnachricht, die Gäste sich auf der Einladungsseite einmalig anhören können — Modul
        &bdquo;Audio-Einladung&ldquo; muss dafür aktiviert sein.
      </div>
      {audioInvitationUrl && <audio src={audioInvitationUrl} controls style={{ display: "block", marginBottom: 14, width: "100%" }} />}
      <form action={uploadAction} style={{ display: "flex", flexDirection: "column", gap: 10 }} key={eventId}>
        <FileField
          name="file"
          accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg"
          required
          label="Audio auswählen"
          colors={{ primary: "var(--ink)", accent: "var(--terracotta)", background: "var(--ivory)" }}
          autoSubmit
        />
        <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
          {audioInvitationUrl ? "Audio ersetzen" : "Audio hochladen"}
        </button>
      </form>
      {audioInvitationUrl && (
        <form action={removeAction} style={{ marginTop: 10 }}>
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            Audio entfernen
          </button>
        </form>
      )}
    </div>
  );
}
