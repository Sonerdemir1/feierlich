import { checkAndRecordAiBudget, WEDDING_PORTRAIT_COST_ESTIMATE_USD } from "@/lib/ai-budget";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const weddingPortraitConfigured = Boolean(OPENAI_API_KEY);

// Kostenlos, aber jede Generierung verursacht echte OpenAI-Kosten (gpt-image-2,
// Medium-Qualitaet, ca. $0.04/Bild — deutlich teurer als die bestehenden
// Text-/Moderations-Aufrufe) — ohne Payment-Anbindung in diesem Schritt daher
// ein Kontingent pro Event statt unbegrenzter kostenloser Generierungen,
// gleiches Muster wie AI_TEXT_ATTEMPT_QUOTA/AI_DESIGN_ATTEMPT_QUOTA.
export const WEDDING_PORTRAIT_ATTEMPT_QUOTA = 5;

export type WeddingPortraitStyleKey = "aquarell" | "lineart" | "comic" | "filmposter";

export type WeddingPortraitStyle = {
  key: WeddingPortraitStyleKey;
  label: string;
  description: string;
  promptFragment: string;
  overlayFontFamily: string;
  overlayFontWeight: 400 | 600 | 700;
  overlayUppercase?: boolean;
};

// promptFragment ergaenzt eine gemeinsame Basisanweisung (siehe
// buildPortraitPrompt) — jede Variante beschreibt NUR den Bildstil, die
// Vorgabe "Gesichter/Personen erkennbar erhalten" gilt fuer alle gleich.
// overlayFontFamily waehlt zum jeweiligen Stil passende, bereits im Projekt
// kuratierte Schriften (FONT_OPTIONS, src/lib/fonts.ts) fuer das Namen/Datum-
// Overlay (siehe wedding-portrait-preview.tsx) — reine Typografie-Entscheidung,
// keine neue Schriftart-Recherche noetig.
export const WEDDING_PORTRAIT_STYLES: WeddingPortraitStyle[] = [
  {
    key: "aquarell",
    label: "Aquarell",
    description: "Zartes Aquarell-Gemälde mit weichen Farbverläufen",
    promptFragment:
      "im Stil eines zarten Aquarell-Gemäldes: weiche, ineinander verlaufende Farben, sichtbare Pinselstruktur, " +
      "helles, leicht texturiertes Papier im Hintergrund, romantische, gedämpfte Farbpalette",
    overlayFontFamily: "Great Vibes",
    overlayFontWeight: 400,
  },
  {
    key: "lineart",
    label: "Line-Art",
    description: "Minimalistische Strichzeichnung",
    promptFragment:
      "als elegante Line-Art-Illustration: durchgehende, klare schwarze Linien auf reinweißem Hintergrund, " +
      "keine Farbflächen, keine Schattierung, minimalistisch und reduziert auf das Wesentliche",
    overlayFontFamily: "Manrope",
    overlayFontWeight: 600,
    overlayUppercase: true,
  },
  {
    key: "comic",
    label: "Illustriert/Comic",
    description: "Farbenfrohe Comic-Illustration",
    promptFragment:
      "im Stil einer farbenfrohen Comic-/Illustrations-Zeichnung: kräftige schwarze Umrisslinien, flächige, " +
      "gesättigte Farben, verspielte, leicht überzeichnete Proportionen wie in einer modernen Grafik-Novelle",
    overlayFontFamily: "Poppins",
    overlayFontWeight: 600,
  },
  {
    key: "filmposter",
    label: "Filmposter",
    description: "Dramatisches, romantisches Kinoplakat",
    promptFragment:
      "im Stil eines dramatischen, romantischen Filmposters: filmisches, kontrastreiches Licht, kräftige, " +
      "kinoreife Farbkomposition, als würde das Bild ein Kino-Plakat zieren",
    overlayFontFamily: "Abril Fatface",
    overlayFontWeight: 400,
    overlayUppercase: true,
  },
];

export function weddingPortraitStyleByKey(key: string | null | undefined): WeddingPortraitStyle | null {
  return WEDDING_PORTRAIT_STYLES.find((s) => s.key === key) ?? null;
}

function buildPortraitPrompt(style: WeddingPortraitStyle): string {
  return (
    `Wandle dieses Foto eines Brautpaares in eine künstlerische Illustration ${style.promptFragment}. ` +
    "Wichtig: Die abgebildeten Personen, ihre Gesichtszüge, Positur und Kleidung müssen klar erkennbar bleiben " +
    "— es soll wie eine künstlerische Interpretation genau dieser beiden Personen wirken, nicht wie andere " +
    "Personen. Kein zusätzlicher Text, kein Wasserzeichen, keine Schrift im Bild."
  );
}

type OpenAiImagesEditResponse = { data?: Array<{ b64_json?: string }> };

// Bild-zu-Bild-Bearbeitung ueber denselben Endpoint/dasselbe Modell wie die
// bestehende KI-Design-Funktion (src/lib/ai-design.ts) — dort bereits als
// kosteneffizienteste sinnvolle Wahl recherchiert und produktiv im Einsatz,
// daher hier bewusst uebernommen statt erneut zu evaluieren. Medium-Qualitaet
// haelt die Kosten pro Generierung im selben, bereits akzeptierten Rahmen.
export async function generateWeddingPortraitImage(source: Buffer, mimeType: string, style: WeddingPortraitStyle): Promise<Buffer> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — das KI-Hochzeitsporträt ist nicht konfiguriert.");
  }

  // Globaler Kosten-Deckel fuer alle kostenlosen KI-Aufrufe (Missbrauchsschutz,
  // Teil 3) — siehe ai-budget.ts und gleiche Stelle in ai-text.ts::
  // generateInvitationCopy(). Wirft AiBudgetExceededError bei Ueberschreitung,
  // abgefangen in wedding-portrait/actions.ts.
  await checkAndRecordAiBudget(WEDDING_PORTRAIT_COST_ESTIMATE_USD);

  const form = new FormData();
  form.set("model", "gpt-image-2");
  form.append("image[]", new Blob([new Uint8Array(source)], { type: mimeType }), "image");
  form.set("prompt", buildPortraitPrompt(style));
  form.set("size", "1024x1024");
  form.set("quality", "medium");
  form.set("n", "1");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Bildgenerierung fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiImagesEditResponse;
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI-Antwort enthielt kein Bild.");

  return Buffer.from(b64, "base64");
}
