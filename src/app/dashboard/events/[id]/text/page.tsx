import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvitationText, applyGeneratedText } from "./actions";
import { aiTextConfigured, AI_TEXT_ATTEMPT_QUOTA } from "@/lib/ai-text";

const errorLabel: Record<string, string> = {
  "ai-text-no-input": "Bitte Namen und Anlass ausfüllen.",
  "ai-text-quota": `Kontingent von ${AI_TEXT_ATTEMPT_QUOTA} Vorschlägen aufgebraucht.`,
  "ai-text-failed": "Der Text-Assistent ist gerade nicht verfügbar. Bitte später erneut versuchen.",
};

const fieldStyle = { padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

export default async function TextAssistantPage({ params, searchParams }: PageProps<"/dashboard/events/[id]/text">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  if (!aiTextConfigured) notFound();

  const [latestAttempt, attemptCount] = await Promise.all([
    prisma.aiTextAttempt.findFirst({ where: { eventId: id }, orderBy: { createdAt: "desc" } }),
    prisma.aiTextAttempt.count({ where: { eventId: id } }),
  ]);
  const attemptsLeft = Math.max(0, AI_TEXT_ATTEMPT_QUOTA - attemptCount);

  const errorKey = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 6px" }}>
        Text-Assistent — {event.title}
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        Ein paar Stichpunkte reichen — die KI schlägt Begrüßungstext und Beschreibung für eure Einladungsseite vor.
      </p>

      {errorKey && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          {errorLabel[errorKey] ?? "Da ist etwas schiefgelaufen."}
        </div>
      )}

      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Angaben</div>
        {attemptsLeft > 0 ? (
          <form action={generateInvitationText.bind(null, id)} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
            <input name="names" placeholder="Namen der Feiernden, z. B. Ayşe & Emre" defaultValue={event.title} required style={fieldStyle} />
            <input name="eventType" placeholder="Anlass, z. B. Hochzeit / Kına-Abend" required style={fieldStyle} />
            <select name="tone" defaultValue="herzlich-leger" style={fieldStyle}>
              <option value="herzlich-leger">Herzlich & leger</option>
              <option value="klassisch-elegant">Klassisch & elegant</option>
              <option value="festlich-opulent">Festlich & opulent</option>
              <option value="modern-minimal">Modern & minimal</option>
            </select>
            <textarea
              name="keyDetails"
              placeholder="Wichtige Details (optional) — z. B. Ort, Datum, Motto, besondere Wünsche"
              rows={3}
              style={{ ...fieldStyle, fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
                Text vorschlagen
              </button>
              <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
                {attemptsLeft} von {AI_TEXT_ATTEMPT_QUOTA} Vorschlägen übrig
              </span>
            </div>
          </form>
        ) : (
          <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>Kontingent von {AI_TEXT_ATTEMPT_QUOTA} Vorschlägen aufgebraucht.</p>
        )}
      </div>

      {latestAttempt && (
        <div style={{ border: "1px solid var(--line)", padding: "20px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Letzter Vorschlag</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase" }}>Begrüßungstext</div>
            <p style={{ fontSize: 14, color: "var(--ink)", marginTop: 4 }}>{latestAttempt.welcomeText}</p>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase" }}>Beschreibung</div>
            <p style={{ fontSize: 14, color: "var(--ink)", marginTop: 4 }}>{latestAttempt.description}</p>
          </div>
          <form action={applyGeneratedText.bind(null, id)}>
            <input type="hidden" name="welcomeText" value={latestAttempt.welcomeText} />
            <input type="hidden" name="description" value={latestAttempt.description} />
            <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
              Übernehmen
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
