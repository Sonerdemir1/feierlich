import { FileField } from "@/components/public/FileField";

// Gleiches Muster wie MusicTab.tsx/EnvelopeTab.tsx — Schritt 7: vorher gab
// es fuer "Audio-Einladung" ueberhaupt keine echte Upload-/Wiedergabe-
// Funktion, nur ein dekoratives Mockup im Marketing-Customizer. Anders als
// Hintergrundmusik (Endlosschleife) ist das hier eine einmalige
// Sprachnachricht, siehe AudioMessagePlayer.tsx (kein loop).
//
// Roadmap-Punkt 4: KI-Alternative zur eigenen Aufnahme — liest den
// Beschreibungstext mit einer KI-Stimme vor (siehe generateSpeechAction,
// verdrahtet gegen generateAudioInvitationSpeech() in events/actions.ts).
// Ab Premium Plus (hasAiAccess, eventHasFeature("audio-invitation")).
export function AudioInvitationTab({
  eventId,
  audioInvitationUrl,
  uploadAction,
  removeAction,
  generateSpeechAction,
  aiAudioTtsConfigured,
  hasAiAccess,
  hasDescription,
}: {
  eventId: string;
  audioInvitationUrl: string | null;
  uploadAction: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
  generateSpeechAction: (formData: FormData) => void;
  aiAudioTtsConfigured: boolean;
  hasAiAccess: boolean;
  hasDescription: boolean;
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

      {aiAudioTtsConfigured && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 10 }}>
            Alternative: Lasst eure Beschreibung von einer KI-Stimme vorlesen, statt selbst aufzunehmen.
          </div>
          {!hasAiAccess ? (
            <div style={{ fontSize: 11.5, color: "var(--terracotta-dark)", fontWeight: 600 }}>
              Ab Premium Plus verfügbar — im aktuell gebuchten Paket noch nicht enthalten.
            </div>
          ) : !hasDescription ? (
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
              Trägt zuerst eine Beschreibung ein (Details-Tab) — die wird vorgelesen.
            </div>
          ) : (
            <form action={generateSpeechAction}>
              <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5, width: "100%" }}>
                ✨ Mit KI-Stimme vorlesen lassen
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
