import { aiTextConfigured, generateInvitationCopy } from "@/lib/ai-text";
import { TURKISH_CATEGORIES } from "@/lib/gallery-templates";

// KI-Vorschlag-Button im Beschreibungstext-Panel des anonymen
// Gestalten-Editors (DesignStudio.tsx, Teil C) — VOR dem Signup gibt es noch
// kein Event, daher kann das Kontingent hier nicht wie sonst ueber
// AiTextAttempt/eventId gezaehlt werden. Die 2 kostenlosen Versuche werden
// stattdessen clientseitig im Draft mitgezaehlt (draft.aiDescriptionAttempts,
// genau wie der Rest des anonymen Entwurfs nur in localStorage lebt, siehe
// DesignStudio.tsx) — bewusste Vorgabe fuer diesen Schritt, kein Bug.
//
// Diese Route bleibt deshalb bewusst UNAUTHENTIFIZIERT erreichbar (wie der
// Rest von /gestalten). Damit sie nicht zu einem offenen, kostenpflichtigen
// OpenAI-Proxy fuer Dritte wird, kommt zusaetzlich ein einfaches, rein
// serverseitiges IP-Zeitfenster-Limit dazu — grosszuegiger als das
// clientseitige 2er-Kontingent (das ist die eigentliche UX-Grenze), nur ein
// Schutzboden gegen Script-Missbrauch, kein pro-Nutzer-Kontingent.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_PER_IP = 20;
const hits = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_PER_IP;
}

export async function POST(request: Request) {
  if (!aiTextConfigured) return new Response("Text-Assistent ist nicht konfiguriert.", { status: 500 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) return new Response("Zu viele Anfragen.", { status: 429 });

  const body = await request.json().catch(() => null);
  const names = typeof body?.names === "string" ? body.names.trim().slice(0, 200) : "";
  const category = typeof body?.category === "string" ? body.category : "";
  const eventType = (typeof body?.eventType === "string" ? body.eventType.trim().slice(0, 100) : "") || category || "Feier";
  if (!names) return new Response("Ungültige Daten.", { status: 400 });

  const language = TURKISH_CATEGORIES.has(category) ? "tr" : "de";

  try {
    const result = await generateInvitationCopy({ names, eventType, tone: "herzlich-leger", keyDetails: "", language });
    return Response.json({ ok: true, description: result.description });
  } catch {
    return Response.json({ ok: false, error: "failed" }, { status: 502 });
  }
}
