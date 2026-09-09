// Getrennt von ai-budget.ts (das prisma + email importiert), damit
// Client-Komponenten (z.B. NewEventWizard.tsx, DesignStudio.tsx) die
// Fehlermeldung/den Fehlertyp importieren koennen, ohne den Server-Code ins
// Client-Bundle zu ziehen — gleiches Muster wie ai-text-quota.ts/ai-text.ts.

// Startwerte (siehe Auftrag, als Beispiel genannt) — bewusst in USD, weil
// die Kostenschaetzungen unten direkt aus OpenAIs USD-Preisen kommen und so
// keine zusaetzliche, ungenaue Waehrungsumrechnung noetig ist. Spaeter
// anpassbar, kein hartkodiertes Limit fuer alle Zeit.
export const AI_FREE_DAILY_BUDGET_USD = 10;
export const AI_FREE_MONTHLY_BUDGET_USD = 150;
export const AI_BUDGET_NOTIFY_RATIO = 0.8;

// Grobe Kostenschaetzungen pro Aufruf (Auftrag: "muss nicht auf den Cent
// genau sein") — Text: gpt-5.4-mini, $0.75/$4.50 pro 1M Input-/Output-
// Tokens, ein Vorschlag braucht real ca. 300-400 Tokens gesamt (~$0.0015-
// 0.002), hier grosszuegig aufgerundet. Hochzeitsportraet: gpt-image-2,
// Medium-Qualitaet, bereits fuer diese Funktion recherchiert (~$0.04,
// siehe ai-wedding-portrait.ts).
export const TEXT_SUGGESTION_COST_ESTIMATE_USD = 0.002;
export const WEDDING_PORTRAIT_COST_ESTIMATE_USD = 0.04;

export const AI_BUDGET_EXCEEDED_MESSAGE = "Momentan überlastet, bitte später erneut versuchen.";

export class AiBudgetExceededError extends Error {
  constructor() {
    super(AI_BUDGET_EXCEEDED_MESSAGE);
    this.name = "AiBudgetExceededError";
  }
}
