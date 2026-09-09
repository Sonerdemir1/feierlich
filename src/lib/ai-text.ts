import { prisma } from "@/lib/prisma";
import { AI_TEXT_ATTEMPT_QUOTA, AI_TEXT_QUOTA_EXHAUSTED_MESSAGE } from "@/lib/ai-text-quota";
import { checkAndRecordAiBudget, TEXT_SUGGESTION_COST_ESTIMATE_USD } from "@/lib/ai-budget";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiTextConfigured = Boolean(OPENAI_API_KEY);

// Re-exportiert aus ai-text-quota.ts (siehe Kommentar dort) — bestehende
// Importe `from "@/lib/ai-text"` (Server Components/Actions) funktionieren
// dadurch unveraendert weiter.
export { AI_TEXT_ATTEMPT_QUOTA, AI_TEXT_QUOTA_EXHAUSTED_MESSAGE };

export type InvitationCopyInput = {
  names: string;
  eventType: string;
  keyDetails: string;
  tone: string;
  // "tr" fuer die tuerkischsprachigen Vorlagen-Kategorien (Düğün/Kına Gecesi/
  // Nişan/Sünnet, siehe TURKISH_CATEGORIES in gallery-templates.ts) — steuert
  // NUR die Antwortsprache der KI, nicht Ton/Struktur. Optional, Default "de"
  // haelt das Verhalten der bestehenden Text-Assistent-Seite unveraendert
  // (die kennt bislang keine Vorlagen-Kategorie).
  language?: "de" | "tr";
};

export type InvitationCopyResult = {
  welcomeText: string;
  description: string;
};

type OpenAiChatResponse = { choices?: Array<{ message?: { content?: string } }> };

function systemPrompt(language: "de" | "tr"): string {
  const languageInstruction =
    language === "tr"
      ? "Du schreibst warme, einladende TUERKISCHE Texte fuer digitale Event-Einladungen " +
        "(Düğün/Hochzeit, Kına Gecesi/Henna-Nacht, Nişan/Verlobung, Sünnet/Beschneidungsfest u.ae.), " +
        "Zielgruppe tuerkisch-/kurdischstaemmige Hochzeitssaal-Kunden. Antworte ausschliesslich auf Tuerkisch."
      : "Du schreibst warme, einladende deutsche Texte fuer digitale Event-Einladungen (Hochzeiten, Geburtstage u.ae.).";
  return (
    `${languageInstruction} ` +
    'Antworte ausschliesslich als JSON-Objekt mit genau den Feldern "welcomeText" (1-2 kurze Saetze, Begruessung fuer die Startseite) ' +
    'und "description" (ein kurzer Absatz, 3-5 Saetze, Beschreibung des Events). Kein Markdown, kein zusaetzlicher Text.'
  );
}

export async function generateInvitationCopy(input: InvitationCopyInput): Promise<InvitationCopyResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — der Text-Assistent ist nicht konfiguriert.");
  }

  // Globaler Kosten-Deckel fuer alle kostenlosen KI-Aufrufe (Missbrauchsschutz,
  // Teil 3) — an dieser zentralen Stelle statt in jedem einzelnen Aufrufer
  // (Dashboard-Assistent, anonyme /gestalten-Route, New-Event-Wizard, ...),
  // siehe ai-budget.ts. Wirft AiBudgetExceededError, wenn Tages-/Monats-
  // Budget ueberschritten wuerde — von den Aufrufern abgefangen.
  await checkAndRecordAiBudget(TEXT_SUGGESTION_COST_ESTIMATE_USD);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt(input.language ?? "de") },
        {
          role: "user",
          content: `Namen: ${input.names}\nAnlass: ${input.eventType}\nStil/Ton: ${input.tone}\nWichtige Details: ${input.keyDetails}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Textgenerierung fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiChatResponse;
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI-Antwort enthielt keinen Text.");

  let parsed: Partial<InvitationCopyResult>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI-Antwort war kein gueltiges JSON.");
  }
  if (!parsed.welcomeText || !parsed.description) {
    throw new Error("OpenAI-Antwort fehlten erwartete Felder.");
  }

  return { welcomeText: parsed.welcomeText, description: parsed.description };
}

export class AiTextQuotaError extends Error {
  constructor() {
    super(AI_TEXT_QUOTA_EXHAUSTED_MESSAGE);
    this.name = "AiTextQuotaError";
  }
}

// Zentrale Stelle fuer "Kontingent pruefen -> generieren -> als AiTextAttempt
// speichern" — vorher stand diese Reihenfolge nur inline in
// text/actions.ts::generateInvitationText(). Jetzt auch von den beiden neuen
// Routen fuer den KI-Vorschlag-Button im Gestalten-/Dashboard-Editor genutzt
// (Teil C: "dieselbe zugrundeliegende Route/Logik... wiederverwenden"),
// damit die Kontingent-Zaehlung an genau einer Stelle passiert statt an drei.
export async function generateAndRecordAttempt(eventId: string, input: InvitationCopyInput): Promise<InvitationCopyResult> {
  const attemptCount = await prisma.aiTextAttempt.count({ where: { eventId } });
  if (attemptCount >= AI_TEXT_ATTEMPT_QUOTA) throw new AiTextQuotaError();

  const result = await generateInvitationCopy(input);

  const prompt = `${input.names} · ${input.eventType} · ${input.tone}${input.keyDetails ? ` · ${input.keyDetails}` : ""}`;
  await prisma.aiTextAttempt.create({
    data: { eventId, prompt, welcomeText: result.welcomeText, description: result.description },
  });

  return result;
}
