import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PhotoWall } from "@/components/gallery/PhotoWall";
import { GuestbookEntryCard } from "@/components/guestbook/GuestbookEntryCard";
import { GuestNameField } from "@/components/public/GuestNameField";
import { FileField } from "@/components/public/FileField";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import { EnvelopeOpen } from "@/components/marketing/EnvelopeOpen";
import { VideoEnvelope } from "@/components/marketing/VideoEnvelope";
import { BackgroundMusicToggle } from "@/components/marketing/BackgroundMusicToggle";
import { HeroCard, type LiveDesignState } from "@/components/public/HeroCard";
import { fontOptionById } from "@/lib/fonts";
import { recordEventView } from "@/lib/analytics";
import { EditableDescription } from "@/components/public/EditableDescription";
import { cardTextZone } from "@/lib/card-frames";
import { elementOverrideStyle, type StyleElements } from "@/lib/text-style";
import { googleCalendarUrl } from "@/lib/ics";
import { isPast } from "@/lib/time";
import { getEventWeather, weatherCodeInfo } from "@/lib/weather";
import { submitRsvp, findSeat, uploadGalleryPhoto, setUploaderName, submitGuestbookEntry, submitMusicRequest, confirmCheckIn, checkInGuestByName } from "./actions";

type TemplateColors = { primary: string; accent: string; background: string };
type TemplateFonts = { display: string; body: string };

const WISHLIST_TYPE_LABEL: Record<string, string> = {
  GIFT: "Geschenke",
  CASH: "Geldgeschenke",
  HONEYMOON: "Flitterwochen",
  EXTERNAL: "Weitere Wünsche",
};

const MENU_COURSE_LABEL: Record<string, string> = {
  STARTER: "Vorspeise",
  MAIN: "Hauptgang",
  DESSERT: "Dessert",
  DRINK: "Getränke",
};

async function getEvent(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: { eventType: true, template: true, coverImage: true, owner: true, envelopeVideo: true, backgroundMusic: true },
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
  const style: { fontId?: string; ornaments?: boolean; elements?: StyleElements } = event.styleJson
    ? JSON.parse(event.styleJson)
    : {};
  // Beschreibung sitzt ausserhalb der Karte (eigener Abschnitt darunter,
  // siehe unten) — bleibt serverseitig berechnet. Titel/Untertitel/Datum/
  // Anlass-Label/Familiennamen werden dagegen jetzt in HeroCard.tsx live
  // (per postMessage) berechnet, siehe initialDesignState weiter unten.
  const descriptionOverride = elementOverrideStyle(style.elements, "description");
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
  const initialDesignState: LiveDesignState = { colors, fontId: style.fontId, ornaments: Boolean(style.ornaments), elements: style.elements };
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
    isModuleOn("gallery")
      ? prisma.galleryItem.findMany({
          where: { eventId: event.id, status: "APPROVED" },
          include: { media: { include: { photoTags: { include: { guest: true } } } } },
          orderBy: { createdAt: "desc" },
          take: 24,
        })
      : Promise.resolve([]),
    isModuleOn("guestbook")
      ? prisma.guestbookEntry.findMany({ where: { eventId: event.id, status: "APPROVED" }, include: { media: true }, orderBy: { createdAt: "desc" }, take: 30 })
      : Promise.resolve([]),
    isModuleOn("wishlist")
      ? prisma.wishlistItem.findMany({ where: { eventId: event.id }, orderBy: [{ type: "asc" }, { sortOrder: "asc" }] })
      : Promise.resolve([]),
    isModuleOn("menu")
      ? prisma.menuItem.findMany({ where: { eventId: event.id }, orderBy: [{ course: "asc" }, { sortOrder: "asc" }] })
      : Promise.resolve([]),
  ]);

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
      }}
    >
      {isOwner && event.status !== "PUBLISHED" && (
        <div style={{ background: "#211C19", color: "#FAF6EF", textAlign: "center", padding: "8px 16px", fontSize: 12 }}>
          Vorschau — dieses Event ist noch nicht veröffentlicht. Nur du siehst diesen Hinweis.
        </div>
      )}

      <section style={{ padding: "72px 28px 48px", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
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

      {event.coverImage && (
        <div style={{ maxWidth: 640, margin: "0 auto 48px", padding: "0 28px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user upload, unknown dimensions */}
          <img src={event.coverImage.url} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      )}

      {editMode ? (
        <section style={{ maxWidth: 560, margin: "0 auto", padding: "0 28px 48px", textAlign: "center" }}>
          <EditableDescription
            eventId={event.id}
            value={event.description ?? ""}
            style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...descriptionOverride }}
          />
        </section>
      ) : (
        event.description && (
          <section style={{ maxWidth: 560, margin: "0 auto", padding: "0 28px 48px", textAlign: "center" }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...descriptionOverride }}>
              {event.description}
            </p>
          </section>
        )
      )}

      {isModuleOn("location") && event.locationName && (
        <section style={{ maxWidth: 480, margin: "0 auto", padding: "0 28px 48px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "24px 26px", textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.accent, marginBottom: 10 }}>
              Ort
            </div>
            <div style={{ fontFamily: headingFont, fontSize: 19 }}>{event.locationName}</div>
            {event.locationAddress && <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>{event.locationAddress}</div>}
            {(() => {
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
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
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
        <section style={{ maxWidth: 420, margin: "0 auto", padding: "0 28px 48px" }}>
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
        <section id="rsvp" style={{ maxWidth: 420, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "28px 26px" }}>
            <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 20 }}>Zusagen</div>
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
                    <input type="radio" name="attending" value="yes" defaultChecked /> Wir kommen
                  </label>
                  <label style={{ flex: "1 1 100px", display: "flex", alignItems: "center", gap: 6, padding: "10px 0", fontSize: 12.5, cursor: "pointer" }}>
                    <input type="radio" name="attending" value="unsure" /> Noch unsicher
                  </label>
                  <label style={{ flex: "1 1 100px", display: "flex", alignItems: "center", gap: 6, padding: "10px 0", fontSize: 12.5, cursor: "pointer" }}>
                    <input type="radio" name="attending" value="no" /> Leider nicht
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
                <button
                  type="submit"
                  style={{ marginTop: 6, padding: 14, background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Zusage senden
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("seating") && (
        <section id="sitzplatz" style={{ maxWidth: 420, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "28px 26px", textAlign: "center" }}>
            <div style={{ fontFamily: headingFont, fontSize: 20, marginBottom: 8 }}>Finde deinen Sitzplatz</div>
            <p style={{ fontSize: 12.5, opacity: 0.75, marginBottom: 18 }}>Gib deinen Namen ein.</p>
            <form action={findSeat.bind(null, event.id, event.slug)} style={{ display: "flex", gap: 8 }}>
              <GuestNameField
                name="seatName"
                placeholder="Euer Name"
                required
                defaultValue={guestDisplayName}
                style={{ flex: 1, padding: "12px 14px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13.5 }}
              />
              <button type="submit" style={{ padding: "0 18px", background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Suchen
              </button>
            </form>
            {seatResult && (
              <p style={{ fontSize: 14, marginTop: 18, fontWeight: 600 }}>
                {seatResult === "notfound" ? "Kein Sitzplatz gefunden." : `Euer Tisch: ${decodeURIComponent(seatResult)}`}
              </p>
            )}
          </div>
        </section>
      )}

      {isModuleOn("menu") && menuItems.length > 0 && (
        <section id="menu" style={{ maxWidth: 480, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 20 }}>
            Menü
          </div>
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

      {isModuleOn("gallery") && (
        <section id="galerie" style={{ maxWidth: 640, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 20 }}>
            Teilt eure schönsten Momente
          </div>

          {galleryPhotos.length > 0 && (
            <PhotoWall eventId={event.id} photos={galleryPhotos} taggedGuests={taggedGuests} colors={colors} />
          )}

          <div style={{ border: `1px solid ${colors.accent}55`, padding: "22px 24px", textAlign: "center" }}>
            {galleryStatus === "success" ? (
              galleryMediaId ? (
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
                <FileField name="file" accept={mediaAccept} required autoSubmit label="Foto oder Video auswählen" colors={colors} />
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("guestbook") && (
        <section id="gaestebuch" style={{ maxWidth: 480, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 20 }}>
            Eure Nachrichten
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
                <button type="submit" style={{ padding: 12, background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Nachricht senden
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("music-requests") && (
        <section id="musikwuensche" style={{ maxWidth: 420, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 20 }}>
            Musikwünsche
          </div>
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
                <button type="submit" style={{ padding: 12, background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Wunsch senden
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {isModuleOn("wishlist") && wishlistItems.length > 0 && (
        <section id="wunschliste" style={{ maxWidth: 480, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 20 }}>
            Wunschliste
          </div>
          {(["GIFT", "CASH", "HONEYMOON", "EXTERNAL"] as const)
            .map((type) => ({ type, items: wishlistItems.filter((w) => w.type === type) }))
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
            ))}
        </section>
      )}

      {isModuleOn("thank-you-card") && isPastEvent && (
        <section style={{ maxWidth: 480, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 10, color: colors.accent }}>♥</div>
            <div style={{ fontFamily: headingFont, fontSize: 19, marginBottom: 12 }}>Danke euch von Herzen</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85 }}>
              {thankYouMessage || `Danke, dass ihr diesen Tag mit uns gefeiert habt! — ${event.title}`}
            </p>
          </div>
        </section>
      )}

      <footer style={{ textAlign: "center", padding: "24px 28px 40px", fontSize: 11, opacity: 0.5 }}>
        Erstellt mit einladi
      </footer>
    </main>
  );
}
