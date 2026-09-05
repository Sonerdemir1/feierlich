import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { gatedModuleKeys } from "@/app/dashboard/events/actions";
import { defaultTextForCategory } from "@/lib/gallery-templates";

// Ordnet die tuerkischen Hochzeitssaal-Kategorien und die generischen
// Design-Stil-Kategorien (siehe gallery-templates.ts) je einem echten
// EventType.key zu (Werte aus prisma/seed.ts) — Template.category und
// EventType.category sind zwei unabhaengige Felder ohne direkte DB-
// Verknuepfung, siehe Umsetzungsplan Phase M6.
const EVENT_TYPE_KEY_BY_CATEGORY: Record<string, string> = {
  "Düğün": "hochzeit",
  "Kına Gecesi": "hennaabend",
  "Nişan": "nisan-turkisch",
  "Sünnet": "suennet",
  "Verspielt": "geburtstag",
  "Business Modern": "firmenevent",
};
const DEFAULT_EVENT_TYPE_KEY = "hochzeit"; // Zeitlos/Botanisch/Romantisch/Statement

// Alle Modul-Keys, die der Marketing-Customizer (DesignStudio.tsx) ueberhaupt
// als An/Aus-Schalter anbietet — nur fuer DIESE wird unten eine explizite
// EventModule-Zeile angelegt (auch bei "aus"), damit ein bewusstes
// Ausschalten (z.B. Sitzplan) nicht durch den Vorlagen-Standard (an)
// ueberschrieben wird. Die restlichen Module (Location, Wetter,
// Hintergrundmusik, Gaesteliste, Check-in) kommen im Customizer gar nicht
// vor — dafuer bleibt bewusst keine Zeile, damit der Vorlagen-Standard gilt.
const MANAGED_MODULE_KEYS = new Set([
  "countdown", "rsvp", "seating", "gallery",
  "agenda", "guestbook", "dresscode", "social-media", "menu", "wishlist",
  "music-requests", "thank-you-card", "audio-invitation", "video-invitation",
]);

const TEXT_ELEMENT_KEYS = new Set(["title", "subtitle", "date", "description", "eventLabel", "family"]);
const STYLE_FIELDS = new Set(["size", "color", "fontId", "align", "bold", "underline", "strikethrough", "italic"]);

// Uebernimmt nur bekannte Element-/Stil-Schluessel aus dem ungeprueften
// Client-JSON — gleiches Vorsichtsprinzip wie EDITABLE_FIELDS in
// inline-text/route.ts, damit kein beliebiges JSON in styleJson landet.
function sanitizeElements(raw: unknown): Record<string, Record<string, unknown>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!TEXT_ELEMENT_KEYS.has(key) || !value || typeof value !== "object") continue;
    const entry: Record<string, unknown> = {};
    for (const [field, fieldValue] of Object.entries(value as Record<string, unknown>)) {
      if (STYLE_FIELDS.has(field)) entry[field] = fieldValue;
    }
    if (Object.keys(entry).length > 0) out[key] = entry;
  }
  return out;
}

// Dupliziert bewusst (siehe categorySlug in gallery-templates.ts fuer das
// gleiche Muster) statt aus actions.ts zu importieren — dort nicht exportiert.
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "event"}-${suffix}`;
}

// Erzeugt ein echtes Event aus dem anonymen /gestalten-Entwurf, sobald der
// Kunde sich nach "Design speichern & Konto erstellen" eingeloggt hat —
// aufgerufen von ApplyPendingDraft.tsx (gemountet auf /dashboard), siehe
// Umsetzungsplan Phase M6.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const body = await request.json().catch(() => null);
  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  const draft: Record<string, unknown> | null = body?.draft && typeof body.draft === "object" ? body.draft : null;
  if (!templateId || !draft) return new Response("Ungültige Daten.", { status: 400 });

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) return new Response("Vorlage nicht gefunden.", { status: 404 });

  const eventTypeKey = EVENT_TYPE_KEY_BY_CATEGORY[template.category] ?? DEFAULT_EVENT_TYPE_KEY;
  const eventType = await prisma.eventType.findUnique({ where: { key: eventTypeKey } });
  if (!eventType) return new Response("Eventtyp nicht gefunden.", { status: 500 });

  const title = (typeof draft.text === "string" && draft.text.trim()) || defaultTextForCategory(template.category);
  const eventLabel = typeof draft.eventLabel === "string" && draft.eventLabel.trim() ? draft.eventLabel.trim() : null;
  const familyLeft = typeof draft.familyLeft === "string" && draft.familyLeft.trim() ? draft.familyLeft.trim() : null;
  const familyRight = typeof draft.familyRight === "string" && draft.familyRight.trim() ? draft.familyRight.trim() : null;
  const eventDateRaw = typeof draft.eventDate === "string" ? draft.eventDate : "";
  // Kein Datum im Entwurf gesetzt (im anonymen Customizer optional) — statt
  // die Kontoerstellung deswegen zu blockieren, ein Platzhalter-Datum, das
  // sich im Dashboard jederzeit aendern laesst.
  const eventDate = eventDateRaw ? new Date(eventDateRaw) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const eventTime = typeof draft.eventTime === "string" && draft.eventTime.trim() ? draft.eventTime.trim() : null;
  const locationName = typeof draft.locationText === "string" && draft.locationText.trim() ? draft.locationText.trim() : null;

  const colorOverrideObj: Record<string, string> = {};
  for (const key of ["primary", "accent", "background"] as const) {
    const value = draft[key];
    if (typeof value === "string" && value) colorOverrideObj[key] = value;
  }

  const styleObj: Record<string, unknown> = {};
  const fontId = typeof draft.fontId === "string" ? draft.fontId : "";
  if (fontId && fontId !== "cormorant") styleObj.fontId = fontId;
  if (draft.showOrnaments === true) styleObj.ornaments = true;
  const elements = sanitizeElements(draft.elements);
  if (Object.keys(elements).length > 0) styleObj.elements = elements;

  const desiredModuleKeys = new Set<string>();
  if (draft.showCountdown === true) desiredModuleKeys.add("countdown");
  if (draft.showRsvp === true) desiredModuleKeys.add("rsvp");
  if (draft.showSeating === true) desiredModuleKeys.add("seating");
  if (draft.showGallery === true) desiredModuleKeys.add("gallery");
  const extraFeatures = draft.extraFeatures && typeof draft.extraFeatures === "object" ? (draft.extraFeatures as Record<string, unknown>) : {};
  for (const [key, enabled] of Object.entries(extraFeatures)) {
    if (enabled === true) desiredModuleKeys.add(key);
  }

  const event = await prisma.event.create({
    data: {
      title,
      slug: slugify(title),
      eventTypeId: eventType.id,
      templateId: template.id,
      eventLabel,
      familyLeft,
      familyRight,
      eventDate,
      eventTime,
      locationName,
      colorOverride: JSON.stringify(colorOverrideObj),
      styleJson: JSON.stringify(styleObj),
      ownerId: session.user.id,
    },
  });

  // Gleiche Gating-Regel wie saveModules()/toggleModule() (siehe actions.ts)
  // — per AddOn gesperrte Module (aktuell nur "gallery" ohne bezahltes
  // Foto/Video-Add-on) duerfen auch hier nicht scharfgeschaltet werden.
  const [modules, gated] = await Promise.all([prisma.module.findMany(), gatedModuleKeys(event.id)]);
  await prisma.$transaction(
    modules
      .filter((m) => MANAGED_MODULE_KEYS.has(m.key))
      .map((m) =>
        prisma.eventModule.upsert({
          where: { eventId_moduleId: { eventId: event.id, moduleId: m.id } },
          update: { enabled: desiredModuleKeys.has(m.key) && !gated.has(m.key) },
          create: { eventId: event.id, moduleId: m.id, enabled: desiredModuleKeys.has(m.key) && !gated.has(m.key) },
        })
      )
  );

  revalidatePath("/dashboard");
  return Response.json({ ok: true, eventId: event.id });
}
