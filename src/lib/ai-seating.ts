const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiSeatingConfigured = Boolean(OPENAI_API_KEY);

export type SeatingGuestInput = { id: string; name: string; groupLabel: string | null };
export type SeatingTableInput = { id: string; name: string; availableSeats: number };
export type SeatingAssignment = { tableId: string; guestIds: string[] };

type OpenAiChatResponse = { choices?: Array<{ message?: { content?: string } }> };

// Schlaegt eine Tisch-Zuordnung fuer noch nicht platzierte Gaeste vor —
// haelt Gruppen (groupLabel, z.B. Familie/Haushalt) nach Moeglichkeit
// zusammen und respektiert die freien Plaetze pro Tisch. Das Ergebnis ist
// nur ein Vorschlag: der Aufrufer MUSS ihn serverseitig gegen den
// tatsaechlichen DB-Stand validieren, bevor er uebernommen wird (siehe
// validateSeatingAssignment) — der KI-Antwort wird hier bewusst nicht
// blind vertraut.
export async function suggestSeatingArrangement(
  guests: SeatingGuestInput[],
  tables: SeatingTableInput[]
): Promise<SeatingAssignment[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — der Sitzplan-Assistent ist nicht konfiguriert.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du erstellst einen Sitzplan-Vorschlag fuer eine Feier. Weise jeden Gast genau einem Tisch zu. " +
            "Halte Gaeste mit demselben groupLabel (Familie/Haushalt) nach Moeglichkeit am selben Tisch. " +
            "Ueberschreite niemals availableSeats eines Tisches. Wenn nicht alle Gaeste passen, lass die " +
            "ueberzaehligen einfach weg statt einen Tisch zu ueberfuellen. " +
            'Antworte ausschliesslich als JSON-Objekt: {"assignments": [{"tableId": "...", "guestIds": ["...", ...]}, ...]}. ' +
            "Kein zusaetzlicher Text.",
        },
        {
          role: "user",
          content: JSON.stringify({ guests, tables }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Sitzplan-Vorschlag fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiChatResponse;
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI-Antwort enthielt keinen Text.");

  let parsed: { assignments?: SeatingAssignment[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI-Antwort war kein gueltiges JSON.");
  }
  if (!Array.isArray(parsed.assignments)) throw new Error("OpenAI-Antwort enthielt keine Zuordnungen.");

  return parsed.assignments;
}

export type SeatingValidationResult = { valid: true } | { valid: false; reason: string };

// Serverseitige Pflichtpruefung eines (von der KI oder aus einem
// gespeicherten Vorschlag stammenden) Zuordnungs-Vorschlags gegen den
// aktuellen, tatsaechlichen Stand — nie blind aus dem Modell/Client
// uebernehmen. Prueft: jede Referenz existiert, kein Gast doppelt, keine
// Tisch-Kapazitaet ueberschritten.
export function validateSeatingAssignment(
  assignment: SeatingAssignment[],
  guests: SeatingGuestInput[],
  tables: SeatingTableInput[]
): SeatingValidationResult {
  const guestIds = new Set(guests.map((g) => g.id));
  const tableById = new Map(tables.map((t) => [t.id, t]));
  const seenGuestIds = new Set<string>();

  for (const entry of assignment) {
    const table = tableById.get(entry.tableId);
    if (!table) return { valid: false, reason: `Unbekannter Tisch: ${entry.tableId}` };
    if (!Array.isArray(entry.guestIds)) return { valid: false, reason: "Ungueltiges Format." };

    if (entry.guestIds.length > table.availableSeats) {
      return { valid: false, reason: `Tisch "${table.name}" wurde ueberbucht.` };
    }

    for (const guestId of entry.guestIds) {
      if (!guestIds.has(guestId)) return { valid: false, reason: `Unbekannter Gast: ${guestId}` };
      if (seenGuestIds.has(guestId)) return { valid: false, reason: "Ein Gast wurde mehrfach zugewiesen." };
      seenGuestIds.add(guestId);
    }
  }

  return { valid: true };
}
