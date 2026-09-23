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
import { HeroCard } from "@/components/public/HeroCard";
import { EventHero } from "@/components/public/EventHero";
import { CameraSection } from "@/components/invitation-sections/CameraSection";
import { Footer as InvitationFooter } from "@/components/invitation-sections/Footer";
import type { LiveDesignState } from "@/lib/live-design-state";
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
import { EditableWeddingParty } from "@/components/public/EditableWeddingParty";
import { WEDDING_PARTY_ROLE_LABEL, WEDDING_PARTY_ROLES, type WeddingPartyMemberData } from "@/lib/wedding-party";
import { cardTextZone } from "@/lib/card-frames";
import { PHOTO_BACKGROUND } from "@/lib/gallery-templates";
import type { PhotoShape } from "@/lib/photo-shape";
import { elementOverrideStyle, type StyleElements } from "@/lib/text-style";
import { googleCalendarUrl } from "@/lib/ics";
import { isPast } from "@/lib/time";
import { getEventWeather, weatherCodeInfo } from "@/lib/weather";
import { submitRsvp, findSeat, uploadGalleryPhoto, setUploaderName, revokeGalleryMediaConsent, submitGuestbookEntry, submitMusicRequest, confirmCheckIn, checkInGuestByName } from "./actions";
import { AI_CONSENT_GENERAL_TEXT } from "@/lib/ai-consent";
import { eventHasFeature } from "@/lib/event-features";
import { activeSectionOrder, sectionOrderIndex as sectionOrderIndexFn } from "@/lib/section-order";
import { ReorderableSection } from "@/components/public/ReorderableSection";

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
  const hasWeddingPartyAccess = eventHasFeature(event, "wedding-party");
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
  const coupleLeftNameOverride = elementOverrideStyle(style.elements, "coupleLeftName");
  const coupleLeftBioOverride = elementOverrideStyle(style.elements, "coupleLeftBio");
  const coupleRightNameOverride = elementOverrideStyle(style.elements, "coupleRightName");
  const coupleRightBioOverride = elementOverrideStyle(style.elements, "coupleRightBio");
  const locationOverride = elementOverrideStyle(style.elements, "location");
  const guestbookHeadingOverride = elementOverrideStyle(style.elements, "guestbookHeading");
  const guestbookHintOverride = elementOverrideStyle(style.elements, "guestbookHint");
  const guestbookButtonOverride = elementOverrideStyle(style.elements, "guestbookButtonText");
  const wishlistHeadingOverride = elementOverrideStyle(style.elements, "wishlistHeading");
  const wishlistHintOverride = elementOverrideStyle(style.elements, "wishlistHint");
  const weddingPartyHeadingOverride = elementOverrideStyle(style.elements, "weddingPartyHeading");
  const weddingPartyHintOverride = elementOverrideStyle(style.elements, "weddingPartyHint");
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
  // Foto fuer den Ablaufplan-Zweispalter (Belle-Vorbild, siehe
  // EventsTimeline.tsx im Gestalten-Bereich) — gleiche Prioritaet wie
  // ueberall sonst: eigenes Titelbild vor generischem Vorlagen-Stockfoto.
  const agendaPhotoUrl = event.coverImage?.url ?? photoBackground?.src;
  // Die Ablaufplan-Zeilen sitzen auf einer FEST hellen Flaeche (var(--ivory-2)
  // in .iv-events-list .customizer-card-agenda-row, Belle-Vorbild: "boxige
  // graue Zeilen") — unabhaengig von der Vorlagenfarbe. colors.primary waere
  // hier falsch: bei dunklen Vorlagen (z.B. Bordeaux-Hintergrund mit hellem
  // Vordergrundtext) ergaebe das helle Schrift auf heller Flaeche
  // (Kontrast-Bug, live gefunden). Fester dunkler Ton statt Vorlagenfarbe.
  const agendaRowInk = "#2b241f";

  // Abschnitts-Reihenfolge (Bugfix "sectionOrder geht beim Signup verloren")
  // — <main> wird weiter unten auf display:flex/flex-direction:column
  // umgestellt, jeder umsortierbare <section>-Block bekommt per
  // sectionOrderIndex() einen CSS-order-Wert statt seine JSX-Position im
  // Baum zu aendern. Bewusst NICHT die JSX-Struktur der einzelnen (teils
  // sehr umfangreichen) Abschnitte selbst angefasst — das haette ein
  // deutlich riskanteres Refactoring der wichtigsten Seite der App bedeutet.
  // Liste + Indexberechnung jetzt in lib/section-order.ts (geteilt mit
  // DesignEditor.tsx/ReorderableSection.tsx, Inline Umsortieren).
  const activeOrder = activeSectionOrder(style.sectionOrder);
  function sectionOrderIndex(key: string): number {
    return sectionOrderIndexFn(activeOrder, key);
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

  const [galleryItems, guestbookEntries, wishlistItems, weddingPartyMembers, menuItems] = await Promise.all([
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
    isModuleOn("wedding-party") && hasWeddingPartyAccess
      ? prisma.weddingPartyMember.findMany({ where: { eventId: event.id }, include: { photo: true }, orderBy: { sortOrder: "asc" } })
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
  const weddingPartyItemsData: WeddingPartyMemberData[] = weddingPartyMembers.map((m) => ({
    id: m.id,
    role: m.role,
    name: m.name,
    photoUrl: m.photo?.url ?? "",
    photoId: m.photoId ?? undefined,
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

  // Hero-Inhalt: Duegduen-Blanko-Vorlagen mit echter Kartengrafik behalten
  // HeroCard.tsx unveraendert (siehe dortiger Kommentar). Alle anderen
  // Vorlagen nutzen jetzt EventHero.tsx — dieselben Hero.tsx/
  // BigDayCountdown.tsx-Komponenten wie im Gestalten-Bereich (Plan-Phase D,
  // CLAUDE.md Regel 6). Die "Der große Tag"-Bandueberschrift teilt sich das
  // description-Feld mit der bisherigen eigenstaendigen Beschreibungs-
  // Sektion (siehe dortige Ausblendung weiter unten, "countdownOnAndNoCard").
  const countdownOnAndNoCard = isModuleOn("countdown") && !cardImageUrl;
  const heroInner = cardImageUrl ? (
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
  ) : (
    <EventHero
      eventId={event.id}
      eventSlug={event.slug}
      title={event.title}
      familyLeft={event.familyLeft}
      familyRight={event.familyRight}
      eventDate={event.eventDate}
      eventTime={event.eventTime}
      eventLabelText={eventLabelText}
      eventLabelRaw={event.eventLabel}
      editMode={editMode}
      envelopeImages={envelopeImages}
      hasFamilyNames={hasFamilyNames}
      eventLocationText={eventLocationText}
      countdownOn={isModuleOn("countdown")}
      templateFontFallback={templateFontFallback}
      initial={initialDesignState}
      countdownDaysLabel={event.countdownDaysLabel ?? "TAGE"}
      countdownHoursLabel={event.countdownHoursLabel ?? "STD"}
      countdownMinutesLabel={event.countdownMinutesLabel ?? "MIN"}
      calendarSaveText={event.calendarSaveText ?? "In Kalender speichern"}
      calendarGoogleText={event.calendarGoogleText ?? "Google Kalender"}
      calendarUrl={calendarUrl}
      descriptionText={event.description ?? ""}
      // Gleiche Prioritaet wie im Gestalten-Bereich (DesignStudio.tsx): das
      // eigene Titelbild schlaegt immer das generische Vorlagen-Stock-Foto.
      // Ersetzt damit auch den bisherigen separaten Titelbild-Banner unter
      // der Karte (siehe Ausblendung weiter unten, "!useNewHeroPhoto") —
      // sonst erschiene dasselbe Foto zweimal.
      photoUrl={event.coverImage?.url ?? photoBackground?.src ?? undefined}
    />
  );
  // Steuert, ob der bisherige separate Titelbild-Banner (order:3 weiter
  // unten) ausgeblendet bleibt, weil EventHero das Foto bereits selbst als
  // Hero-Hintergrund zeigt — nur fuer Vorlagen OHNE Kartengrafik relevant,
  // bei cardImageUrl bleibt das bisherige Verhalten (useCardPhoto-Flag)
  // unveraendert bestehen.
  const heroShowsOwnPhoto = !cardImageUrl && Boolean(event.coverImage);

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

  // Fuer den Inline-Umsortieren-Pfeil (ReorderableSection.tsx): welche der
  // umsortierbaren Abschnitte gerade tatsaechlich sichtbar sind — dieselben
  // Bedingungen wie die {isModuleOn(...) && ... && (<ReorderableSection>)}-
  // Bloecke weiter unten, hier einmal gesammelt, damit "nach oben"/"nach
  // unten" mit dem naechsten SICHTBAREN Nachbarn tauscht statt mit einem
  // gerade ausgeblendeten (der Klick haette sonst keine sichtbare Wirkung).
  const visibleSectionKeys = [
    isModuleOn("agenda") && (agendaItems.length > 0 || editMode) && "agenda",
    isModuleOn("rsvp") && "rsvp",
    isModuleOn("seating") && hasSeatingAccess && "seating",
    isModuleOn("menu") && (menuItems.length > 0 || editMode) && "menu",
    isModuleOn("gallery") && hasGalleryAccess && "gallery",
    isModuleOn("guestbook") && hasGuestbookAccess && "guestbook",
    isModuleOn("wedding-party") && hasWeddingPartyAccess && (weddingPartyItemsData.length > 0 || editMode) && "wedding-party",
    isModuleOn("music-requests") && "music-requests",
    isModuleOn("wishlist") && (wishlistItemsData.length > 0 || editMode) && "wishlist",
    isModuleOn("dresscode") && (event.dresscodeText || editMode) && "dresscode",
    isModuleOn("social-media") && (event.socialMediaText || editMode) && "social-media",
    isModuleOn("audio-invitation") && Boolean(event.audioInvitation) && "audio-invitation",
    isModuleOn("video-invitation") && Boolean(event.videoMessage) && "video-invitation",
    isModuleOn("thank-you-card") && (isPastEvent || editMode) && "thank-you-card",
  ].filter((k): k is string => typeof k === "string");
  const sectionLabels: Record<string, string> = {
    agenda: "Ablaufplan",
    rsvp: "Zusagen",
    seating: "Sitzplan",
    menu: "Menü",
    gallery: "Galerie",
    guestbook: "Gästebuch",
    "wedding-party": "Trauzeugen & Brautjungfern",
    "music-requests": "Musikwünsche",
    wishlist: "Wunschliste",
    dresscode: "Dresscode",
    "social-media": "Social Media",
    "audio-invitation": "Audio-Einladung",
    "video-invitation": "Video-Einladung",
    "thank-you-card": "Dankeskarte",
  };

  return (
    <main
      className="iv-page"
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
        // Live gefunden (Playwright, 375px): CameraSection skaliert Abschnitte
        // beim Einblenden kurzzeitig auf scale(1.08) (siehe CameraSection.tsx)
        // — das schiebt den sichtbaren Rand ueber die Seitenbreite hinaus und
        // erzeugt auf JEDEM per CameraSection animierten Abschnitt (nicht nur
        // den beiden hier neuen) horizontales Scrollen auf schmalen Screens.
        // Betrifft die ganze Seite, nicht nur diese Aenderung — siehe Bericht.
        overflowX: "hidden",
      }}
    >
      {isOwner && event.status !== "PUBLISHED" && (
        <div style={{ order: 0, background: "#211C19", color: "#FAF6EF", textAlign: "center", padding: "8px 16px", fontSize: 12 }}>
          Vorschau — dieses Event ist noch nicht veröffentlicht. Nur du siehst diesen Hinweis.
        </div>
      )}

      <section
        style={
          cardImageUrl
            ? { order: 1, padding: "72px 28px 48px", textAlign: "center", maxWidth: 560, margin: "0 auto" }
            : { order: 1 }
        }
      >
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

      {(editMode || event.coupleLeftName || event.coupleLeftBio || event.coupleRightName || event.coupleRightBio) && (
        <CameraSection style={{ order: 2 }}>
        <section id="paar" className="iv-section" style={{ background: colors.background, ["--iv-accent" as string]: colors.accent }}>
          <div className="iv-inner">
            <div className="iv-head">
              <span className="iv-eyebrow">Hallo!</span>
              <h2 className="iv-heading" style={{ fontFamily: headingFont, color: colors.primary }}>
                Wir laden euch ein, mit uns zu feiern
              </h2>
            </div>
            <div className="iv-couple-row">
              <div className="iv-couple-person">
                <div
                  className="iv-couple-photo"
                  style={{ background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${colors.accent} 55%, #fff) 0%, ${colors.accent} 100%)` }}
                />
                <div className="iv-couple-bio">
                  {editMode ? (
                    <EditableSectionText
                      eventId={event.id}
                      defaultColor={colors.primary}
                      field="coupleLeftName"
                      label="Name (links)"
                      value={event.coupleLeftName ?? ""}
                      placeholder="Anna"
                      as="div"
                      style={{ fontFamily: headingFont, fontSize: 18, color: colors.primary, marginBottom: 6, ...coupleLeftNameOverride }}
                    />
                  ) : (
                    event.coupleLeftName && (
                      <div style={{ fontFamily: headingFont, fontSize: 18, color: colors.primary, marginBottom: 6, ...coupleLeftNameOverride }}>
                        {event.coupleLeftName}
                      </div>
                    )
                  )}
                  {editMode ? (
                    <EditableSectionText
                      eventId={event.id}
                      defaultColor={colors.primary}
                      field="coupleLeftBio"
                      label="Kurzvorstellung (links)"
                      value={event.coupleLeftBio ?? ""}
                      placeholder="Ein paar Worte über sie…"
                      as="p"
                      style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, color: colors.primary, ...coupleLeftBioOverride }}
                    />
                  ) : (
                    event.coupleLeftBio && (
                      <p style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, color: colors.primary, ...coupleLeftBioOverride }}>{event.coupleLeftBio}</p>
                    )
                  )}
                </div>
              </div>
              <span className="iv-couple-heart" aria-hidden="true">
                ♥
              </span>
              <div className="iv-couple-person">
                <div
                  className="iv-couple-photo"
                  style={{ background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${colors.accent} 55%, #fff) 0%, ${colors.accent} 100%)` }}
                />
                <div className="iv-couple-bio">
                  {editMode ? (
                    <EditableSectionText
                      eventId={event.id}
                      defaultColor={colors.primary}
                      field="coupleRightName"
                      label="Name (rechts)"
                      value={event.coupleRightName ?? ""}
                      placeholder="Lukas"
                      as="div"
                      style={{ fontFamily: headingFont, fontSize: 18, color: colors.primary, marginBottom: 6, ...coupleRightNameOverride }}
                    />
                  ) : (
                    event.coupleRightName && (
                      <div style={{ fontFamily: headingFont, fontSize: 18, color: colors.primary, marginBottom: 6, ...coupleRightNameOverride }}>
                        {event.coupleRightName}
                      </div>
                    )
                  )}
                  {editMode ? (
                    <EditableSectionText
                      eventId={event.id}
                      defaultColor={colors.primary}
                      field="coupleRightBio"
                      label="Kurzvorstellung (rechts)"
                      value={event.coupleRightBio ?? ""}
                      placeholder="Ein paar Worte über ihn…"
                      as="p"
                      style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, color: colors.primary, ...coupleRightBioOverride }}
                    />
                  ) : (
                    event.coupleRightBio && (
                      <p style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85, color: colors.primary, ...coupleRightBioOverride }}>{event.coupleRightBio}</p>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        </CameraSection>
      )}

      {isModuleOn("background-music") && event.backgroundMusic && (
        <BackgroundMusicToggle url={event.backgroundMusic.url} accent={colors.accent} background={colors.background} />
      )}

      {event.coverImage && !useCardPhoto && !heroShowsOwnPhoto && (
        <CameraSection style={{ order: 3 }}>
        <div style={{ maxWidth: 640, margin: "0 auto 48px", padding: "0 28px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user upload, unknown dimensions */}
          <img src={event.coverImage.url} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        </CameraSection>
      )}

      {/* Bei aktivem Countdown (und keiner Kartengrafik-Vorlage) zeigt
          EventHero denselben description-Text bereits als "Der große
          Tag"-Introtext — diese eigenstaendige Sektion bliebe sonst eine
          reine Dopplung desselben Textes. */}
      {!countdownOnAndNoCard && (
        <CameraSection style={{ order: 4 }}>
        {editMode ? (
          <section style={{ maxWidth: 560, margin: "0 auto", padding: "56px 28px", textAlign: "center" }}>
            <EditableDescription
              eventId={event.id}
              value={event.description ?? ""}
              style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...descriptionOverride }}
              defaultColor={colors.primary}
            />
          </section>
        ) : (
          event.description && (
            <section style={{ maxWidth: 560, margin: "0 auto", padding: "56px 28px", textAlign: "center" }}>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...descriptionOverride }}>
                {event.description}
              </p>
            </section>
          )
        )}
        </CameraSection>
      )}

      <CameraSection style={{ order: 4 }}>
      {(editMode || event.loveStoryText) && (
        <section id="geschichte" className="iv-section" style={{ background: colors.background, ["--iv-accent" as string]: colors.accent }}>
          <div className="iv-inner">
            <div className="iv-head">
              <span className="iv-eyebrow">Wir lieben uns</span>
              <h2 className="iv-heading" style={{ fontFamily: headingFont, color: colors.primary }}>
                Unsere Geschichte
              </h2>
              {editMode ? (
                <EditableLoveStory
                  eventId={event.id}
                  value={event.loveStoryText ?? ""}
                  style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...loveStoryOverride }}
                  defaultColor={colors.primary}
                />
              ) : (
                <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...loveStoryOverride }}>
                  {event.loveStoryText}
                </p>
              )}
            </div>
          </div>
        </section>
      )}
      </CameraSection>

      {isModuleOn("location") && (event.locationName || editMode) && (
        <CameraSection style={{ order: 5 }}>
        <section style={{ maxWidth: 480, margin: "0 auto", padding: "56px 28px" }}>
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
                defaultColor={colors.primary}
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
        </CameraSection>
      )}

      {isModuleOn("agenda") && (agendaItems.length > 0 || editMode) && (
        <ReorderableSection
          sectionKey="agenda"
          label={sectionLabels["agenda"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("agenda")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="ablaufplan" className="iv-section" style={{ background: colors.background, ["--iv-accent" as string]: colors.accent }}>
          <div className="iv-inner">
            <div className="iv-head">
              <span className="iv-eyebrow">Ablaufplan</span>
              <h2 className="iv-heading" style={{ fontFamily: headingFont, color: colors.primary }}>
                Der Ablauf des Tages
              </h2>
            </div>
            <div className="iv-events-grid">
              <div
                className="iv-events-photo"
                style={
                  agendaPhotoUrl
                    ? { backgroundImage: `url(${agendaPhotoUrl})` }
                    : { background: `linear-gradient(155deg, ${colors.accent}, ${colors.primary})` }
                }
              />
              <div className="iv-events-list">
                {editMode ? (
                  <EditableAgenda initialItems={agendaItems} baseStyle={{ fontFamily: headingFont, color: agendaRowInk }} accentColor={colors.accent} />
                ) : (
                  <div className="customizer-card-agenda">
                    {agendaItems.map((it) => {
                      const override = elementOverrideStyle({ agenda: it.style }, "agenda");
                      return (
                        <div key={it.id} className="customizer-card-agenda-row" style={{ fontFamily: headingFont, color: agendaRowInk, ...override }}>
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
            </div>
          </div>
        </section>
        </ReorderableSection>
      )}

      {weather && (
        <CameraSection style={{ order: 6 }}>
        <section style={{ maxWidth: 480, margin: "0 auto", padding: "56px 28px" }}>
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
        </CameraSection>
      )}

      {isModuleOn("check-in") && linkedGuest && (
        <CameraSection style={{ order: 90 }}>
        <section style={{ maxWidth: 420, margin: "0 auto", padding: "56px 28px" }}>
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
        </CameraSection>
      )}

      {isModuleOn("rsvp") && (
        <ReorderableSection
          sectionKey="rsvp"
          label={sectionLabels["rsvp"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("rsvp")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="rsvp" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 420 }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "28px 26px" }}>
            {editMode ? (
              <div style={{ marginBottom: 20 }}>
                <EditableSectionText
                  eventId={event.id}
                  defaultColor={colors.primary}
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
                        defaultColor={colors.primary}
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
                        defaultColor={colors.primary}
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
                        defaultColor={colors.primary}
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
                    defaultColor={colors.primary}
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
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("seating") && hasSeatingAccess && (
        <ReorderableSection
          sectionKey="seating"
          label={sectionLabels["seating"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("seating")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="sitzplatz" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 420 }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "28px 26px", textAlign: "center" }}>
            {editMode ? (
              <div style={{ marginBottom: 8 }}>
                <EditableSectionText
                  eventId={event.id}
                  defaultColor={colors.primary}
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
                  defaultColor={colors.primary}
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
                  defaultColor={colors.primary}
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
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("menu") && (menuItems.length > 0 || editMode) && (
        <ReorderableSection
          sectionKey="menu"
          label={sectionLabels["menu"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("menu")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="menu" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 480 }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                defaultColor={colors.primary}
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
                defaultColor={colors.primary}
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
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("gallery") && hasGalleryAccess && (
        <ReorderableSection
          sectionKey="gallery"
          label={sectionLabels["gallery"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("gallery")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="galerie" className="iv-section">
          <div className="iv-inner" style={{ maxWidth: 640 }}>
          <div className="iv-head">
          <span className="iv-eyebrow">Unsere Erinnerungen</span>
          {editMode ? (
            <EditableSectionText
              eventId={event.id}
              defaultColor={colors.primary}
              field="galleryHeading"
              label="Galerie-Überschrift"
              value={event.galleryHeading ?? "Teilt eure schönsten Momente"}
              placeholder="Teilt eure schönsten Momente"
              as="h2"
              className="iv-heading"
              style={{ fontFamily: headingFont, color: colors.primary, ...galleryHeadingOverride }}
            />
          ) : (
            <h2 className="iv-heading" style={{ fontFamily: headingFont, color: colors.primary, ...galleryHeadingOverride }}>
              {event.galleryHeading || "Teilt eure schönsten Momente"}
            </h2>
          )}

          {editMode ? (
            <EditableSectionText
              eventId={event.id}
              defaultColor={colors.primary}
              field="galleryHint"
              label="Galerie-Hinweistext"
              value={event.galleryHint ?? ""}
              placeholder="Hinweistext hinzufügen…"
              as="p"
              className="iv-intro"
              style={{ ...galleryHintOverride }}
            />
          ) : (
            event.galleryHint && (
              <p className="iv-intro" style={{ ...galleryHintOverride }}>
                {event.galleryHint}
              </p>
            )
          )}
          </div>

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
                {/* Nur noch EIN Haekchen (allgemeine KI-Verarbeitung), standard-
                    maessig NICHT angehakt (Koppelungsverbot Art. 7 Abs. 4 DSGVO
                    — der Upload selbst funktioniert immer, auch ohne Haekchen).
                    Die zweite Checkbox (Gesichtserkennung/biometrisch) ist
                    vorerst entfernt — siehe RECHTSPRUEFUNG.md: sie sammelte
                    Einwilligung fuer eine Funktion, die es noch nicht gibt
                    (aiConsentFace wird nirgends von einer echten Gesichts-
                    erkennung gelesen). Das zugrundeliegende Feld/die Server-
                    Action-Logik bleiben unangetastet im Code (siehe
                    lib/ai-consent.ts, e/[slug]/actions.ts) — bei
                    tatsaechlichem Feature-Launch Checkbox + zugehoerigen
                    Datenschutz-Absatz gemeinsam wieder einfuehren, nicht
                    vorher. Liegt im selben <form> wie das FileField darunter
                    — beim Auto-Submit per Dateiauswahl (siehe FileField.tsx)
                    wird der aktuelle Haekchen-Stand automatisch mit
                    uebernommen, kein zusaetzlicher Tap auf einen Absenden-
                    Button noetig. */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", fontSize: 11.5, color: colors.primary }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" name="aiConsentGeneral" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ opacity: 0.85 }}>{AI_CONSENT_GENERAL_TEXT}</span>
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
                    defaultColor={colors.primary}
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
          </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("guestbook") && hasGuestbookAccess && (
        <ReorderableSection
          sectionKey="guestbook"
          label={sectionLabels["guestbook"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("guestbook")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="gaestebuch" className="iv-section">
          <div className="iv-inner" style={{ maxWidth: 480 }}>
          <div className="iv-head">
          <span className="iv-eyebrow">Für euch aufgeschrieben</span>
          {editMode ? (
            <EditableGuestbookText
              eventId={event.id}
              defaultColor={colors.primary}
              field="guestbookHeading"
              label="Gästebuch-Überschrift"
              value={event.guestbookHeading ?? "Eure Nachrichten"}
              placeholder="Eure Nachrichten"
              as="h2"
              className="iv-heading"
              style={{ fontFamily: headingFont, color: colors.primary, ...guestbookHeadingOverride }}
            />
          ) : (
            <h2 className="iv-heading" style={{ fontFamily: headingFont, color: colors.primary, ...guestbookHeadingOverride }}>
              {event.guestbookHeading || "Eure Nachrichten"}
            </h2>
          )}

          {editMode ? (
            <EditableGuestbookText
              eventId={event.id}
              defaultColor={colors.primary}
              field="guestbookHint"
              label="Gästebuch-Hinweistext"
              value={event.guestbookHint ?? ""}
              placeholder="Hinweistext hinzufügen…"
              as="p"
              className="iv-intro"
              style={{ ...guestbookHintOverride }}
            />
          ) : (
            event.guestbookHint && (
              <p className="iv-intro" style={{ ...guestbookHintOverride }}>
                {event.guestbookHint}
              </p>
            )
          )}
          </div>

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
                    defaultColor={colors.primary}
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
          </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("wedding-party") && hasWeddingPartyAccess && (weddingPartyItemsData.length > 0 || editMode) && (
        <ReorderableSection
          sectionKey="wedding-party"
          label={sectionLabels["wedding-party"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("wedding-party")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="trauzeugen" className="iv-section" style={{ background: colors.background }}>
          <div className="iv-inner" style={{ maxWidth: 640 }}>
          <div className="iv-head">
          <span className="iv-eyebrow">An unserer Seite</span>
          {editMode ? (
            <EditableSectionText
              eventId={event.id}
              defaultColor={colors.primary}
              field="weddingPartyHeading"
              label="Trauzeugen/Brautjungfern-Überschrift"
              value={event.weddingPartyHeading ?? "Trauzeugen & Brautjungfern"}
              placeholder="Trauzeugen & Brautjungfern"
              as="h2"
              className="iv-heading"
              style={{ fontFamily: headingFont, color: colors.primary, ...weddingPartyHeadingOverride }}
            />
          ) : (
            <h2 className="iv-heading" style={{ fontFamily: headingFont, color: colors.primary, ...weddingPartyHeadingOverride }}>
              {event.weddingPartyHeading || "Trauzeugen & Brautjungfern"}
            </h2>
          )}
          {editMode ? (
            <EditableSectionText
              eventId={event.id}
              defaultColor={colors.primary}
              field="weddingPartyHint"
              label="Trauzeugen/Brautjungfern-Hinweistext"
              value={event.weddingPartyHint ?? ""}
              placeholder="Hinweistext hinzufügen…"
              as="p"
              className="iv-intro"
              style={{ ...weddingPartyHintOverride }}
            />
          ) : (
            event.weddingPartyHint && (
              <p className="iv-intro" style={{ ...weddingPartyHintOverride }}>
                {event.weddingPartyHint}
              </p>
            )
          )}
          </div>

          {editMode ? (
            <EditableWeddingParty initialItems={weddingPartyItemsData} baseStyle={{ color: colors.primary }} accentColor={colors.accent} />
          ) : (
            WEDDING_PARTY_ROLES.map((role) => ({ role, items: weddingPartyItemsData.filter((m) => m.role === role) }))
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.role} style={{ marginBottom: 28, textAlign: "center" }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.6, marginBottom: 16 }}>
                    {WEDDING_PARTY_ROLE_LABEL[group.role]}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
                    {group.items.map((m) => (
                      <div key={m.id} style={{ width: 100 }}>
                        <div
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: "50%",
                            margin: "0 auto 10px",
                            border: "3px solid var(--iv-surface, #fff)",
                            boxShadow: "var(--shadow-sm)",
                            background: m.photoUrl
                              ? `url(${m.photoUrl}) center/cover`
                              : `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${colors.accent} 55%, #fff) 0%, ${colors.accent} 100%)`,
                          }}
                        />
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
          </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("music-requests") && (
        <ReorderableSection
          sectionKey="music-requests"
          label={sectionLabels["music-requests"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("music-requests")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="musikwuensche" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 420 }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                defaultColor={colors.primary}
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
                defaultColor={colors.primary}
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
                    defaultColor={colors.primary}
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
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("wishlist") && (wishlistItemsData.length > 0 || editMode) && (
        <ReorderableSection
          sectionKey="wishlist"
          label={sectionLabels["wishlist"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("wishlist")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="wunschliste" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 480 }}>
          {editMode ? (
            <EditableSectionText
              eventId={event.id}
              defaultColor={colors.primary}
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
                defaultColor={colors.primary}
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
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("dresscode") && (event.dresscodeText || editMode) && (
        <ReorderableSection
          sectionKey="dresscode"
          label={sectionLabels["dresscode"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("dresscode")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="dresscode" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 480, textAlign: "center" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                defaultColor={colors.primary}
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
              defaultColor={colors.primary}
              field="dresscodeText"
              label="Dresscode-Text"
              value={event.dresscodeText ?? ""}
              placeholder="z. B. Elegant / Smart Casual"
              style={{ fontSize: 14, opacity: 0.85, ...dresscodeTextOverride }}
            />
          ) : (
            <div style={{ fontSize: 14, opacity: 0.85, ...dresscodeTextOverride }}>{event.dresscodeText}</div>
          )}
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("social-media") && (event.socialMediaText || editMode) && (
        <ReorderableSection
          sectionKey="social-media"
          label={sectionLabels["social-media"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("social-media")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="social-media" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 480, textAlign: "center" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                defaultColor={colors.primary}
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
              defaultColor={colors.primary}
              field="socialMediaText"
              label="Hashtag-Text"
              value={event.socialMediaText ?? ""}
              placeholder="z. B. #EureHochzeit2026"
              style={{ fontSize: 14, opacity: 0.85, ...socialMediaTextOverride }}
            />
          ) : (
            <div style={{ fontSize: 14, opacity: 0.85, ...socialMediaTextOverride }}>{event.socialMediaText}</div>
          )}
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("audio-invitation") && event.audioInvitation && (
        <ReorderableSection
          sectionKey="audio-invitation"
          label={sectionLabels["audio-invitation"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("audio-invitation")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="audio-einladung" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 480, textAlign: "center" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                defaultColor={colors.primary}
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
                defaultColor={colors.primary}
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
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("video-invitation") && event.videoMessage && (
        <ReorderableSection
          sectionKey="video-invitation"
          label={sectionLabels["video-invitation"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("video-invitation")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section id="video-einladung" className="iv-section" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 480, textAlign: "center" }}>
          {editMode ? (
            <div style={{ marginBottom: 8 }}>
              <EditableSectionText
                eventId={event.id}
                defaultColor={colors.primary}
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
                defaultColor={colors.primary}
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
        </div>
        </section>
        </ReorderableSection>
      )}

      {isModuleOn("thank-you-card") && (isPastEvent || editMode) && (
        <ReorderableSection
          sectionKey="thank-you-card"
          label={sectionLabels["thank-you-card"]}
          editMode={editMode}
          fallbackOrder={sectionOrderIndex("thank-you-card")}
          initialOrder={activeOrder}
          visibleKeys={visibleSectionKeys}
        >
        <section style={{ maxWidth: 480, margin: "0 auto", padding: "72px 28px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 10, color: colors.accent }}>♥</div>
            {editMode ? (
              <div style={{ marginBottom: 12 }}>
                <EditableSectionText
                  eventId={event.id}
                  defaultColor={colors.primary}
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
                defaultColor={colors.primary}
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
        </ReorderableSection>
      )}

      <div style={{ order: 999 }}>
        <InvitationFooter
          photoUrl={event.coverImage?.url ?? photoBackground?.src ?? undefined}
          colors={colors}
          fontFamily={headingFont}
          fontStyle="italic"
          names={event.title}
        />
      </div>
    </main>
  );
}
