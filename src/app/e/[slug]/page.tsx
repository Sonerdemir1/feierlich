import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PhotoWall } from "@/components/gallery/PhotoWall";
import { GuestbookEntryCard } from "@/components/guestbook/GuestbookEntryCard";
import { GuestNameField } from "@/components/public/GuestNameField";
import { FileField } from "@/components/public/FileField";
import { GOOGLE_MAPS_API_KEY, googleMapsSearchUrl } from "@/lib/google-maps";
import { EditableLocation } from "@/components/public/EditableLocation";
import { EditableAgenda } from "@/components/public/EditableAgenda";
import type { AgendaItem } from "@/lib/agenda";
import { EnvelopeOpen } from "@/components/marketing/EnvelopeOpen";
import { VideoEnvelope } from "@/components/marketing/VideoEnvelope";
import { BackgroundMusicToggle } from "@/components/marketing/BackgroundMusicToggle";
import { HeroCard, type LiveDesignState } from "@/components/public/HeroCard";
import { fontOptionById } from "@/lib/fonts";
import { recordEventView } from "@/lib/analytics";
import { EditableDescription } from "@/components/public/EditableDescription";
import { EditableLoveStory } from "@/components/public/EditableLoveStory";
import { EditableGuestbookText } from "@/components/public/EditableGuestbookText";
import { EditableSectionText } from "@/components/public/EditableSectionText";
import { AudioMessagePlayer } from "@/components/public/AudioMessagePlayer";
import { VideoMessagePlayer } from "@/components/public/VideoMessagePlayer";
import { EditableWishlist } from "@/components/public/EditableWishlist";
import { WISHLIST_TYPE_LABEL, WISHLIST_TYPES, type WishlistItemData } from "@/lib/wishlist";
import { cardTextZone } from "@/lib/card-frames";
import { PHOTO_BACKGROUND } from "@/lib/gallery-templates";
import type { PhotoShape } from "@/lib/photo-shape";
import { elementOverrideStyle, type StyleElements } from "@/lib/text-style";
import { googleCalendarUrl } from "@/lib/ics";
import { isPast } from "@/lib/time";
import { getEventWeather, weatherCodeInfo } from "@/lib/weather";
import { submitRsvp, findSeat, uploadGalleryPhoto, setUploaderName, revokeGalleryMediaConsent, submitGuestbookEntry, submitMusicRequest, confirmCheckIn, checkInGuestByName } from "./actions";
import { AI_CONSENT_GENERAL_TEXT, AI_CONSENT_FACE_TEXT } from "@/lib/ai-consent";
import { eventHasFeature } from "@/lib/event-features";

type TemplateColors = { primary: string; accent: string; background: string };
type TemplateFonts = { display: string; body: string };

const MENU_COURSE_LABEL: Record<string, string> = {
  STARTER: "Vorspeise",
  MAIN: "Hauptgang",
  DESSERT: "Dessert",
  DRINK: "Getränke",
};

async function getEvent(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      eventType: true,
      template: true,
      coverImage: true,
      owner: true,
      envelopeVideo: true,
      backgroundMusic: true,
      audioInvitation: true,
      videoMessage: true,
      order: { include: { package: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  // Persoenliche Einladungsseiten sind privat (per Link/QR geteilt) — nie
  // fuer Suchmaschinen bestimmt, unabhaengig vom Veroeffentlichungsstatus.
  // Betrifft nur die Google/Bing-Indexierung — WhatsApp/Facebook/Instagram
  // lesen die Open-Graph-Daten unten trotzdem fuer die Link-Vorschau aus.
  const robots = { index: false, follow: false };
  if (!event) return { robots };
  const title = `${event.title} – einladi`;
  const description =
    event.description ?? `${event.eventType.name} am ${new Intl.DateTimeFormat("de-DE").format(event.eventDate)}`;
  // Eigenes Titelbild hat Vorrang (am persoenlichsten), sonst das
  // Kartendesign der Vorlage als Vorschaubild — beides sorgt dafuer, dass
  // der Link in WhatsApp/Instagram/Facebook nicht ohne Bild ankommt.
  const previewImage = event.coverImage?.url ?? event.template.previewUrl ?? undefined;
  return {
    title,
    description,
    robots,
    openGraph: {
      title,
      description,
      url: `/e/${event.slug}`,
      siteName: "einladi",
      locale: "de_DE",
      type: "website",
      images: previewImage ? [{ url: previewImage }] : undefined,
    },
    twitter: {
      card: previewImage ? "summary_large_image" : "summary",
      title,
      description,
      images: previewImage ? [previewImage] : undefined,
    },
  };
}

export default async function PublicEventPage({ params, searchParams }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await auth();

  const event = await getEvent(slug);
  if (!event) notFound();

  const isOwner = session?.user?.id === event.ownerId;
  if (event.status !== "PUBLISHED" && !isOwner) notFound();
  // Nur im Dashboard-iframe (Design & Vorschau) UND fuer den Owner aktiv —
  // echte Gaeste bekommen den Query-Param nie zu Gesicht, und selbst wenn,
  // greift die isOwner-Pruefung.
  const editMode = isOwner && sp.dashboardPreview === "1";

  if (!isOwner) {
    await prisma.event.update({ where: { id: event.id }, data: { viewCount: { increment: 1 } } });
    await recordEventView(event.id);
  }

  // Personalisierter Einladungslink (?g=<inviteToken>, siehe Gästeliste im
  // Dashboard) — bekannter Gast wird erkannt, Name vorausgefuellt, und der
  // Aufruf wird als "geoeffnet" vermerkt (nur bei echten Gaesten, nicht
  // wenn der Owner sich selbst die Vorschau ansieht).
  const guestToken = typeof sp.g === "string" ? sp.g : undefined;
  const linkedGuest = guestToken
    ? await prisma.guest.findFirst({ where: { inviteToken: guestToken, eventId: event.id }, include: { checkIn: true } })
    : null;
  if (linkedGuest && !isOwner) {
    await prisma.guest.update({
      where: { id: linkedGuest.id },
      data: {
        openCount: { increment: 1 },
        lastOpenedAt: new Date(),
        firstOpenedAt: linkedGuest.firstOpenedAt ?? new Date(),
      },
    });
  }
  const guestDisplayName = linkedGuest ? `${linkedGuest.firstName}${linkedGuest.lastName ? ` ${linkedGuest.lastName}` : ""}` : undefined;

  const eventModules = await prisma.eventModule.findMany({ where: { eventId: event.id } });
  const enabled = new Map(eventModules.map((em) => [em.moduleId, em.enabled]));
  const modules = await prisma.module.findMany();
  const isModuleOn = (key: string) => {
    const m = modules.find((mm) => mm.key === key);
    if (!m) return false;
    return enabled.get(m.id) ?? true;
  };
  // Tier-Gating (Sitzplan-Suche/Gästebuch/Galerie ab Premium Plus, siehe
  // event-features.ts) — bewusst getrennt von isModuleOn() oben: das ist
  // der An/Aus-Schalter des Gastgebers, das hier ist die tatsaechliche
  // Paket-Berechtigung. Beides muss zutreffen, damit der Abschnitt
  // erscheint. Nur diese drei Module, keine Ausweitung auf andere.
  const hasSeatingAccess = eventHasFeature(event, "seating");
  const hasGalleryAccess = eventHasFeature(event, "gallery");
  const hasGuestbookAccess = eventHasFeature(event, "guestbook");
  const moduleConfig = (key: string): Record<string, unknown> => {
    const m = modules.find((mm) => mm.key === key);
    const em = m ? eventModules.find((e) => e.moduleId === m.id) : undefined;
    if (!em?.config) return {};
    try {
      return JSON.parse(em.config);
    } catch {
      return {};
    }
  };
  // Die Dankeskarte ist inhaltlich erst nach dem Event sinnvoll ("danke,
  // dass ihr da wart") — kein separater Versand-Schritt noetig (passt zum
  // Einseiten-Prinzip), sie erscheint einfach automatisch sobald das
  // Datum vorbei ist.
  const isPastEvent = isPast(event.eventDate);
  const thankYouMessage = String(moduleConfig("thank-you-card").message ?? "").trim();

  // Nur abfragen, wenn ueberhaupt eine Location mit Koordinaten hinterlegt
  // ist — sonst unnoetiger Netzwerk-Request bei jedem Seitenaufruf.
  // getEventWeather liefert selbst null zurueck, solange das Datum zu weit
  // in der Zukunft liegt (echte Vorhersagen gibt es nur fuer ~16 Tage).
  const weather =
    isModuleOn("weather") && event.locationLat != null && event.locationLng != null
      ? await getEventWeather(event.locationLat, event.locationLng, event.eventDate)
      : null;

  const templateColors: TemplateColors = JSON.parse(event.template.colors);
  const templateFonts: TemplateFonts = JSON.parse(event.template.fonts);
  const colors: TemplateColors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  const style: {
    fontId?: string;
    ornaments?: boolean;
    elements?: StyleElements;
    // Uebernommen aus dem anonymen Gestalten-Entwurf beim Signup (siehe
    // apply-draft/route.ts, Bugfix "Foto & Verzierungen gehen verloren") —
    // bei allen Events, die nicht aus einem Entwurf mit gesetzter Foto-Form
    // entstanden (das gesamte bisherige Bestandsangebot), bleiben diese drei
    // undefined und das Verhalten ist exakt wie vorher.
    photoShape?: PhotoShape;
    showFloral?: boolean;
    showPhotoBackground?: boolean;
    sectionOrder?: string[];
  } = event.styleJson ? JSON.parse(event.styleJson) : {};
  // Beschreibung sitzt ausserhalb der Karte (eigener Abschnitt darunter,
  // siehe unten) — bleibt serverseitig berechnet. Titel/Untertitel/Datum/
  // Anlass-Label/Familiennamen werden dagegen jetzt in HeroCard.tsx live
  // (per postMessage) berechnet, siehe initialDesignState weiter unten.
  const descriptionOverride = elementOverrideStyle(style.elements, "description");
  const loveStoryOverride = elementOverrideStyle(style.elements, "loveStoryText");
  const locationOverride = elementOverrideStyle(style.elements, "location");
  const guestbookHeadingOverride = elementOverrideStyle(style.elements, "guestbookHeading");
  const guestbookHintOverride = elementOverrideStyle(style.elements, "guestbookHint");
  const guestbookButtonOverride = elementOverrideStyle(style.elements, "guestbookButtonText");
  const wishlistHeadingOverride = elementOverrideStyle(style.elements, "wishlistHeading");
  const wishlistHintOverride = elementOverrideStyle(style.elements, "wishlistHint");
  const musicHeadingOverride = elementOverrideStyle(style.elements, "musicHeading");
  const musicHintOverride = elementOverrideStyle(style.elements, "musicHint");
  const musicButtonOverride = elementOverrideStyle(style.elements, "musicButtonText");
  const rsvpHeadingOverride = elementOverrideStyle(style.elements, "rsvpHeading");
  const rsvpYesOverride = elementOverrideStyle(style.elements, "rsvpYesLabel");
  const rsvpMaybeOverride = elementOverrideStyle(style.elements, "rsvpMaybeLabel");
  const rsvpNoOverride = elementOverrideStyle(style.elements, "rsvpNoLabel");
  const rsvpButtonOverride = elementOverrideStyle(style.elements, "rsvpButtonText");
  const seatingHeadingOverride = elementOverrideStyle(style.elements, "seatingHeading");
  const seatingHintOverride = elementOverrideStyle(style.elements, "seatingHint");
  const seatingButtonOverride = elementOverrideStyle(style.elements, "seatingButtonText");
  const galleryHeadingOverride = elementOverrideStyle(style.elements, "galleryHeading");
  const galleryHintOverride = elementOverrideStyle(style.elements, "galleryHint");
  const galleryButtonOverride = elementOverrideStyle(style.elements, "galleryButtonText");
  const dresscodeHeadingOverride = elementOverrideStyle(style.elements, "dresscodeHeading");
  const dresscodeTextOverride = elementOverrideStyle(style.elements, "dresscodeText");
  const socialMediaHeadingOverride = elementOverrideStyle(style.elements, "socialMediaHeading");
  const socialMediaTextOverride = elementOverrideStyle(style.elements, "socialMediaText");
  const menuHeadingOverride = elementOverrideStyle(style.elements, "menuHeading");
  const menuHintOverride = elementOverrideStyle(style.elements, "menuHint");
  const thankYouHeadingOverride = elementOverrideStyle(style.elements, "thankYouHeading");
  const thankYouMessageOverride = elementOverrideStyle(style.elements, "thankYouMessage");
  const audioInvitationHeadingOverride = elementOverrideStyle(style.elements, "audioInvitationHeading");
  const audioInvitationHintOverride = elementOverrideStyle(style.elements, "audioInvitationHint");
  const videoMessageHeadingOverride = elementOverrideStyle(style.elements, "videoMessageHeading");
  const videoMessageHintOverride = elementOverrideStyle(style.elements, "videoMessageHint");
  // Eigenes Event-Feld statt StyleElements-Bag (siehe agenda.ts) — jeder
  // Eintrag traegt seinen Stil selbst, kein einzelner globaler "agenda"-Stil.
  const agendaItems: AgendaItem[] = event.agendaJson ? JSON.parse(event.agendaJson) : [];
  const eventLabelText = event.eventLabel || event.eventType.name;
  const hasFamilyNames = Boolean(event.familyLeft || event.familyRight);
  // Echte Schriftart-Wahl aus dem Dashboard-Editor hat Vorrang — ohne
  // gesetztes styleJson faellt es wie bisher auf die automatische
  // Template-Schrift zurueck (Anzeige-/Textschrift des Templates gleich =
  // Body-Schrift nutzen, sonst die Display-Schrift) — fuer die Abschnitte
  // AUSSERHALB der Karte (RSVP, Galerie, ...), die nicht live mitgehen.
  const templateFontFallback: "var(--font-body)" | "var(--font-display)" =
    templateFonts.display === templateFonts.body ? "var(--font-body)" : "var(--font-display)";
  const chosenFont = fontOptionById(style.fontId);
  const headingFont = chosenFont?.cssVar ?? templateFontFallback;
  const initialDesignState: LiveDesignState = {
    colors,
    fontId: style.fontId,
    ornaments: Boolean(style.ornaments),
    elements: style.elements,
    photoShape: style.photoShape,
    showFloral: style.showFloral,
    showPhotoBackground: style.showPhotoBackground,
  };
  // Nur wenn das Event aus einem Gestalten-Entwurf mit gesetzter Foto-Form
  // entstand (siehe oben): das Titelbild wandert dann in die Karte (geformt,
  // ggf. mit Bluetenmuster/Foto-Hintergrund, wie in der Editor-Vorschau)
  // statt als separates grosses Banner darunter zu erscheinen — sonst wuerde
  // dasselbe Foto doppelt auftauchen. Alle bisherigen Events (kein
  // photoShape im styleJson) sind davon unveraendert.
  const useCardPhoto = Boolean(style.photoShape && event.coverImage);
  const photoBackground = PHOTO_BACKGROUND[event.template.layoutKey] ?? null;

  // Abschnitts-Reihenfolge (Bugfix "sectionOrder geht beim Signup verloren")
  // — <main> wird weiter unten auf display:flex/flex-direction:column
  // umgestellt, jeder umsortierbare <section>-Block bekommt per
  // sectionOrderIndex() einen CSS-order-Wert statt seine JSX-Position im
  // Baum zu aendern. Bewusst NICHT die JSX-Struktur der einzelnen (teils
  // sehr umfangreichen) Abschnitte selbst angefasst — das haette ein
  // deutlich riskanteres Refactoring der wichtigsten Seite der App bedeutet.
  // LEGACY_SECTION_ORDER ist die bisherige, fest kodierte Reihenfolge dieser
  // Seite (unveraendert fuer alle BESTEHENDEN Events ohne sectionOrder im
  // styleJson) — bewusst NICHT identisch mit DesignStudio.tsx' eigenem
  // DEFAULT_SECTION_ORDER (dort z.B. rsvp/seating/gallery vor agenda), um
  // das Aussehen jedes bereits bestehenden Events unveraendert zu lassen.
  // Neue, aus einem Entwurf entstandene Events erhalten stattdessen die vom
  // Kunden im Editor gesehene/gewaehlte Reihenfolge.
  const LEGACY_SECTION_ORDER = [
    "agenda", "rsvp", "seating", "menu", "gallery", "guestbook",
    "music-requests", "wishlist", "dresscode", "social-media",
    "audio-invitation", "video-invitation", "thank-you-card",
  ];
  const activeSectionOrder =
    Array.isArray(style.sectionOrder) && style.sectionOrder.length > 0 ? style.sectionOrder : LEGACY_SECTION_ORDER;
  function sectionOrderIndex(key: string): number {
    const idx = activeSectionOrder.indexOf(key);
    return 100 + (idx === -1 ? activeSectionOrder.length : idx);
  }
  const envelopeImages: string[] | null = event.template.envelopeSequenceUrls
    ? JSON.parse(event.template.envelopeSequenceUrls)
    : null;
  // Echtes Karten-Design (siehe Template.previewUrl) — Kartenbild als
  // Rahmen mit dem Text in der vorgesehenen freien Mitte, ersetzt die
  // generische Farbflaeche. Hat Vorrang vor den Eck-Ornamenten (Motiv
  // bringt seinen eigenen Rahmen schon mit).
  const cardImageUrl = event.template.previewUrl;
  const textZone = cardTextZone(event.template.layoutKey);

  // Kommt von einem Tisch-QR-Code (/dashboard/events/[id]/qr/table/[tableId])
  // — eventId-Check verhindert, dass eine fremde tableId aus einem anderen
  // Event hier greift.
  const tischParam = typeof sp.tisch === "string" ? sp.tisch : undefined;
  const uploadTable = tischParam
    ? await prisma.table.findFirst({ where: { id: tischParam, eventId: event.id } })
    : null;

  const rsvpStatus = typeof sp.rsvp === "string" ? sp.rsvp : undefined;
  const seatResult = typeof sp.seat === "string" ? sp.seat : undefined;
  const galleryStatus = typeof sp.gallery === "string" ? sp.gallery : undefined;
  const galleryError = typeof sp.galleryError === "string" ? sp.galleryError : undefined;
  const galleryMediaId = typeof sp.mediaId === "string" ? sp.mediaId : undefined;
  const guestbookStatus = typeof sp.guestbook === "string" ? sp.guestbook : undefined;
  const guestbookError = typeof sp.guestbookError === "string" ? sp.guestbookError : undefined;
  const musicStatus = typeof sp.music === "string" ? sp.music : undefined;
  const musicError = typeof sp.musicError === "string" ? sp.musicError : undefined;

  const [galleryItems, guestbookEntries, wishlistItems, menuItems] = await Promise.all([
    isModuleOn("gallery") && hasGalleryAccess
      ? prisma.galleryItem.findMany({
          where: { eventId: event.id, status: "APPROVED" },
          include: { media: { include: { photoTags: { include: { guest: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 24,
        })
      : Promise.resolve([]),
    isModuleOn("guestbook") && hasGuestbookAccess
      ? prisma.guestbookEntry.findMany({ where: { eventId: event.id, status: "APPROVED" }, include: { media: true }, orderBy: { createdAt: "desc" }, take: 30 })
      : Promise.resolve([]),
    isModuleOn("wishlist")
      ? prisma.wishlistItem.findMany({ where: { eventId: event.id }, orderBy: [{ type: "asc" }, { sortOrder: "asc" }] })
      : Promise.resolve([]),
    isModuleOn("menu")
      ? prisma.menuItem.findMany({ where: { eventId: event.id }, orderBy: [{ course: "asc" }, { sortOrder: "asc" }] })
      : Promise.resolve([]),
  ]);

  // Roadmap-Punkt 6: von suggestThankYouCard() ausgewaehlte Fotos fuer die
  // Dankeskarte — nur geladen, wenn die Sektion ueberhaupt sichtbar sein
  // koennte (isPastEvent/editMode, wie beim Text selbst).
  const thankYouPhotoIdList: string[] = event.thankYouPhotoIds ? JSON.parse(event.thankYouPhotoIds) : [];
  const thankYouPhotosRaw =
    thankYouPhotoIdList.length > 0 && isModuleOn("thank-you-card") && (isPastEvent || editMode)
      ? await prisma.media.findMany({ where: { id: { in: thankYouPhotoIdList } } })
      : [];
  const thankYouPhotos = thankYouPhotoIdList
    .map((mid) => thankYouPhotosRaw.find((m) => m.id === mid))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const wishlistItemsData: WishlistItemData[] = wishlistItems.map((w) => ({
    id: w.id,
    type: w.type,
    title: w.title,
    description: w.description ?? "",
    url: w.url ?? "",
  }));

  // Fuer PhotoWall/PhotoTagger auf ein schlankes Format reduziert, statt die
  // volle Prisma-Struktur (media.photoTags[].guest) durchzureichen.
  const galleryPhotos = galleryItems.map((item) => ({
    id: item.id,
    mediaId: item.mediaId,
    url: item.media.url,
    type: item.media.type,
    tags: item.media.photoTags.map((pt) => ({ id: pt.guest.id, firstName: pt.guest.firstName })),
  }));

  const taggedGuestCounts = new Map<string, { firstName: string; count: number }>();
  for (const photo of galleryPhotos) {
    for (const tag of photo.tags) {
      const entry = taggedGuestCounts.get(tag.id);
      if (entry) entry.count += 1;
      else taggedGuestCounts.set(tag.id, { firstName: tag.firstName, count: 1 });
    }
  }
  const taggedGuests = [...taggedGuestCounts.entries()]
    .map(([id, v]) => ({ id, firstName: v.firstName, count: v.count }))
    .sort((a, b) => a.firstName.localeCompare(b.firstName, "de"));

  const eventLocationText = [event.locationName, event.locationAddress].filter(Boolean).join(", ") || undefined;
  const calendarUrl = googleCalendarUrl({
    title: event.title,
    description: event.description ?? `${event.eventType.name} · einladi`,
    location: eventLocationText,
    date: event.eventDate,
    time: event.eventTime,
  });

  const uploadErrorLabel: Record<string, string> = {
    "no-file": "Bitte eine Datei auswählen.",
    "bad-type": "Nur JPG, PNG, WEBP, GIF, MP4, MOV oder WEBM sind erlaubt.",
    "too-large": "Datei ist zu groß (max. 8 MB für Fotos, 100 MB für Videos).",
    "no-name": "Bitte gib deinen Namen an.",
    "no-song": "Bitte Song und Interpret angeben.",
  };
  const mediaAccept = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";

  // Hero-Inhalt (Anlass-Label, Namen, Familiennamen, Datum, Countdown) lebt
  // jetzt in HeroCard.tsx (Client-Komponente) statt hier als reines
  // Server-JSX — haelt Farben/Schriftart/Verzierungen/Feinsteuerung in
  // lokalem State, den DesignEditor.tsx im Dashboard per postMessage live
  // aktualisiert, ohne dass dieser iframe neu laedt.
  const heroInner = (
    <HeroCard
      eventId={event.id}
      eventSlug={event.slug}
      title={event.title}
      subtitle={event.subtitle}
      familyLeft={event.familyLeft}
      familyRight={event.familyRight}
      eventDate={event.eventDate}
      eventTime={event.eventTime}
      eventLabelText={eventLabelText}
      eventLabelRaw={event.eventLabel}
      eventTypeDefaultLabel={event.eventType.name}
      editMode={editMode}
      cardImageUrl={cardImageUrl}
      envelopeImages={envelopeImages}
      textZone={textZone}
      hasFamilyNames={hasFamilyNames}
      calendarUrl={calendarUrl}
      countdownOn={isModuleOn("countdown")}
      templateFontFallback={templateFontFallback}
      initial={initialDesignState}
      countdownDaysLabel={event.countdownDaysLabel ?? "TAGE"}
      countdownHoursLabel={event.countdownHoursLabel ?? "STD"}
      countdownMinutesLabel={event.countdownMinutesLabel ?? "MIN"}
      calendarSaveText={event.calendarSaveText ?? "In Kalender speichern"}
      calendarGoogleText={event.calendarGoogleText ?? "Google Kalender"}
      coverImageUrl={useCardPhoto ? (event.coverImage?.url ?? null) : null}
      photoBackground={photoBackground}
    />
  );

  // Ganzseitiger Hintergrund, der das gewaehlte Kartendesign aufgreift —
  // vorher stand die eigentliche Kartengrafik als kleine Box in einer
  // flachen Farbflaeche, Rand links/rechts wirkte leer. Direkt als
  // Hintergrund von <main> selbst (statt ein separates fixed-Element mit
  // negativem z-index — das laesst sich zuverlaessig hinter jeglichen
  // unpositionierten Inhalt stacken, ohne von CSS-Stacking-Kontext-Regeln
  // eines Vorfahren ausgehebelt zu werden). Bei Vorlagen mit echter
  // Kartengrafik (cardImageUrl) wird sie grossflaechig, mit der
  // Vorlagenfarbe abgetoent, eingeblendet. Vorlagen ohne Kartengrafik
  // (z. B. schlichte Business-Designs) bekommen ein dezentes Vignette in
  // der Akzentfarbe, statt komplett flach zu wirken.
  const pageBackground = cardImageUrl
    ? `linear-gradient(${colors.background}D9, ${colors.background}D9), url(${cardImageUrl})`
    : `radial-gradient(120% 90% at 50% 0%, ${colors.accent}26, transparent 65%)`;

  // Personal-Ansicht am Eingang (dedizierter CHECK_IN-QR-Code, siehe
  // qr/[type]/route.ts) — bewusst eine eigene, schlanke Seite statt
  // innerhalb des vollen Gaeste-Layouts: Personal an der Tuer ist nicht im
  // Dashboard eingeloggt, braucht nur die Namenssuche, nichts sonst von
  // der Einladungsseite.
  if (sp.checkin === "staff") {
    if (!isModuleOn("check-in")) notFound();
    const result = typeof sp.result === "string" ? sp.result : undefined;
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.background, color: colors.primary, padding: 24 }}>
        <div style={{ maxWidth: 360, width: "100%", border: `1px solid ${colors.accent}55`, padding: "28px 26px", textAlign: "center" }}>
          <div style={{ fontFamily: headingFont, fontSize: 20, marginBottom: 18 }}>Check-in — {event.title}</div>
          {result && (
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
              {result === "notfound" ? "Kein Gast mit diesem Namen gefunden." : `${decodeURIComponent(result)} ist eingecheckt.`}
            </p>
          )}
          <form action={checkInGuestByName.bind(null, event.id, event.slug)} style={{ display: "flex", gap: 8 }}>
            <input
              name="checkinName"
              placeholder="Name des Gasts"
              required
              autoFocus
              style={{ flex: 1, padding: "12px 14px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13.5 }}
            />
            <button type="submit" style={{ padding: "0 18px", background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Einchecken
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        color: colors.primary,
        fontFamily: "var(--font-body)",
        backgroundColor: colors.background,
        backgroundImage: pageBackground,
        backgroundSize: cardImageUrl ? "cover" : undefined,
        backgroundPosition: cardImageUrl ? "center" : undefined,
        backgroundAttachment: cardImageUrl ? "fixed" : undefined,
        // display:flex + order pro Abschnitt (statt die JSX-Reihenfolge
        // selbst zu aendern) traegt die Abschnitts-Reihenfolge aus dem
        // Gestalten-Entwurf, siehe sectionOrderIndex() oben — deutlich
        // risikoaermer als ein Umbau der Render-Struktur dieser Seite.
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isOwner && event.status !== "PUBLISHED" && (
        <div style={{ order: 0, background: "#211C19", color: "#FAF6EF", textAlign: "center", padding: "8px 16px", fontSize: 12 }}>
          Vorschau — dieses Event ist noch nicht veröffentlicht. Nur du siehst diesen Hinweis.
        </div>
      )}

      <section style={{ order: 1, padding: "72px 28px 48px", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        {isModuleOn("video-invitation") && event.envelopeVideo ? (
          <VideoEnvelope videoUrl={event.envelopeVideo.url} primary={colors.primary}>
            {heroInner}
          </VideoEnvelope>
        ) : envelopeImages ? (
          heroInner
        ) : (
          <EnvelopeOpen background={colors.background} accent={colors.accent} primary={colors.primary}>
            {heroInner}
          </EnvelopeOpen>
        )}
      </section>

      {isModuleOn("background-music") && event.backgroundMusic && (
        <BackgroundMusicToggle url={event.backgroundMusic.url} accent={colors.accent} background={colors.background} />
      )}

      {event.coverImage && !useCardPhoto && (
        <div style={{ order: 3, maxWidth: 640, margin: "0 auto 48px", padding: "0 28px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user upload, unknown dimensions */}
          <img src={event.coverImage.url} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      )}

      {editMode ? (
        <section style={{ order: 4, maxWidth: 560, margin: "0 auto", padding: "0 28px 48px", textAlign: "center" }}>
          <EditableDescription
            eventId={event.id}
            value={event.description ?? ""}
            style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...descriptionOverride }}
          />
        </section>
      ) : (
        event.description && (
          <section style={{ order: 4, maxWidth: 560, margin: "0 auto", padding: "0 28px 48px", textAlign: "center" }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...descriptionOverride }}>
              {event.description}
            </p>
          </section>
        )
      )}

      {editMode ? (
        <section style={{ order: 4, maxWidth: 560, margin: "0 auto", padding: "0 28px 48px", textAlign: "center" }}>
          <div style={{ fontFamily: headingFont, fontSize: 18, marginBottom: 10, opacity: 0.85 }}>Wie wir uns kennengelernt haben</div>
          <EditableLoveStory
            eventId={event.id}
            value={event.loveStoryText ?? ""}
            style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...loveStoryOverride }}
          />
        </section>
      ) : (
        event.loveStoryText && (
          <section style={{ order: 4, maxWidth: 560, margin: "0 auto", padding: "0 28px 48px", textAlign: "center" }}>
            <div style={{ fontFamily: headingFont, fontSize: 18, marginBottom: 10, opacity: 0.85 }}>Wie wir uns kennengelernt haben</div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...loveStoryOverride }}>
              {event.loveStoryText}
            </p>
          </section>
        )
      )}

      {isModuleOn("location") && (event.locationName || editMode) && (
        <section style={{ order: 5, maxWidth: 480, margin: "0 auto", padding: "0 28px 48px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "24px 26px", textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.accent, marginBottom: 10 }}>
              Ort
            </div>
            {editMode ? (
              <EditableLocation
                initialLocationName={event.locationName}
                initialLocationAddress={event.locationAddress}
                headingStyle={{ fontFamily: headingFont, fontSize: 19, ...locationOverride }}
                addressStyle={{ fontSize: 13, opacity: 0.75, marginTop: 6, color: locationOverride.color }}
              />
            ) : (
              <>
                <div style={{ fontFamily: headingFont, fontSize: 19, ...locationOverride }}>{event.locationName}</div>
                {event.locationAddress && (
                  <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6, color: locationOverride.color }}>{event.locationAddress}</div>
                )}
              </>
            )}
            {(event.locationName || event.locationAddress) &&
              (() => {
                const mapQuery = encodeURIComponent([event.locationName, event.locationAddress].filter(Boolean).join(", "));
                return (
                  <>
                    {GOOGLE_MAPS_API_KEY && (
                      <iframe
                        title="Karte"
                        src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${mapQuery}`}
                        style={{ width: "100%", height: 220, border: "none", marginTop: 16 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    )}
                    <a
                      href={googleMapsSearchUrl([event.locationName, event.locationAddress])}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: 12, fontSize: 12.5, color: colors.accent }}
                    >
                      In Google Maps öffnen →
                    </a>
                  </>
                );
              })()}
          </div>
        </section>
      )}

      {isModuleOn("agenda") && (agendaItems.length > 0 || editMode) && (
        <section style={{ order: sectionOrderIndex("agenda"), maxWidth: 480, margin: "0 auto", padding: "0 28px 48px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "24px 26px", textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.accent, marginBottom: 14 }}>
              Ablaufplan
            </div>
            {editMode ? (
              <EditableAgenda initialItems={agendaItems} baseStyle={{ fontFamily: headingFont, color: colors.primary }} accentColor={colors.accent} />
            ) : (
              <div className="customizer-card-agenda">
                {agendaItems.map((it) => {
                  const override = elementOverrideStyle({ agenda: it.style }, "agenda");
                  return (
                    <div key={it.id} className="customizer-card-agenda-row" style={{ fontFamily: headingFont, color: colors.primary, ...override }}>
                      <span className="customizer-card-agenda-dot" style={{ background: colors.accent }} />
                      <span className="customizer-card-agenda-time" style={{ color: colors.accent }}>
                        {it.time}
                      </span>
                      <span>{it.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {weather && (
        <section style={{ maxWidth: 480, margin: "0 auto", padding: "0 28px 48px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "22px 26px", textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.accent, marginBottom: 10 }}>
              Wetter am {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long" }).format(event.eventDate)}
            </div>
            <div style={{ fontSize: 34, lineHeight: 1 }}>{weatherCodeInfo(weather.code).emoji}</div>
            <div style={{ fontFamily: headingFont, fontSize: 17, marginTop: 8 }}>{weatherCodeInfo(weather.code).label}</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
              {weather.tempMaxC}° / {weather.tempMinC}°
            </div>
          </div>
        </section>
      )}

      {isModuleOn("check-in") && linkedGuest && (
        <section style={{ order: 90, maxWidth: 420, margin: "0 auto", padding: "0 28px 48px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "24px 26px", textAlign: "center" }}>
            {linkedGuest.checkIn ? (
              <>
                <div style={{ fontSize: 22, marginBottom: 8, color: colors.accent }}>✓</div>
                <div style={{ fontFamily: headingFont, fontSize: 16 }}>
                  Eingecheckt um{" "}
                  {new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(linkedGuest.checkIn.checkedInAt)}
                </div>
              </>
            ) : (
              <form action={confirmCheckIn.bind(null, event.id, event.slug, linkedGuest.id)}>
                <button
                  type="submit"
                  style={{ width: "100%", padding: 16, background: colors.accent, color: colors.background, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Jetzt einchecken
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("rsvp") && (
        <section id="rsvp" style={{ order: sectionOrderIndex("rsvp"), maxWidth: 420, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "28px 26px" }}>
            {editMode ? (
              <div style={{ marginBottom: 20 }}>
                <EditableSectionText
                  eventId={event.id}
                  field="rsvpHeading"
                  label="Zusagen-Überschrift"
                  value={event.rsvpHeading ?? "Zusagen"}
                  placeholder="Zusagen"
                  style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", ...rsvpHeadingOverride }}
                />
              </div>
            ) : (
              <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 20, ...rsvpHeadingOverride }}>
                {event.rsvpHeading || "Zusagen"}
              </div>
            )}
            {guestDisplayName && (
              <p style={{ fontSize: 13, textAlign: "center", opacity: 0.8, marginTop: -10, marginBottom: 20 }}>
                Hallo {linkedGuest!.firstName}! Schön, dass ihr dabei seid.
              </p>
            )}

            {rsvpStatus === "success" ? (
              <p style={{ fontSize: 14, textAlign: "center", opacity: 0.85 }}>Danke für eure Rückmeldung!</p>
            ) : (
              <form action={submitRsvp.bind(null, event.id, event.slug)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rsvpStatus === "error" && (
                  <p style={{ fontSize: 12.5, color: "#C9605C" }}>Bitte gib deinen Namen an.</p>
                )}
                <GuestNameField
                  name="name"
                  placeholder="Euer Name"
                  required
                  defaultValue={guestDisplayName}
                  style={{ padding: "12px 14px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13.5 }}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <label style={{ flex: "1 1 100px", display: "flex", alignItems: "center", gap: 6, padding: "10px 0", fontSize: 12.5, cursor: "pointer" }}>
                    {/* disabled im Editor-Modus: ein <label>-Klick auf den
                        Text zum Bearbeiten wuerde sonst immer auch das
                        Radio umschalten (native Label-Verhalten,
                        unabhaengig von Verschachtelung) — harmlos, aber
                        verwirrend beim gezielten Text-Anklicken. */}
                    <input type="radio" name="attending" value="yes" defaultChecked disabled={editMode} />{" "}
                    {editMode ? (
                      <EditableSectionText
                        eventId={event.id}
                        field="rsvpYesLabel"
                        label='"Wir kommen"-Beschriftung'
                        value={event.rsvpYesLabel ?? "Wir kommen"}
                        placeholder="Wir kommen"
                        as="span"
                        style={{ ...rsvpYesOverride }}
                      />
                    ) : (
                      <span style={rsvpYesOverride}>{event.rsvpYesLabel || "Wir kommen"}</span>
                    )}
                  </label>
                  <label style={{ flex: "1 1 100px", display: "flex", alignItems: "center", gap: 6, padding: "10px 0", fontSize: 12.5, cursor: "pointer" }}>
                    <input type="radio" name="attending" value="unsure" disabled={editMode} />{" "}
                    {editMode ? (
                      <EditableSectionText
                        eventId={event.id}
                        field="rsvpMaybeLabel"
                        label='"Noch unsicher"-Beschriftung'
                        value={event.rsvpMaybeLabel ?? "Noch unsicher"}
                        placeholder="Noch unsicher"
                        as="span"
                        style={{ ...rsvpMaybeOverride }}
                      />
                    ) : (
                      <span style={rsvpMaybeOverride}>{event.rsvpMaybeLabel || "Noch unsicher"}</span>
                    )}
                  </label>
                  <label style={{ flex: "1 1 100px", display: "flex", alignItems: "center", gap: 6, padding: "10px 0", fontSize: 12.5, cursor: "pointer" }}>
                    <input type="radio" name="attending" value="no" disabled={editMode} />{" "}
                    {editMode ? (
                      <EditableSectionText
                        eventId={event.id}
                        field="rsvpNoLabel"
                        label='"Leider nicht"-Beschriftung'
                        value={event.rsvpNoLabel ?? "Leider nicht"}
                        placeholder="Leider nicht"
                        as="span"
                        style={{ ...rsvpNoOverride }}
                      />
                    ) : (
                      <span style={rsvpNoOverride}>{event.rsvpNoLabel || "Leider nicht"}</span>
                    )}
                  </label>
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, opacity: 0.8 }}>
                  Anzahl Personen
                  <input
                    type="number"
                    name="count"
                    min={1}
                    max={20}
                    defaultValue={1}
                    style={{ padding: "10px 12px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13.5 }}
                  />
                </label>
                {isModuleOn("menu") && menuItems.some((m) => m.course === "MAIN") && (
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, opacity: 0.8 }}>
                    Menüwunsch
                    <select
                      name="menuChoice"
                      defaultValue=""
                      style={{ padding: "10px 12px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13.5 }}
                    >
                      <option value="">Keine Angabe</option>
                      {menuItems
                        .filter((m) => m.course === "MAIN")
                        .map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                <textarea
                  name="message"
                  placeholder="Nachricht (optional)"
                  rows={2}
                  style={{ padding: "12px 14px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13.5, fontFamily: "inherit" }}
                />
                {editMode ? (
                  <EditableSectionText
                    eventId={event.id}
                    field="rsvpButtonText"
                    label="Zusagen-Button"
                    value={event.rsvpButtonText ?? "Zusage senden"}
                    placeholder="Zusage senden"
                    as="div"
                    style={{
                      marginTop: 6,
                      padding: 14,
                      background: colors.accent,
                      color: colors.background,
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "center",
                      ...rsvpButtonOverride,
                    }}
                  />
                ) : (
                  <button
                    type="submit"
                    style={{ marginTop: 6, padding: 14, background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", ...rsvpButtonOverride }}
                  >
                    {event.rsvpButtonText || "Zusage senden"}
                  </button>
                )}
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("seating") && hasSeatingAccess && (
        <section id="sitzplatz" style={{ order: sectionOrderIndex("seating"), maxWidth: 420, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "28px 26px", textAlign: "center" }}>
            {editMode ? (
              <div style={{ marginBottom: 8 }}>
                <EditableSectionText
                  eventId={event.id}
                  field="seatingHeading"
                  label="Sitzplan-Überschrift"
                  value={event.seatingHeading ?? "Finde deinen Sitzplatz"}
                  placeholder="Finde deinen Sitzplatz"
                  style={{ fontFamily: headingFont, fontSize: 20, ...seatingHeadingOverride }}
                />
              </div>
            ) : (
              <div style={{ fontFamily: headingFont, fontSize: 20, marginBottom: 8, ...seatingHeadingOverride }}>
                {event.seatingHeading || "Finde deinen Sitzplatz"}
              </div>
            )}
            {editMode ? (
              <div style={{ marginBottom: 18 }}>
                <EditableSectionText
                  eventId={event.id}
                  field="seatingHint"
                  label="Sitzplan-Hinweistext"
                  value={event.seatingHint ?? "Gib deinen Namen ein."}
                  placeholder="Gib deinen Namen ein."
                  as="p"
                  style={{ fontSize: 12.5, opacity: 0.75, ...seatingHintOverride }}
                />
              </div>
            ) : (
              <p style={{ fontSize: 12.5, opacity: 0.75, marginBottom: 18, ...seatingHintOverride }}>
                {event.seatingHint || "Gib deinen Namen ein."}
              </p>
            )}
            <form action={findSeat.bind(null, event.id, event.slug)} style={{ display: "flex", gap: 8 }}>
              <GuestNameField
                name="seatName"
                placeholder="Euer Name"
                required
                defaultValue={guestDisplayName}
                style={{ flex: 1, padding: "12px 14px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13.5 }}
              />
              {editMode ? (
                <EditableSectionText
                  eventId={event.id}
                  field="seatingButtonText"
                  label="Sitzplan-Such-Button"
                  value={event.seatingButtonText ?? "Suchen"}
                  placeholder="Suchen"
                  as="div"
                  style={{
                    padding: "0 18px",
                    background: colors.accent,
                    color: colors.background,
                    fontSize: 13,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    ...seatingButtonOverride,
                  }}
                />
              ) : (
                <button
                  type="submit"
                  style={{ padding: "0 18px", background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", ...seatingButtonOverride }}
                >
                  {event.seatingButtonText || "Suchen"}
                </button>
              )}
            </form>
            {seatResult && (
              <p style={{ fontSize: 14, marginTop: 18, fontWeight: 600 }}>
                {seatResult === "notfound" ? "Kein Sitzplatz gefunden." : `Euer Tisch: ${decodeURIComponent(seatResult)}`}
              </p>
            )}
          </div>
        </section>
      )}

      {isModuleOn("menu") && (menuItems.length > 0 || editMode) && (
        <section id="menu" style={{ order: sectionOrderIndex("menu"), maxWidth: 480, margin: "0 auto", padding: "0 28px 72px" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                field="menuHeading"
                label="Menükarte-Überschrift"
                value={event.menuHeading ?? "Menü"}
                placeholder="Menü"
                style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", ...menuHeadingOverride }}
              />
            </div>
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 8, ...menuHeadingOverride }}>
              {event.menuHeading || "Menü"}
            </div>
          )}
          {editMode ? (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <EditableSectionText
                eventId={event.id}
                field="menuHint"
                label="Menükarte-Hinweistext"
                value={event.menuHint ?? ""}
                placeholder="Hinweistext hinzufügen…"
                style={{ fontSize: 13, opacity: 0.75, ...menuHintOverride }}
              />
            </div>
          ) : (
            event.menuHint && (
              <div style={{ textAlign: "center", marginBottom: 20, fontSize: 13, opacity: 0.75, ...menuHintOverride }}>
                {event.menuHint}
              </div>
            )
          )}
          {(["STARTER", "MAIN", "DESSERT", "DRINK"] as const)
            .map((course) => ({ course, items: menuItems.filter((m) => m.course === course) }))
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.course} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.6, marginBottom: 10 }}>
                  {MENU_COURSE_LABEL[group.course]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.items.map((item) => (
                    <div key={item.id} style={{ fontSize: 14 }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      {item.description && <span style={{ opacity: 0.75 }}> — {item.description}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </section>
      )}

      {isModuleOn("gallery") && hasGalleryAccess && (
        <section id="galerie" style={{ order: sectionOrderIndex("gallery"), maxWidth: 640, margin: "0 auto", padding: "0 28px 72px" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                field="galleryHeading"
                label="Galerie-Überschrift"
                value={event.galleryHeading ?? "Teilt eure schönsten Momente"}
                placeholder="Teilt eure schönsten Momente"
                style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", ...galleryHeadingOverride }}
              />
            </div>
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 8, ...galleryHeadingOverride }}>
              {event.galleryHeading || "Teilt eure schönsten Momente"}
            </div>
          )}

          {editMode ? (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <EditableSectionText
                eventId={event.id}
                field="galleryHint"
                label="Galerie-Hinweistext"
                value={event.galleryHint ?? ""}
                placeholder="Hinweistext hinzufügen…"
                style={{ fontSize: 13, opacity: 0.75, ...galleryHintOverride }}
              />
            </div>
          ) : (
            event.galleryHint && (
              <div style={{ textAlign: "center", marginBottom: 20, fontSize: 13, opacity: 0.75, ...galleryHintOverride }}>
                {event.galleryHint}
              </div>
            )
          )}

          {/* TODO: von Anwalt/Datenschutzbeauftragten pruefen lassen — Entwurf
              zur Transparenz ueber die Fotobuch-Funktion (siehe Gaeste-
              Fotobuch-Schritt), bewusst als reiner Hinweis statt einer
              weiteren Checkbox, unabhaengig von den KI-Einwilligungs-
              Haekchen unten sichtbar. */}
          <div style={{ textAlign: "center", marginBottom: 20, fontSize: 11.5, opacity: 0.65 }}>
            Hinweis: Freigegebene Fotos können vom Gastgeber zu einem privaten Erinnerungs-Fotobuch zum eigenen
            Download zusammengestellt werden.
          </div>

          {galleryPhotos.length > 0 && (
            <PhotoWall eventId={event.id} photos={galleryPhotos} taggedGuests={taggedGuests} colors={colors} />
          )}

          <div style={{ border: `1px solid ${colors.accent}55`, padding: "22px 24px", textAlign: "center" }}>
            {galleryStatus === "success" ? (
              galleryMediaId ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <form action={setUploaderName.bind(null, event.id, event.slug)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 13.5 }}>Danke! Euer Foto/Video wird nach kurzer Prüfung sichtbar.</p>
                    <input type="hidden" name="mediaId" value={galleryMediaId} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <GuestNameField
                        name="uploaderName"
                        placeholder="Wie heißt ihr? (optional)"
                        defaultValue={guestDisplayName}
                        style={{ flex: 1, padding: "11px 13px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13 }}
                      />
                      <button type="submit" style={{ padding: "0 16px", background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Speichern
                      </button>
                    </div>
                  </form>
                  {/* Widerruf nur in diesem Moment moeglich (mediaId kommt
                      ausschliesslich aus dem Redirect direkt nach dem eigenen
                      Upload) — Gaeste haben kein Login, es gibt keine andere
                      Stelle, an der "mein eigenes Foto" wiedererkennbar waere.
                      Siehe Kommentar zu revokeGalleryMediaConsent(). */}
                  <form action={revokeGalleryMediaConsent.bind(null, event.id, event.slug)}>
                    <input type="hidden" name="mediaId" value={galleryMediaId} />
                    <button
                      type="submit"
                      style={{ background: "none", border: "none", padding: 0, fontSize: 11.5, color: colors.primary, opacity: 0.65, textDecoration: "underline", cursor: "pointer" }}
                    >
                      KI-Einwilligung für dieses Foto widerrufen
                    </button>
                  </form>
                </div>
              ) : (
                <p style={{ fontSize: 13.5 }}>Danke! Euer Foto/Video wird nach kurzer Prüfung sichtbar.</p>
              )
            ) : (
              // Ziel: maximal drei Beruehrungen vom QR-Scan bis zum
              // hochgeladenen Foto, ohne Konto, ohne Namenseingabe (siehe
              // docs/BENCHMARK.md) — FileField reicht die Datei per
              // autoSubmit direkt beim Auswaehlen ein, kein zweiter Tap auf
              // einen separaten "Hochladen"-Button noetig. Der Name wird
              // erst danach im Erfolgs-Zustand oben optional nachgefragt.
              <form action={uploadGalleryPhoto.bind(null, event.id, event.slug)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {galleryError && <p style={{ fontSize: 12, color: "#C9605C" }}>{uploadErrorLabel[galleryError]}</p>}
                {uploadTable && (
                  <p style={{ fontSize: 12, color: colors.accent, fontWeight: 600 }}>
                    Ihr ladet hoch für: {uploadTable.name}
                  </p>
                )}
                <input type="hidden" name="tableId" value={uploadTable?.id ?? ""} />
                {/* Zwei getrennte, unabhaengig ankreuzbare Haekchen, beide
                    standardmaessig NICHT angehakt (Koppelungsverbot Art. 7
                    Abs. 4 DSGVO — der Upload selbst funktioniert immer, auch
                    ohne beide/eines der Haekchen). Checkbox 2 (Gesichter-
                    kennung) bewusst getrennt von Checkbox 1, da sie
                    biometrische Daten betrifft (Art. 9 DSGVO) und deshalb
                    eine eigene, explizite Einwilligung braucht. Liegen im
                    selben <form> wie das FileField darunter — beim
                    Auto-Submit per Dateiauswahl (siehe FileField.tsx) wird
                    der aktuelle Haekchen-Stand automatisch mit uebernommen,
                    kein zusaetzlicher Tap auf einen Absenden-Button noetig. */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", fontSize: 11.5, color: colors.primary }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" name="aiConsentGeneral" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ opacity: 0.85 }}>{AI_CONSENT_GENERAL_TEXT}</span>
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" name="aiConsentFace" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ opacity: 0.85 }}>{AI_CONSENT_FACE_TEXT}</span>
                  </label>
                  <p style={{ margin: 0, fontSize: 11, opacity: 0.65 }}>
                    Der Upload funktioniert auch ohne Häkchen. Mehr zur Datenverarbeitung in unserer{" "}
                    <a href="/datenschutz" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>
                      Datenschutzerklärung
                    </a>
                    .
                  </p>
                </div>
                {editMode ? (
                  // <div> statt FileField im Editor-Vorschaumodus — ein Klick
                  // wuerde sonst den Datei-Auswahldialog oeffnen (siehe
                  // FileField.tsx), statt nur den Button-Text auszuwaehlen.
                  <EditableSectionText
                    eventId={event.id}
                    field="galleryButtonText"
                    label="Galerie-Upload-Button"
                    value={event.galleryButtonText ?? "Foto oder Video auswählen"}
                    placeholder="Foto oder Video auswählen"
                    as="div"
                    style={{
                      width: "100%",
                      padding: "11px 13px",
                      border: `1px solid ${colors.accent}55`,
                      color: colors.primary,
                      fontSize: 13,
                      textAlign: "left",
                      ...galleryButtonOverride,
                    }}
                  />
                ) : (
                  <FileField
                    name="file"
                    accept={mediaAccept}
                    required
                    autoSubmit
                    label={event.galleryButtonText || "Foto oder Video auswählen"}
                    colors={colors}
                    style={galleryButtonOverride}
                  />
                )}
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("guestbook") && hasGuestbookAccess && (
        <section id="gaestebuch" style={{ order: sectionOrderIndex("guestbook"), maxWidth: 480, margin: "0 auto", padding: "0 28px 72px" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableGuestbookText
                eventId={event.id}
                field="guestbookHeading"
                label="Gästebuch-Überschrift"
                value={event.guestbookHeading ?? "Eure Nachrichten"}
                placeholder="Eure Nachrichten"
                style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", ...guestbookHeadingOverride }}
              />
            </div>
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 8, ...guestbookHeadingOverride }}>
              {event.guestbookHeading || "Eure Nachrichten"}
            </div>
          )}

          {editMode ? (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <EditableGuestbookText
                eventId={event.id}
                field="guestbookHint"
                label="Gästebuch-Hinweistext"
                value={event.guestbookHint ?? ""}
                placeholder="Hinweistext hinzufügen…"
                style={{ fontSize: 13, opacity: 0.75, ...guestbookHintOverride }}
              />
            </div>
          ) : (
            event.guestbookHint && (
              <div style={{ textAlign: "center", marginBottom: 20, fontSize: 13, opacity: 0.75, ...guestbookHintOverride }}>
                {event.guestbookHint}
              </div>
            )
          )}

          {guestbookEntries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              {guestbookEntries.map((entry) => (
                <GuestbookEntryCard
                  key={entry.id}
                  authorName={entry.authorName}
                  message={entry.message}
                  translatedMessage={entry.translatedMessage}
                  mediaUrl={entry.media?.url ?? null}
                  mediaType={entry.media?.type ?? null}
                  colors={colors}
                />
              ))}
            </div>
          )}

          <div style={{ border: `1px solid ${colors.accent}55`, padding: "22px 24px" }}>
            {guestbookStatus === "success" ? (
              <p style={{ fontSize: 13.5, textAlign: "center" }}>Danke für eure Nachricht!</p>
            ) : (
              <form action={submitGuestbookEntry.bind(null, event.id, event.slug)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {guestbookError && <p style={{ fontSize: 12, color: "#C9605C" }}>{uploadErrorLabel[guestbookError]}</p>}
                <GuestNameField
                  name="authorName"
                  placeholder="Euer Name"
                  required
                  defaultValue={guestDisplayName}
                  style={{ padding: "11px 13px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13 }}
                />
                <textarea
                  name="message"
                  placeholder="Eure Nachricht"
                  rows={3}
                  style={{ padding: "11px 13px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13, fontFamily: "inherit" }}
                />
                <FileField name="file" accept={mediaAccept} label="Foto oder Video anhängen (optional)" colors={colors} />
                {editMode ? (
                  // <div> statt <button> im Editor-Vorschaumodus: der
                  // Eigentuemer bearbeitet hier nur die Beschriftung (Design)
                  // per contentEditable — ein <button> in einem <form> ist
                  // ohne explizites type="button" per Default type="submit",
                  // ein Klick zum Reinfokussieren wuerde also versehentlich
                  // das leere Formular absenden. Gaeste sehen unten den
                  // echten, funktionsfaehigen submit-Button.
                  <EditableGuestbookText
                    eventId={event.id}
                    field="guestbookButtonText"
                    label="Gästebuch-Button"
                    value={event.guestbookButtonText ?? "Nachricht senden"}
                    placeholder="Nachricht senden"
                    as="div"
                    style={{
                      padding: 12,
                      background: colors.accent,
                      color: colors.background,
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "center",
                      ...guestbookButtonOverride,
                    }}
                  />
                ) : (
                  <button
                    type="submit"
                    style={{ padding: 12, background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", ...guestbookButtonOverride }}
                  >
                    {event.guestbookButtonText || "Nachricht senden"}
                  </button>
                )}
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("music-requests") && (
        <section id="musikwuensche" style={{ order: sectionOrderIndex("music-requests"), maxWidth: 420, margin: "0 auto", padding: "0 28px 72px" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                field="musicHeading"
                label="Musikwünsche-Überschrift"
                value={event.musicHeading ?? "Musikwünsche"}
                placeholder="Musikwünsche"
                style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", ...musicHeadingOverride }}
              />
            </div>
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 8, ...musicHeadingOverride }}>
              {event.musicHeading || "Musikwünsche"}
            </div>
          )}

          {editMode ? (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <EditableSectionText
                eventId={event.id}
                field="musicHint"
                label="Musikwünsche-Hinweistext"
                value={event.musicHint ?? ""}
                placeholder="Hinweistext hinzufügen…"
                style={{ fontSize: 13, opacity: 0.75, ...musicHintOverride }}
              />
            </div>
          ) : (
            event.musicHint && (
              <div style={{ textAlign: "center", marginBottom: 20, fontSize: 13, opacity: 0.75, ...musicHintOverride }}>
                {event.musicHint}
              </div>
            )
          )}
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "22px 24px" }}>
            {musicStatus === "success" ? (
              <p style={{ fontSize: 13.5, textAlign: "center" }}>Danke für euren Musikwunsch!</p>
            ) : (
              <form action={submitMusicRequest.bind(null, event.id, event.slug)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {musicError && <p style={{ fontSize: 12, color: "#C9605C" }}>{uploadErrorLabel[musicError]}</p>}
                <GuestNameField
                  name="guestName"
                  placeholder="Euer Name"
                  required
                  defaultValue={guestDisplayName}
                  style={{ padding: "11px 13px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13 }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    name="song"
                    placeholder="Song"
                    required
                    style={{ padding: "11px 13px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13, flex: "1 1 140px", minWidth: 0 }}
                  />
                  <input
                    name="artist"
                    placeholder="Interpret"
                    required
                    style={{ padding: "11px 13px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13, flex: "1 1 140px", minWidth: 0 }}
                  />
                </div>
                <textarea
                  name="message"
                  placeholder="Nachricht (optional)"
                  rows={2}
                  style={{ padding: "11px 13px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13, fontFamily: "inherit" }}
                />
                {editMode ? (
                  // <div> statt <button> im Editor-Vorschaumodus — siehe
                  // Kommentar beim Gaestebuch-Button (Schritt 3): ein
                  // <button> ohne explizites type="button" ist in einem
                  // <form> per Default type="submit".
                  <EditableSectionText
                    eventId={event.id}
                    field="musicButtonText"
                    label="Musikwünsche-Button"
                    value={event.musicButtonText ?? "Wunsch senden"}
                    placeholder="Wunsch senden"
                    as="div"
                    style={{
                      padding: 12,
                      background: colors.accent,
                      color: colors.background,
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "center",
                      ...musicButtonOverride,
                    }}
                  />
                ) : (
                  <button
                    type="submit"
                    style={{ padding: 12, background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", ...musicButtonOverride }}
                  >
                    {event.musicButtonText || "Wunsch senden"}
                  </button>
                )}
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("wishlist") && (wishlistItemsData.length > 0 || editMode) && (
        <section id="wunschliste" style={{ order: sectionOrderIndex("wishlist"), maxWidth: 480, margin: "0 auto", padding: "0 28px 72px" }}>
          {editMode ? (
            <EditableSectionText
              eventId={event.id}
              field="wishlistHeading"
              label="Wunschliste-Überschrift"
              value={event.wishlistHeading ?? "Wunschliste"}
              placeholder="Wunschliste"
              style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", ...wishlistHeadingOverride }}
            />
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 8, ...wishlistHeadingOverride }}>
              {event.wishlistHeading || "Wunschliste"}
            </div>
          )}

          {editMode ? (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <EditableSectionText
                eventId={event.id}
                field="wishlistHint"
                label="Wunschliste-Hinweistext"
                value={event.wishlistHint ?? ""}
                placeholder="Hinweistext hinzufügen…"
                style={{ fontSize: 13, opacity: 0.75, ...wishlistHintOverride }}
              />
            </div>
          ) : (
            event.wishlistHint && (
              <div style={{ textAlign: "center", marginBottom: 20, fontSize: 13, opacity: 0.75, ...wishlistHintOverride }}>
                {event.wishlistHint}
              </div>
            )
          )}

          {editMode ? (
            <EditableWishlist
              initialItems={wishlistItemsData}
              baseStyle={{ color: colors.primary }}
              accentColor={colors.accent}
            />
          ) : (
            WISHLIST_TYPES.map((type) => ({ type, items: wishlistItemsData.filter((w) => w.type === type) }))
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.type} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.6, marginBottom: 10 }}>
                    {WISHLIST_TYPE_LABEL[group.type]}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {group.items.map((item) => (
                      <div key={item.id} style={{ border: `1px solid ${colors.accent}55`, padding: "14px 16px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                        {item.description && <p style={{ fontSize: 12.5, opacity: 0.8, marginTop: 4 }}>{item.description}</p>}
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: colors.accent, marginTop: 6, display: "inline-block" }}>
                            Öffnen →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </section>
      )}

      {isModuleOn("dresscode") && (event.dresscodeText || editMode) && (
        <section id="dresscode" style={{ order: sectionOrderIndex("dresscode"), maxWidth: 480, margin: "0 auto", padding: "0 28px 72px", textAlign: "center" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                field="dresscodeHeading"
                label="Dresscode-Überschrift"
                value={event.dresscodeHeading ?? "Dresscode"}
                placeholder="Dresscode"
                style={{ fontFamily: headingFont, fontSize: 20, ...dresscodeHeadingOverride }}
              />
            </div>
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, marginBottom: 8, ...dresscodeHeadingOverride }}>
              {event.dresscodeHeading || "Dresscode"}
            </div>
          )}
          {editMode ? (
            <EditableSectionText
              eventId={event.id}
              field="dresscodeText"
              label="Dresscode-Text"
              value={event.dresscodeText ?? ""}
              placeholder="z. B. Elegant / Smart Casual"
              style={{ fontSize: 14, opacity: 0.85, ...dresscodeTextOverride }}
            />
          ) : (
            <div style={{ fontSize: 14, opacity: 0.85, ...dresscodeTextOverride }}>{event.dresscodeText}</div>
          )}
        </section>
      )}

      {isModuleOn("social-media") && (event.socialMediaText || editMode) && (
        <section id="social-media" style={{ order: sectionOrderIndex("social-media"), maxWidth: 480, margin: "0 auto", padding: "0 28px 72px", textAlign: "center" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                field="socialMediaHeading"
                label="Social-Media-Überschrift"
                value={event.socialMediaHeading ?? "Social Media"}
                placeholder="Social Media"
                style={{ fontFamily: headingFont, fontSize: 20, ...socialMediaHeadingOverride }}
              />
            </div>
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, marginBottom: 8, ...socialMediaHeadingOverride }}>
              {event.socialMediaHeading || "Social Media"}
            </div>
          )}
          {editMode ? (
            <EditableSectionText
              eventId={event.id}
              field="socialMediaText"
              label="Hashtag-Text"
              value={event.socialMediaText ?? ""}
              placeholder="z. B. #EureHochzeit2026"
              style={{ fontSize: 14, opacity: 0.85, ...socialMediaTextOverride }}
            />
          ) : (
            <div style={{ fontSize: 14, opacity: 0.85, ...socialMediaTextOverride }}>{event.socialMediaText}</div>
          )}
        </section>
      )}

      {isModuleOn("audio-invitation") && event.audioInvitation && (
        <section id="audio-einladung" style={{ order: sectionOrderIndex("audio-invitation"), maxWidth: 480, margin: "0 auto", padding: "0 28px 72px", textAlign: "center" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                field="audioInvitationHeading"
                label="Audio-Einladung-Überschrift"
                value={event.audioInvitationHeading ?? "Eine Nachricht für euch"}
                placeholder="Eine Nachricht für euch"
                style={{ fontFamily: headingFont, fontSize: 20, ...audioInvitationHeadingOverride }}
              />
            </div>
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, marginBottom: 8, ...audioInvitationHeadingOverride }}>
              {event.audioInvitationHeading || "Eine Nachricht für euch"}
            </div>
          )}
          {editMode ? (
            <div style={{ marginBottom: 20 }}>
              <EditableSectionText
                eventId={event.id}
                field="audioInvitationHint"
                label="Audio-Einladung-Hinweistext"
                value={event.audioInvitationHint ?? ""}
                placeholder="Hinweistext hinzufügen…"
                style={{ fontSize: 13, opacity: 0.75, ...audioInvitationHintOverride }}
              />
            </div>
          ) : (
            event.audioInvitationHint && (
              <div style={{ marginBottom: 20, fontSize: 13, opacity: 0.75, ...audioInvitationHintOverride }}>
                {event.audioInvitationHint}
              </div>
            )
          )}
          <AudioMessagePlayer url={event.audioInvitation.url} accent={colors.accent} primary={colors.background} />
        </section>
      )}

      {isModuleOn("video-invitation") && event.videoMessage && (
        <section id="video-einladung" style={{ order: sectionOrderIndex("video-invitation"), maxWidth: 480, margin: "0 auto", padding: "0 28px 72px", textAlign: "center" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                field="videoMessageHeading"
                label="Video-Einladung-Überschrift"
                value={event.videoMessageHeading ?? "Unsere Videobotschaft"}
                placeholder="Unsere Videobotschaft"
                style={{ fontFamily: headingFont, fontSize: 20, ...videoMessageHeadingOverride }}
              />
            </div>
          ) : (
            <div style={{ fontFamily: headingFont, fontSize: 20, marginBottom: 8, ...videoMessageHeadingOverride }}>
              {event.videoMessageHeading || "Unsere Videobotschaft"}
            </div>
          )}
          {editMode ? (
            <div style={{ marginBottom: 20 }}>
              <EditableSectionText
                eventId={event.id}
                field="videoMessageHint"
                label="Video-Einladung-Hinweistext"
                value={event.videoMessageHint ?? ""}
                placeholder="Hinweistext hinzufügen…"
                style={{ fontSize: 13, opacity: 0.75, ...videoMessageHintOverride }}
              />
            </div>
          ) : (
            event.videoMessageHint && (
              <div style={{ marginBottom: 20, fontSize: 13, opacity: 0.75, ...videoMessageHintOverride }}>
                {event.videoMessageHint}
              </div>
            )
          )}
          <VideoMessagePlayer url={event.videoMessage.url} accent={colors.accent} primary={colors.primary} background={colors.background} />
        </section>
      )}

      {isModuleOn("thank-you-card") && (isPastEvent || editMode) && (
        <section style={{ order: sectionOrderIndex("thank-you-card"), maxWidth: 480, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 10, color: colors.accent }}>♥</div>
            {editMode ? (
              <div style={{ marginBottom: 12 }}>
                <EditableSectionText
                  eventId={event.id}
                  field="thankYouHeading"
                  label="Dankeskarte-Überschrift"
                  value={event.thankYouHeading ?? "Danke euch von Herzen"}
                  placeholder="Danke euch von Herzen"
                  style={{ fontFamily: headingFont, fontSize: 19, ...thankYouHeadingOverride }}
                />
              </div>
            ) : (
              <div style={{ fontFamily: headingFont, fontSize: 19, marginBottom: 12, ...thankYouHeadingOverride }}>
                {event.thankYouHeading || "Danke euch von Herzen"}
              </div>
            )}
            {editMode ? (
              <EditableSectionText
                eventId={event.id}
                field="thankYouMessage"
                label="Dankestext"
                value={thankYouMessage}
                placeholder={`Danke, dass ihr diesen Tag mit uns gefeiert habt! — ${event.title}`}
                as="p"
                style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, ...thankYouMessageOverride }}
              />
            ) : (
              <p style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, ...thankYouMessageOverride }}>
                {thankYouMessage || `Danke, dass ihr diesen Tag mit uns gefeiert habt! — ${event.title}`}
              </p>
            )}
            {thankYouPhotos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 8, marginTop: 18 }}>
                {thankYouPhotos.map((m) => (
                  // eslint-disable-next-line @next/next/no-img-element -- guest upload, unknown dimensions
                  <img key={m.id} src={m.url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <footer style={{ order: 999, textAlign: "center", padding: "24px 28px 40px", fontSize: 11, opacity: 0.5 }}>
        Erstellt mit einladi
      </footer>
    </main>
  );
}
