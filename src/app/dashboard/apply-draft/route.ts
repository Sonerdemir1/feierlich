import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { gatedModuleKeys } from "@/app/dashboard/events/actions";
import { defaultTextForCategory } from "@/lib/gallery-templates";
import { TEXT_ELEMENT_KEYS as ELEMENT_STYLE_KEYS, DEFAULT_DRESSCODE_TEXT, DEFAULT_SOCIAL_MEDIA_TEXT } from "@/lib/text-style";
import { WISHLIST_TYPES, defaultWishlistItems, type WishlistItemType } from "@/lib/wishlist";
import { defaultAgendaItems } from "@/lib/agenda";

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

// Aus der zentralen Liste gebaut statt einer eigenen, unabhaengig gepflegten
// Kopie — genau so eine Kopie war in buildDesignUpdate() (design-style.ts)
// bereits um "location" veraltet, siehe Schritt 3.
const TEXT_ELEMENT_KEYS = new Set<string>(ELEMENT_STYLE_KEYS);
const STYLE_FIELDS = new Set(["size", "color", "fontId", "align", "bold", "underline", "strikethrough", "italic"]);
const MAX_AGENDA_ITEMS = 30;
const MAX_WISHLIST_ITEMS = 30;

function sanitizeStyle(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const entry: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(raw as Record<string, unknown>)) {
    if (STYLE_FIELDS.has(field)) entry[field] = value;
  }
  return Object.keys(entry).length > 0 ? entry : undefined;
}

// Gleiches Vorsichtsprinzip wie sanitizeElements() unten, nur fuer die
// variable Ablaufplan-Liste statt des festen TextElementKey-Sets — siehe
// agenda/route.ts fuer die identische Logik auf der Speicher-Seite.
function sanitizeAgendaItems(raw: unknown): { id: string; time: string; label: string; style?: Record<string, unknown> }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is Record<string, unknown> => Boolean(it) && typeof it === "object")
    .slice(0, MAX_AGENDA_ITEMS)
    .map((it) => ({
      id: typeof it.id === "string" && it.id ? it.id : crypto.randomUUID(),
      time: typeof it.time === "string" ? it.time.slice(0, 50) : "",
      label: typeof it.label === "string" ? it.label.slice(0, 200) : "",
      style: sanitizeStyle(it.style),
    }));
}

// Gleiches Vorsichtsprinzip, fuer die Wunschliste (Schritt 4) — echte
// WishlistItem-Zeilen statt eines JSON-Bags, siehe wishlist/route.ts fuer
// die identische Logik auf der Speicher-Seite.
//
// WICHTIG (Bugfix nach Schritt 6): Anders als beim Speichern eines bereits
// EXISTIERENDEN Events (wishlist/route.ts) — wo die vom Client mitgeschickte
// id absichtlich uebernommen wird, damit die lokale Auswahl im Editor einen
// Speichervorgang uebersteht — muss hier IMMER eine frische id erzeugt
// werden. defaultWishlistItems() (lib/wishlist.ts) liefert fuer den
// unangetasteten Standard-Warenkorb bewusst FESTE ids ("wishlist-1" usw.),
// damit sie ueber Re-Renders des anonymen Customizers hinweg stabil bleiben
// (siehe Kommentar dort) — genau diese festen ids wuerden aber, wenn sie
// hier 1:1 in eine neue WishlistItem-Zeile uebernommen werden, mit den
// gleich benannten Zeilen JEDES ANDEREN Kunden kollidieren, der ebenfalls
// die Standard-Wunschliste unangetastet liess (WishlistItem.id ist global
// eindeutig ueber ALLE Events hinweg, kein Bag wie bei agendaJson). Ein
// echter Prisma-P2002-Fehler beim zweiten Signup mit Standard-Wunschliste
// war die Folge. Da hier ohnehin eine BRANDNEUE DB-Zeile entsteht, hat eine
// vom Client mitgeschickte id keinen Nutzen mehr — deshalb wird sie bewusst
// nie uebernommen, unabhaengig davon, ob sie zufaellig oder fest war.
function sanitizeWishlistItems(raw: unknown): { id: string; type: WishlistItemType; title: string; description: string | null; url: string | null }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is Record<string, unknown> => Boolean(it) && typeof it === "object")
    .slice(0, MAX_WISHLIST_ITEMS)
    .map((it) => ({
      id: crypto.randomUUID(),
      type: WISHLIST_TYPES.includes(it.type as WishlistItemType) ? (it.type as WishlistItemType) : "GIFT",
      title: (typeof it.title === "string" ? it.title : "").slice(0, 200),
      description: typeof it.description === "string" && it.description.trim() ? it.description.slice(0, 500) : null,
      url: typeof it.url === "string" && it.url.trim() ? it.url.slice(0, 500) : null,
    }))
    .filter((it) => it.title.trim().length > 0);
}

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
  const locationText = typeof draft.locationText === "string" && draft.locationText.trim() ? draft.locationText.trim() : null;
  // draft.locationText ist eine per Places-Autocomplete gesuchte Adresse,
  // kein eigener Saal-Name (den kennt der anonyme Customizer nicht) — wird
  // trotzdem zusaetzlich in locationName gespiegelt, weil die "Ort"-Sektion
  // auf der echten Event-Seite nur rendert, wenn locationName gesetzt ist
  // (siehe e/[slug]/page.tsx).
  const locationName = locationText;
  const locationAddress = locationText;
  const locationLat = typeof draft.locationLat === "number" ? draft.locationLat : null;
  const locationLng = typeof draft.locationLng === "number" ? draft.locationLng : null;

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

  // Bugfix: ein komplett unangetasteter Entwurf enthaelt fuer Ablaufplan/
  // Wunschliste weiterhin die erfundenen Beispieleintraege aus
  // defaultAgendaItems()/defaultWishlistItems() (Kunde hat den Bereich nie
  // geoeffnet) — die duerfen NICHT als echte Angaben auf der oeffentlichen
  // Einladungsseite landen ("Sektempfang 16:00" etc., "Geschirr-Set" etc.).
  // Deshalb wird hier explizit gegen den Default verglichen (Zeit/
  // Beschriftung bzw. Typ/Titel/Beschreibung/Link, ohne die instabile id)
  // und bei exakter Uebereinstimmung verworfen, statt die erfundenen Werte
  // in ein echtes Event zu uebernehmen.
  function isUnchangedAgenda(items: { time: string; label: string; style?: Record<string, unknown> }[]): boolean {
    const def = defaultAgendaItems();
    if (items.length !== def.length) return false;
    return items.every((it, i) => it.time === def[i].time && it.label === def[i].label && !it.style);
  }
  function isUnchangedWishlist(items: { type: WishlistItemType; title: string; description: string | null; url: string | null }[]): boolean {
    const def = defaultWishlistItems();
    if (items.length !== def.length) return false;
    return items.every(
      (it, i) => it.type === def[i].type && it.title === def[i].title && (it.description ?? "") === def[i].description && (it.url ?? "") === def[i].url
    );
  }

  const sanitizedAgendaItems = sanitizeAgendaItems(draft.agendaItems);
  const agendaItems = isUnchangedAgenda(sanitizedAgendaItems) ? [] : sanitizedAgendaItems;
  const sanitizedWishlistItems = sanitizeWishlistItems(draft.wishlistItems);
  const wishlistItems = isUnchangedWishlist(sanitizedWishlistItems) ? [] : sanitizedWishlistItems;

  // guestbook*/wishlist*/music* — reiner Einzeiler-Text, gleiches
  // "leer -> null (eingebauter Standardtext)"-Prinzip wie eventLabel oben.
  // guestbook* fehlte hier bislang komplett (Luecke aus Schritt 3, jetzt bei
  // dieser Gelegenheit mitbehoben, da dieselbe Funktion betroffen ist).
  function textOrNull(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }
  // Gleiches Bugfix-Prinzip wie bei Ablaufplan/Wunschliste oben: Dresscode-
  // und Social-Media-Text sind reiner Freitext ohne "leerer Standard"-Wert
  // (anders als z.B. menuHint/thankYouMessage, die default leer sind) — im
  // anonymen Customizer stehen stattdessen erfundene Beispielwerte
  // (DEFAULT_DRESSCODE_TEXT/DEFAULT_SOCIAL_MEDIA_TEXT). Bleiben sie
  // unveraendert, wuerden sie sonst als echte Angabe des Kunden auf der
  // oeffentlichen Einladungsseite erscheinen.
  function textOrNullUnlessDefault(value: unknown, defaultValue: string): string | null {
    const text = textOrNull(value);
    return text === defaultValue ? null : text;
  }
  const guestbookHeading = textOrNull(draft.guestbookHeading);
  const guestbookHint = textOrNull(draft.guestbookHint);
  const guestbookButtonText = textOrNull(draft.guestbookButtonText);
  const wishlistHeading = textOrNull(draft.wishlistHeading);
  const wishlistHint = textOrNull(draft.wishlistHint);
  const musicHeading = textOrNull(draft.musicHeading);
  const musicHint = textOrNull(draft.musicHint);
  const musicButtonText = textOrNull(draft.musicButtonText);
  const countdownDaysLabel = textOrNull(draft.countdownDaysLabel);
  const countdownHoursLabel = textOrNull(draft.countdownHoursLabel);
  const countdownMinutesLabel = textOrNull(draft.countdownMinutesLabel);
  const calendarSaveText = textOrNull(draft.calendarSaveText);
  const calendarGoogleText = textOrNull(draft.calendarGoogleText);
  const rsvpHeading = textOrNull(draft.rsvpHeading);
  const rsvpYesLabel = textOrNull(draft.rsvpYesLabel);
  const rsvpMaybeLabel = textOrNull(draft.rsvpMaybeLabel);
  const rsvpNoLabel = textOrNull(draft.rsvpNoLabel);
  const rsvpButtonText = textOrNull(draft.rsvpButtonText);
  const seatingHeading = textOrNull(draft.seatingHeading);
  const seatingHint = textOrNull(draft.seatingHint);
  const seatingButtonText = textOrNull(draft.seatingButtonText);
  const galleryHeading = textOrNull(draft.galleryHeading);
  const galleryHint = textOrNull(draft.galleryHint);
  const galleryButtonText = textOrNull(draft.galleryButtonText);
  const dresscodeHeading = textOrNull(draft.dresscodeHeading);
  const dresscodeText = textOrNullUnlessDefault(draft.dresscodeText, DEFAULT_DRESSCODE_TEXT);
  const socialMediaHeading = textOrNull(draft.socialMediaHeading);
  const socialMediaText = textOrNullUnlessDefault(draft.socialMediaText, DEFAULT_SOCIAL_MEDIA_TEXT);
  const menuHeading = textOrNull(draft.menuHeading);
  const menuHint = textOrNull(draft.menuHint);
  const thankYouHeading = textOrNull(draft.thankYouHeading);
  // thankYouMessage liegt NICHT als Event-Spalte vor (siehe Schema-
  // Kommentar) — wird nach dem Event.create() unten separat ins
  // EventModule.config des "thank-you-card"-Moduls geschrieben.
  const thankYouMessage = textOrNull(draft.thankYouMessage);
  const audioInvitationHeading = textOrNull(draft.audioInvitationHeading);
  const audioInvitationHint = textOrNull(draft.audioInvitationHint);
  const videoMessageHeading = textOrNull(draft.videoMessageHeading);
  const videoMessageHint = textOrNull(draft.videoMessageHint);

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
      locationAddress,
      locationLat,
      locationLng,
      colorOverride: JSON.stringify(colorOverrideObj),
      styleJson: JSON.stringify(styleObj),
      agendaJson: agendaItems.length > 0 ? JSON.stringify(agendaItems) : null,
      guestbookHeading,
      guestbookHint,
      guestbookButtonText,
      wishlistHeading,
      wishlistHint,
      musicHeading,
      musicHint,
      musicButtonText,
      countdownDaysLabel,
      countdownHoursLabel,
      countdownMinutesLabel,
      calendarSaveText,
      calendarGoogleText,
      rsvpHeading,
      rsvpYesLabel,
      rsvpMaybeLabel,
      rsvpNoLabel,
      rsvpButtonText,
      seatingHeading,
      seatingHint,
      seatingButtonText,
      galleryHeading,
      galleryHint,
      galleryButtonText,
      dresscodeHeading,
      dresscodeText,
      socialMediaHeading,
      socialMediaText,
      menuHeading,
      menuHint,
      thankYouHeading,
      audioInvitationHeading,
      audioInvitationHint,
      videoMessageHeading,
      videoMessageHint,
      ownerId: session.user.id,
      wishlistItems: wishlistItems.length > 0 ? { create: wishlistItems.map((it, i) => ({ ...it, sortOrder: i })) } : undefined,
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

  // thankYouMessage liegt im EventModule.config des "thank-you-card"-Moduls
  // (siehe Schema-Kommentar) statt einer eigenen Event-Spalte — die Zeile
  // existiert nach dem Upsert oben in jedem Fall bereits (thank-you-card ist
  // Teil von MANAGED_MODULE_KEYS), deshalb genuegt ein einfaches update()
  // statt upsert() hier.
  if (thankYouMessage) {
    const thankYouModule = modules.find((m) => m.key === "thank-you-card");
    if (thankYouModule) {
      await prisma.eventModule.update({
        where: { eventId_moduleId: { eventId: event.id, moduleId: thankYouModule.id } },
        data: { config: JSON.stringify({ message: thankYouMessage }) },
      });
    }
  }

  revalidatePath("/dashboard");
  return Response.json({ ok: true, eventId: event.id });
}
