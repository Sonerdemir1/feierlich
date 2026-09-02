import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Countdown } from "@/components/public/Countdown";
import { PhotoWall } from "@/components/gallery/PhotoWall";
import { GuestbookEntryCard } from "@/components/guestbook/GuestbookEntryCard";
import { GuestNameField } from "@/components/public/GuestNameField";
import { FileField } from "@/components/public/FileField";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import { EnvelopeReveal } from "@/components/marketing/EnvelopeReveal";
import { EnvelopeOpen } from "@/components/marketing/EnvelopeOpen";
import { CornerMotif } from "@/components/marketing/TemplatePreview";
import { fontOptionById } from "@/lib/fonts";
import { recordEventView } from "@/lib/analytics";
import { cardTextZone } from "@/lib/card-frames";
import { elementOverrideStyle, type StyleElements } from "@/lib/text-style";
import { googleCalendarUrl } from "@/lib/ics";
import { isPast } from "@/lib/time";
import { getEventWeather, weatherCodeInfo } from "@/lib/weather";
import { submitRsvp, findSeat, uploadGalleryPhoto, submitGuestbookEntry } from "./actions";

type TemplateColors = { primary: string; accent: string; background: string };
type TemplateFonts = { display: string; body: string };

async function getEvent(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: { eventType: true, template: true, coverImage: true, owner: true },
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

  if (!isOwner) {
    await prisma.event.update({ where: { id: event.id }, data: { viewCount: { increment: 1 } } });
    await recordEventView(event.id);
  }

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
  // Pro-Element Groesse/Farbe (Titel/Untertitel/Datum/Beschreibung) —
  // leeres Objekt {} wenn kein Override gesetzt ist, damit die
  // bestehenden clamp()/opacity-Werte an den Einsatzstellen unangetastet
  // bleiben (Object-Spread mit {} aendert nichts).
  const titleOverride = elementOverrideStyle(style.elements, "title");
  const subtitleOverride = elementOverrideStyle(style.elements, "subtitle");
  const dateOverride = elementOverrideStyle(style.elements, "date");
  const descriptionOverride = elementOverrideStyle(style.elements, "description");
  // Echte Schriftart-Wahl aus dem Dashboard-Editor hat Vorrang — ohne
  // gesetztes styleJson faellt es wie bisher auf die automatische
  // Template-Schrift zurueck (Anzeige-/Textschrift des Templates gleich =
  // Body-Schrift nutzen, sonst die Display-Schrift).
  const chosenFont = fontOptionById(style.fontId);
  const headingFont = chosenFont?.cssVar ?? (templateFonts.display === templateFonts.body ? "var(--font-body)" : "var(--font-display)");
  const headingItalic = chosenFont ? Boolean(chosenFont.italic) : headingFont === "var(--font-display)";
  const headingUppercase = Boolean(chosenFont?.uppercase);
  const showOrnaments = Boolean(style.ornaments);
  const envelopeImages: string[] | null = event.template.envelopeSequenceUrls
    ? JSON.parse(event.template.envelopeSequenceUrls)
    : null;
  // Echtes Karten-Design (siehe Template.previewUrl) — Kartenbild als
  // Rahmen mit dem Text in der vorgesehenen freien Mitte, ersetzt die
  // generische Farbflaeche. Hat Vorrang vor den Eck-Ornamenten (Motiv
  // bringt seinen eigenen Rahmen schon mit).
  const cardImageUrl = event.template.previewUrl;
  const applyOrnamentFrame = showOrnaments && !cardImageUrl;
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
  const guestbookStatus = typeof sp.guestbook === "string" ? sp.guestbook : undefined;
  const guestbookError = typeof sp.guestbookError === "string" ? sp.guestbookError : undefined;

  const [galleryItems, guestbookEntries] = await Promise.all([
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
  };
  const mediaAccept = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";

  // Hero-Inhalt (Anlass-Label, Titel/Datum in ihren drei Varianten,
  // Countdown) einmal vorberechnet — envelopeImages-Vorlagen (echte
  // Umschlag-Fotografie) zeigen ihn direkt, alle anderen erst nach der
  // generischen CSS-Umschlag-Animation (siehe EnvelopeOpen).
  const heroInner = (
    <div style={applyOrnamentFrame ? { position: "relative", padding: "22px 18px" } : undefined}>
      {applyOrnamentFrame && (
        <>
          <div style={{ position: "absolute", inset: 0, border: `1px solid ${colors.accent}` }} />
          <div style={{ position: "absolute", inset: 6, border: `1px solid ${colors.accent}66` }} />
          <CornerMotif color={colors.accent} corner="tl" />
          <CornerMotif color={colors.accent} corner="tr" />
          <CornerMotif color={colors.accent} corner="bl" />
          <CornerMotif color={colors.accent} corner="br" />
        </>
      )}
      {cardImageUrl ? (
        <div style={{ position: "relative", maxWidth: 380, margin: "0 auto" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Kartengrafik mit variablem Seitenverhaeltnis je Design, kein fixes next/image-Format */}
          <img
            src={cardImageUrl}
            alt=""
            style={{ width: "100%", height: "auto", display: "block", borderRadius: "var(--radius)", boxShadow: "var(--shadow-md)" }}
          />
          <div
            style={{
              position: "absolute",
              inset: `${textZone.top}% ${textZone.right}% ${textZone.bottom}% ${textZone.left}%`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              // Verteilt Anlass-Label / Name-Gruppe / Datum ueber die
              // gesamte verfuegbare Hoehe der Sicherheitszone, statt sie
              // eng zusammenzudraengen — nutzt den Freiraum, den jede
              // Karte unterschiedlich viel mitbringt.
              justifyContent: "space-evenly",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: colors.accent }}>
              {event.eventType.name}
            </div>
            <div>
              <div
                style={{
                  fontFamily: headingFont,
                  fontStyle: headingItalic ? "italic" : "normal",
                  textTransform: headingUppercase ? "uppercase" : "none",
                  fontWeight: 600,
                  fontSize: "clamp(21px, 5.5vw, 30px)",
                  color: colors.primary,
                  ...titleOverride,
                }}
              >
                {event.title}
              </div>
              {event.subtitle && (
                <p style={{ fontSize: 12.5, opacity: 0.8, marginTop: 8, color: colors.primary, ...subtitleOverride }}>
                  {event.subtitle}
                </p>
              )}
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.04em", color: colors.primary, opacity: 0.85, ...dateOverride }}>
              {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate)}
              {event.eventTime ? ` · ${event.eventTime} Uhr` : ""}
            </div>
          </div>
        </div>
      ) : envelopeImages ? (
        <>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: colors.accent, marginBottom: 20 }}>
            {event.eventType.name}
          </div>
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <EnvelopeReveal images={envelopeImages}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: headingFont,
                    fontStyle: headingItalic ? "italic" : "normal",
                    textTransform: headingUppercase ? "uppercase" : "none",
                    fontWeight: 600,
                    fontSize: "clamp(24px, 5vw, 34px)",
                    color: colors.primary,
                    ...titleOverride,
                  }}
                >
                  {event.title}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 11.5,
                    letterSpacing: "0.06em",
                    color: colors.primary,
                    opacity: 0.8,
                    ...dateOverride,
                  }}
                >
                  {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate)}
                  {event.eventTime ? ` · ${event.eventTime} Uhr` : ""}
                </div>
              </div>
            </EnvelopeReveal>
          </div>
          {event.subtitle && (
            <p style={{ fontSize: 15, opacity: 0.75, marginTop: 24, ...subtitleOverride }}>{event.subtitle}</p>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: colors.accent, marginBottom: 20 }}>
            {event.eventType.name}
          </div>
          <h1
            style={{
              fontFamily: headingFont,
              fontStyle: headingItalic ? "italic" : "normal",
              textTransform: headingUppercase ? "uppercase" : "none",
              fontWeight: 600,
              fontSize: "clamp(34px, 6vw, 52px)",
              margin: 0,
              ...titleOverride,
            }}
          >
            {event.title}
          </h1>
          {event.subtitle && (
            <p style={{ fontSize: 15, opacity: 0.75, marginTop: 12, ...subtitleOverride }}>{event.subtitle}</p>
          )}
          <div style={{ width: 30, height: 1, background: colors.accent, margin: "24px auto" }} />
          <div style={{ fontSize: 13, letterSpacing: "0.06em", opacity: 0.8, ...dateOverride }}>
            {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate)}
            {event.eventTime ? ` · ${event.eventTime} Uhr` : ""}
          </div>
        </>
      )}

      {isModuleOn("countdown") && (
        <div style={{ marginTop: 32 }}>
          <Countdown targetIso={event.eventDate.toISOString()} accent={colors.accent} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
        <a
          href={`/e/${event.slug}/ics`}
          style={{
            padding: "9px 16px",
            fontSize: 12,
            border: `1px solid ${colors.accent}88`,
            color: colors.primary,
            textDecoration: "none",
          }}
        >
          In Kalender speichern
        </a>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "9px 16px",
            fontSize: 12,
            border: `1px solid ${colors.accent}88`,
            color: colors.primary,
            textDecoration: "none",
          }}
        >
          Google Kalender
        </a>
      </div>
    </div>
  );

  return (
    <main style={{ background: colors.background, minHeight: "100vh", color: colors.primary, fontFamily: "var(--font-body)" }}>
      {isOwner && event.status !== "PUBLISHED" && (
        <div style={{ background: "#211C19", color: "#FAF6EF", textAlign: "center", padding: "8px 16px", fontSize: 12 }}>
          Vorschau — dieses Event ist noch nicht veröffentlicht. Nur du siehst diesen Hinweis.
        </div>
      )}

      <section style={{ padding: "72px 28px 48px", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        {envelopeImages ? (
          heroInner
        ) : (
          <EnvelopeOpen background={colors.background} accent={colors.accent} primary={colors.primary}>
            {heroInner}
          </EnvelopeOpen>
        )}
      </section>

      {event.coverImage && (
        <div style={{ maxWidth: 640, margin: "0 auto 48px", padding: "0 28px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user upload, unknown dimensions */}
          <img src={event.coverImage.url} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      )}

      {event.description && (
        <section style={{ maxWidth: 560, margin: "0 auto", padding: "0 28px 48px", textAlign: "center" }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line", color: colors.primary, ...descriptionOverride }}>
            {event.description}
          </p>
        </section>
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

      {isModuleOn("rsvp") && (
        <section id="rsvp" style={{ maxWidth: 420, margin: "0 auto", padding: "0 28px 72px" }}>
          <div style={{ border: `1px solid ${colors.accent}55`, padding: "28px 26px" }}>
            <div style={{ fontFamily: headingFont, fontSize: 20, textAlign: "center", marginBottom: 20 }}>Zusagen</div>

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
              <p style={{ fontSize: 13.5 }}>Danke! Euer Foto/Video wird nach kurzer Prüfung sichtbar.</p>
            ) : (
              <form action={uploadGalleryPhoto.bind(null, event.id, event.slug)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {galleryError && <p style={{ fontSize: 12, color: "#C9605C" }}>{uploadErrorLabel[galleryError]}</p>}
                {uploadTable && (
                  <p style={{ fontSize: 12, color: colors.accent, fontWeight: 600 }}>
                    Ihr ladet hoch für: {uploadTable.name}
                  </p>
                )}
                <input type="hidden" name="tableId" value={uploadTable?.id ?? ""} />
                <GuestNameField
                  name="uploaderName"
                  placeholder="Euer Name (optional)"
                  style={{ padding: "11px 13px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13 }}
                />
                <FileField name="file" accept={mediaAccept} required label="Foto oder Video auswählen" colors={colors} />
                <button type="submit" style={{ padding: 12, background: colors.accent, color: colors.background, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Foto/Video hochladen
                </button>
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
