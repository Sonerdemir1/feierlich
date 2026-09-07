// Reine Konstanten OHNE Imports — wird auch von Client-Komponenten
// (DesignStudio.tsx, DesignEditor.tsx) importiert, die den KI-Vorschlag-
// Button und den "X von Y übrig"-Text anzeigen. Ein Import aus ai-text.ts
// selbst wuerde dessen `prisma`-Import in den Browser-Bundle ziehen und den
// Build brechen — exakt dasselbe Muster wie gallery-templates.ts/
// gallery-templates-data.ts, siehe Kommentar dort.
export const AI_TEXT_ATTEMPT_QUOTA = 2;
export const AI_TEXT_QUOTA_EXHAUSTED_MESSAGE = "Kontingent aufgebraucht — weitere Vorschläge folgen bald.";
