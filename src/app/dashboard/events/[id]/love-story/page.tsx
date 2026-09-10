import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateLoveStory, applyLoveStory } from "./actions";
import { aiTextConfigured, LOVE_STORY_ATTEMPT_QUOTA, LOVE_STORY_QUOTA_EXHAUSTED_MESSAGE } from "@/lib/ai-text";
import { AI_BUDGET_EXCEEDED_MESSAGE } from "@/lib/ai-budget-constants";

const errorLabel: Record<string, string> = {
  "love-story-no-input": "Bitte alle vier Fragen beantworten.",
  "love-story-quota": LOVE_STORY_QUOTA_EXHAUSTED_MESSAGE,
  "love-story-failed": "Der Generator ist gerade nicht verfügbar. Bitte später erneut versuchen.",
  "ai-budget": AI_BUDGET_EXCEEDED_MESSAGE,
};

const fieldStyle = { padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5, fontFamily: "inherit" };

export default async function LoveStoryPage({ params, searchParams }: PageProps<"/dashboard/events/[id]/love-story">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  if (!aiTextConfigured) notFound();

  const [latestAttempt, attemptCount] = await Promise.all([
    prisma.loveStoryAttempt.findFirst({ where: { eventId: id }, orderBy: { createdAt: "desc" } }),
    prisma.loveStoryAttempt.count({ where: { eventId: id } }),
  ]);
  const attemptsLeft = Math.max(0, LOVE_STORY_ATTEMPT_QUOTA - attemptCount);

  const errorKey = typeof sp.error === "string" ? sp.error : undefined;
  const justApplied = sp.storyApplied === "1";

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 6px" }}>
        Kennenlerngeschichte — {event.title}
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        Beantwortet vier kurze Fragen — die KI schreibt daraus eine kleine Geschichte, wie ihr euch kennengelernt
        habt, für eure Einladungsseite. Die Vorschau rechts zeigt, wie sie auf der echten Karte wirkt.
      </p>

      {errorKey && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          {errorLabel[errorKey] ?? "Da ist etwas schiefgelaufen."}
        </div>
      )}
      {justApplied && (
        <div style={{ border: "1px solid var(--terracotta)", background: "var(--ivory-2)", color: "var(--ink)", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Übernommen — die Vorschau rechts zeigt die neue Geschichte.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 420px", minWidth: 280 }}>
          <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Eure Antworten</div>
            {attemptsLeft > 0 ? (
              <form action={generateLoveStory.bind(null, id)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Wo/wie habt ihr euch kennengelernt?</span>
                  <textarea name="question1" rows={2} required style={fieldStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Was war euer erster Eindruck voneinander?</span>
                  <textarea name="question2" rows={2} required style={fieldStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Wann wusstet ihr, dass es etwas Besonderes ist?</span>
                  <textarea name="question3" rows={2} required style={fieldStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Ein besonderer gemeinsamer Moment, den ihr nie vergessen werdet?</span>
                  <textarea name="question4" rows={2} required style={fieldStyle} />
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
                    Geschichte vorschlagen
                  </button>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
                    {attemptsLeft} von {LOVE_STORY_ATTEMPT_QUOTA} Vorschlägen übrig
                  </span>
                </div>
              </form>
            ) : (
              <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>{LOVE_STORY_QUOTA_EXHAUSTED_MESSAGE}</p>
            )}
          </div>

          {latestAttempt && (
            <div style={{ border: "1px solid var(--line)", padding: "20px 22px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Letzter Vorschlag</div>
              <p style={{ fontSize: 14, color: "var(--ink)", marginBottom: 18, whiteSpace: "pre-line" }}>{latestAttempt.loveStoryText}</p>
              <form action={applyLoveStory.bind(null, id)}>
                <input type="hidden" name="loveStoryText" value={latestAttempt.loveStoryText} />
                <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
                  Übernehmen
                </button>
              </form>
            </div>
          )}
        </div>

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
