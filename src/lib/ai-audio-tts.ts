import { checkAndRecordAiBudget, AUDIO_TTS_COST_ESTIMATE_USD } from "@/lib/ai-budget";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiAudioTtsConfigured = Boolean(OPENAI_API_KEY);

// Modell-Wahl (vor der Umsetzung geprueft und mit dem Nutzer abgestimmt,
// wie angefordert): OpenAIs TTS-Endpoint (/v1/audio/speech) statt eines
// neuen Anbieters — nutzt denselben OPENAI_API_KEY, der im Projekt schon
// fuer Moderation/Bildgenerierung/Text-Assistent laeuft, kein neues Konto
// noetig. "gpt-4o-mini-tts" statt des aelteren "tts-1": guenstiger
// (Token-basiert statt teurer Zeichen-Pauschale) und mit "instructions"-
// Parameter steuerbar. Stimme "marin" (von OpenAI selbst als Qualitaets-
// Empfehlung genannt, klingt warm/natuerlich fuer eine Begruessung) — vom
// Nutzer bestaetigt.
export async function generateSpeechAudio(text: string): Promise<Buffer> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — die KI-Audiobegrüßung ist nicht konfiguriert.");
  }

  // Globaler Kosten-Deckel fuer alle kostenlosen KI-Aufrufe (Missbrauchsschutz,
  // Teil 3) — gleiches Muster wie bei jeder anderen kostenlosen KI-Funktion,
  // siehe ai-budget.ts.
  await checkAndRecordAiBudget(AUDIO_TTS_COST_ESTIMATE_USD);

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "marin",
      input: text,
      response_format: "mp3",
      instructions: "Sprich warm, herzlich und einladend, wie eine persönliche Begrüßung für Hochzeitsgäste — nicht monoton, ruhiges Tempo.",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Sprachgenerierung fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
