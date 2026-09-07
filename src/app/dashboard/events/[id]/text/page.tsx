import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvitationText, applyGeneratedText } from "./actions";
import { aiTextConfigured, AI_TEXT_ATTEMPT_QUOTA, AI_TEXT_QUOTA_EXHAUSTED_MESSAGE } from "@/lib/ai-text";

const errorLabel: Record<string, string> = {
  "ai-text-no-input": "Bitte Namen und Anlass ausfüllen.",
  "ai-text-quota": AI_TEXT_QUOTA_EXHAUSTED_MESSAGE,
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
  const justApplied = sp.textApplied === "1";

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 6px" }}>
        Text-Assistent — {event.title}
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        Ein paar Stichpunkte reichen — die KI schlägt Begrüßungstext und Beschreibung für eure Einladungsseite vor. Die
        Vorschau rechts zeigt, wie beides auf der echten Karte wirkt.
      </p>

      {errorKey && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          {errorLabel[errorKey] ?? "Da ist etwas schiefgelaufen."}
        </div>
      )}
      {justApplied && (
        <div style={{ border: "1px solid var(--terracotta)", background: "var(--ivory-2)", color: "var(--ink)", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Übernommen — die Vorschau rechts zeigt den neuen Text.
        </div>
      )}

      {/* Zweispaltig ab Desktop-Breite (gleiches Umbruchmuster wie
          .customizer-grid/DesignEditor.tsx: flex-wrap statt fester
          Media-Query, Formular bricht auf schmalen Bildschirmen unter die
          Vorschau um statt sie zu verdraengen) — Formular links, echte
          Karten-Vorschau rechts (Teil A: vorher gab es hier ueberhaupt
          keine Vorschau, man sah nicht, wo der Text landet). */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 420px", minWidth: 280 }}>
          <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Angaben</div>
            {attemptsLeft > 0 ? (
              <form action={generateInvitationText.bind(null, id)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input name="names" placeholder="Namen der Feiernden, z. B. Ayşe & Emre" defaultValue={event.title} required style={fieldStyle} />
                <input name="eventType" placeholder="Anlass, z. B. Hochzeit / Kına-Abend" required style={fieldStyle} />
                <div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 8 }}>Stil/Ton</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      { value: "herzlich-leger", label: "Herzlich & leger" },
                      { value: "klassisch-elegant", label: "Klassisch & elegant" },
                      { value: "festlich-opulent", label: "Festlich & opulent" },
                      { value: "modern-minimal", label: "Modern & minimal" },
                      { value: "emotional-bewegend", label: "Emotional & bewegend" },
                    ].map((tone, i) => (
                      <label
                        key={tone.value}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12.5,
                          color: "var(--ink-soft)",
                          padding: "8px 12px",
                          border: "1px solid var(--line)",
                          background: "var(--ivory-2)",
                          cursor: "pointer",
                        }}
                      >
                        <input type="radio" name="tone" value={tone.value} defaultChecked={i === 0} />
                        {tone.label}
                      </label>
                    ))}
                  </div>
                </div>
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
              <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>{AI_TEXT_QUOTA_EXHAUSTED_MESSAGE}</p>
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

        {/* Dieselbe Kartendarstellung wie im Dashboard-Editor (DesignEditor.tsx)
            — echter /e/[slug]-iframe statt einer eigenen Nachbau-Vorschau, damit
            Begrüßungstext/Beschreibung garantiert genauso aussehen wie auf der
            tatsaechlichen Einladungsseite. Server-gerendert (kein "use client"
            hier noetig) — jeder Seitenaufruf (nach "Text vorschlagen" oder nach
            "Übernehmen") laedt einen frischen iframe mit dem aktuellen
            Datenbank-Stand, das erfuellt "Vorschau aktualisiert sich sofort"
            ohne eigenen postMessage-Kanal. */}
        <div style={{ flex: "1 1 320px", minWidth: 260, maxWidth: 400 }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 8 }}>Vorschau der Einladungsseite</div>
          <div className="card" style={{ height: "min(78vh, 820px)", minHeight: 480 }}>
            <iframe title="Vorschau der Einladungsseite" src={`/e/${event.slug}?dashboardPreview=1`} style={{ width: "100%", height: "100%", border: "none" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
