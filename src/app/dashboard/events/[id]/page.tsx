import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publicHost } from "@/lib/site";
import {
  uploadCoverImage,
  removeCoverImageBackground,
  startAddOnCheckout,
  generateAiDesignForCover,
  saveModules,
  publishEvent,
  gatedModuleKeys,
  saveDesign,
  resetDesign,
  changeTemplate,
  updateSlug,
  updateEventDetails,
  saveThankYouCard,
  uploadEnvelopeVideo,
  removeEnvelopeVideo,
  uploadBackgroundMusic,
  removeBackgroundMusic,
} from "../actions";
import { createWishlistItem, deleteWishlistItem } from "./wishlist-actions";
import { createMenuItem, deleteMenuItem } from "./menu-actions";
import { deleteMusicRequest } from "./music-requests-actions";
import { checkInGuest } from "./checkin-actions";
import { QrPrintDesignFields } from "@/components/dashboard/QrPrintDesignFields";
import { backgroundRemovalConfigured } from "@/lib/background-removal";
import { aiDesignConfigured, AI_DESIGN_ADDON_KEY, AI_DESIGN_ATTEMPT_QUOTA } from "@/lib/ai-design";
import { aiTextConfigured } from "@/lib/ai-text";
import { FileField } from "@/components/public/FileField";
import { TemplatePreview } from "@/components/marketing/TemplatePreview";
import { FONT_OPTIONS } from "@/lib/fonts";
import { ELEMENT_SIZE_PRESETS, TEXT_ELEMENT_LABELS, type StyleElements, type TextElementKey } from "@/lib/text-style";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { getViewsTrend } from "@/lib/analytics";
import { ViewsTrendChart } from "@/components/dashboard/ViewsTrendChart";
import { RsvpBreakdownBar } from "@/components/dashboard/RsvpBreakdownBar";
import { PlaceAutocompleteInput } from "@/components/dashboard/PlaceAutocompleteInput";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import { LivePreviewFrame } from "@/components/dashboard/LivePreviewFrame";
import { AutoSubmitForm } from "@/components/dashboard/AutoSubmitForm";
import { EinladiKiChat } from "@/components/dashboard/EinladiKiChat";
import { einladiKiConfigured } from "@/lib/einladi-ki";
import { SocialGraphicPreview } from "@/components/dashboard/SocialGraphicPreview";

const statusLabel: Record<string, string> = {
  DRAFT: "Entwurf",
  PUBLISHED: "Veröffentlicht",
  ARCHIVED: "Archiviert",
};

const wishlistTypeLabel: Record<string, string> = {
  GIFT: "Geschenk",
  CASH: "Geldgeschenk",
  HONEYMOON: "Flitterwochen",
  EXTERNAL: "Externe Liste",
};

const menuCourseLabel: Record<string, string> = {
  STARTER: "Vorspeise",
  MAIN: "Hauptgang",
  DESSERT: "Dessert",
  DRINK: "Getränke",
};

const orderStatusLabel: Record<string, string> = {
  PENDING: "Ausstehend",
  PAID: "Bezahlt",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
};

const uploadErrorLabel: Record<string, string> = {
  "no-file": "Bitte eine Datei auswählen.",
  "bad-type": "Nur JPG, PNG, WEBP oder GIF sind erlaubt.",
  "too-large": "Datei ist größer als 8 MB.",
  "no-cover-image": "Bitte zuerst ein Titelbild hochladen.",
  "bg-removal-failed": "Hintergrund-Freistellung ist fehlgeschlagen. Bitte später erneut versuchen.",
  "ai-design-unavailable": "KI-Design ist gerade nicht verfügbar.",
  "ai-design-no-prompt": "Bitte beschreibe, was angepasst werden soll.",
  "ai-design-not-activated": "Bitte zuerst KI-Design aktivieren.",
  "ai-design-quota": `Kontingent von ${AI_DESIGN_ATTEMPT_QUOTA} Versuchen aufgebraucht.`,
  "ai-design-failed": "KI-Design ist fehlgeschlagen. Bitte später erneut versuchen.",
  "stripe-not-configured": "Zahlungen sind noch nicht eingerichtet. Bitte später erneut versuchen.",
  "addon-cancelled": "Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.",
  "payment-required": "Bitte zuerst das Einladungs-Paket bezahlen, bevor das Event veröffentlicht werden kann.",
  "slug-invalid": "Der Link muss mindestens 3 Zeichen haben (Buchstaben, Zahlen, Bindestriche).",
  "slug-taken": "Dieser Link ist schon vergeben — bitte einen anderen wählen.",
  "details-invalid": "Bitte Titel und Datum ausfüllen.",
};

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card" style={{ background: "var(--ivory-2)", padding: "18px 20px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 6, color: "var(--ink)" }}>{value}</div>
      {note && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 4 }}>{note}</div>}
    </div>
  );
}

export default async function EventDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      eventType: true,
      template: true,
      guests: { include: { rsvp: true, checkIn: true } },
      coverImage: true,
      envelopeVideo: true,
      backgroundMusic: true,
      order: { include: { package: true } },
    },
  });

  if (!event || event.ownerId !== session!.user.id) {
    notFound();
  }

  const yesCount = event.guests.filter((g) => g.rsvp?.status === "YES").length;
  const noCount = event.guests.filter((g) => g.rsvp?.status === "NO").length;
  const unsureCount = event.guests.filter((g) => g.rsvp?.status === "PENDING").length;

  const [allModules, eventModules, pendingGallery, pendingGuestbook, aiDesignAddOn, aiDesignAttemptCount, allAddOns, eventAddOns, viewsTrend, tables, wishlistItems, menuItems, musicRequests] =
    await Promise.all([
      prisma.module.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.eventModule.findMany({ where: { eventId: id } }),
      prisma.galleryItem.count({ where: { eventId: id, status: "PENDING" } }),
      prisma.guestbookEntry.count({ where: { eventId: id, status: "PENDING" } }),
      prisma.addOn.findUnique({ where: { key: AI_DESIGN_ADDON_KEY } }),
      prisma.aiDesignAttempt.count({ where: { eventId: id } }),
      prisma.addOn.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.eventAddOn.findMany({ where: { eventId: id } }),
      getViewsTrend(id),
      prisma.table.findMany({ where: { eventId: id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.wishlistItem.findMany({ where: { eventId: id }, orderBy: [{ type: "asc" }, { sortOrder: "asc" }] }),
      prisma.menuItem.findMany({ where: { eventId: id }, orderBy: [{ course: "asc" }, { sortOrder: "asc" }] }),
      prisma.musicRequest.findMany({ where: { eventId: id }, orderBy: { createdAt: "desc" } }),
    ]);
  const enabledByModuleId = new Map(eventModules.map((em) => [em.moduleId, em.enabled]));
  const gatedKeys = await gatedModuleKeys(id);
  // Fuer die Anzeige: zu welchem (noch nicht bezahlten) AddOn gehoert ein
  // gesperrtes Modul, damit direkt ein "Kaufen"-Link daneben stehen kann.
  const addOnByModuleKey = new Map<string, (typeof allAddOns)[number]>();
  for (const addOn of allAddOns) {
    const keys: string[] = JSON.parse(addOn.moduleKeys || "[]");
    keys.forEach((k) => addOnByModuleKey.set(k, addOn));
  }
  const pendingMemories = pendingGallery + pendingGuestbook;
  const canPublish = session!.user.role === "ADMIN" || event.order?.status === "PAID";
  const templateColors: { primary: string; accent: string; background: string } = JSON.parse(event.template.colors);
  const activeColors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  const hasColorOverride = Boolean(event.colorOverride && event.colorOverride !== "{}");
  const activeStyle: { fontId?: string; ornaments?: boolean; elements?: StyleElements } = event.styleJson
    ? JSON.parse(event.styleJson)
    : {};
  const TEXT_ELEMENT_KEYS: TextElementKey[] = ["eventLabel", "title", "subtitle", "family", "date", "description"];
  const hasStyleOverride = Boolean(event.styleJson && event.styleJson !== "{}");

  const allTemplates = await prisma.template.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } });
  const templatesByCategory = new Map<string, typeof allTemplates>();
  for (const t of allTemplates) {
    const list = templatesByCategory.get(t.category) ?? [];
    list.push(t);
    templatesByCategory.set(t.category, list);
  }
  const aiDesignEventAddOn = aiDesignAddOn
    ? await prisma.eventAddOn.findUnique({ where: { eventId_addOnId: { eventId: id, addOnId: aiDesignAddOn.id } } })
    : null;
  const aiDesignActivated = aiDesignEventAddOn?.status === "PAID";
  const aiDesignAttemptsLeft = Math.max(0, AI_DESIGN_ATTEMPT_QUOTA - aiDesignAttemptCount);

  // KI-Design hat oben (im Titelbild-Bereich) eine eigene, spezialisierte
  // Oberflaeche inkl. Kontingent-Anzeige — hier nur die uebrigen AddOns
  // generisch auflisten, damit sie nicht doppelt (und mit widerspruechlichem
  // Status) auftauchen.
  const eventAddOnByAddOnId = new Map(eventAddOns.map((ea) => [ea.addOnId, ea]));
  const otherAddOns = allAddOns.filter((a) => a.key !== AI_DESIGN_ADDON_KEY);

  const errorKey = typeof sp.error === "string" ? sp.error : undefined;
  const modulesSaved = sp.modulesSaved === "1";
  const slugSaved = sp.slugSaved === "1";
  const detailsSaved = sp.detailsSaved === "1";
  const thankYouSaved = sp.thankYouSaved === "1";
  const thankYouModuleId = allModules.find((m) => m.key === "thank-you-card")?.id;
  const thankYouModule = thankYouModuleId ? eventModules.find((em) => em.moduleId === thankYouModuleId) : undefined;
  const thankYouMessage: string = thankYouModule?.config ? (JSON.parse(thankYouModule.config).message ?? "") : "";
  // Gleiche Vorschaubild-Logik wie generateMetadata in /e/[slug] — eigenes
  // Titelbild zuerst, sonst das Kartendesign der Vorlage, damit der Kunde
  // hier sieht, was beim Teilen in WhatsApp/Facebook/Instagram ankommt.
  const shareImage = event.coverImage?.url ?? event.template.previewUrl ?? null;
  const shareUrl = `https://${publicHost()}/e/${event.slug}`;
  const shareDescription =
    event.description ?? `${event.eventType.name} am ${new Intl.DateTimeFormat("de-DE").format(event.eventDate)}`;

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--terracotta-dark)", marginBottom: 8 }}>
        {event.eventType.name} · {event.template.name}
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 32, color: "var(--ink)", marginBottom: 6 }}>
        {event.title}
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 12 }}>
        {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate)} · Status:{" "}
        {statusLabel[event.status] ?? event.status}
      </p>

      <details open style={{ marginBottom: 32 }}>
        <summary style={{ cursor: "pointer", fontSize: 12.5, color: "var(--terracotta-dark)", fontWeight: 600 }}>
          Details bearbeiten
        </summary>
        <form
          action={updateEventDetails.bind(null, event.id)}
          style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, marginTop: 16 }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Titel
            <input
              type="text"
              name="title"
              required
              defaultValue={event.title}
              style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Untertitel (optional)
            <input
              type="text"
              name="subtitle"
              defaultValue={event.subtitle ?? ""}
              style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Anlass-Label (optional)
            <input
              type="text"
              name="eventLabel"
              placeholder={`Standard: ${event.eventType.name}`}
              defaultValue={event.eventLabel ?? ""}
              style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
            />
            <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>
              Ersetzt das kleine Label über dem Namen auf der Karte, z. B. &bdquo;DÜĞÜN DAVETİYESİ&ldquo; — leer lassen für
              den Standardtext.
            </span>
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
              Familie (links, optional)
              <input
                type="text"
                name="familyLeft"
                placeholder="z. B. Demir"
                defaultValue={event.familyLeft ?? ""}
                style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
              Familie (rechts, optional)
              <input
                type="text"
                name="familyRight"
                placeholder="z. B. Yılmaz"
                defaultValue={event.familyRight ?? ""}
                style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
              />
            </label>
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: -6 }}>
            Zeigt einen Zwei-Familien-Block auf der Karte, nur wenn mindestens eines der beiden Felder ausgefüllt ist —
            beide leer lassen, um ihn auszublenden.
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
              Datum
              <input
                type="date"
                name="eventDate"
                required
                defaultValue={event.eventDate.toISOString().slice(0, 10)}
                style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
              Uhrzeit (optional)
              <input
                type="time"
                name="eventTime"
                defaultValue={event.eventTime ?? ""}
                style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
              />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Location (optional)
            <input
              type="text"
              name="locationName"
              placeholder="z. B. Schloss Ehrenfels"
              defaultValue={event.locationName ?? ""}
              style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Adresse (optional)
            {GOOGLE_MAPS_API_KEY ? (
              <PlaceAutocompleteInput
                apiKey={GOOGLE_MAPS_API_KEY}
                name="locationAddress"
                latName="locationLat"
                lngName="locationLng"
                placeholder="Adresse eingeben und Vorschlag auswählen"
                defaultValue={event.locationAddress ?? ""}
              />
            ) : (
              <input
                type="text"
                name="locationAddress"
                defaultValue={event.locationAddress ?? ""}
                style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
              />
            )}
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Beschreibung (optional)
            <textarea
              name="description"
              rows={3}
              defaultValue={event.description ?? ""}
              style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5, fontFamily: "inherit" }}
            />
          </label>
          <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5, alignSelf: "flex-start" }}>
            Speichern
          </button>
        </form>
      </details>

      {errorKey && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          {uploadErrorLabel[errorKey] ?? "Da ist etwas schiefgelaufen."}
        </div>
      )}
      {modulesSaved && (
        <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Module gespeichert.
        </div>
      )}
      {slugSaved && (
        <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Link gespeichert.
        </div>
      )}
      {detailsSaved && (
        <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Details gespeichert.
        </div>
      )}
      {thankYouSaved && (
        <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Dankeskarte gespeichert.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 36 }}>
        <Tile label="Gäste" value={String(event.guests.length)} />
        <Tile
          label="Zusagen"
          value={String(yesCount)}
          note={
            [noCount > 0 ? `${noCount} Absagen` : null, unsureCount > 0 ? `${unsureCount} unsicher` : null]
              .filter(Boolean)
              .join(" · ") || undefined
          }
        />
        <Tile label="Aufrufe" value={String(event.viewCount)} />
        <Tile label="QR-Codes" value="2" note="Eventseite · RSVP" />
      </div>

      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Statistik</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 18 }}>
          Aufrufe der letzten 14 Tage und Zusage-Verteilung unter den Gästen.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
          <div style={{ flex: "1 1 280px", minWidth: 240 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 8 }}>
              Aufrufe
            </div>
            <ViewsTrendChart data={viewsTrend.map((d) => ({ date: d.date.toISOString(), count: d.count }))} />
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 200 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 12 }}>
              Zusagen
            </div>
            <RsvpBreakdownBar yes={yesCount} pending={unsureCount} no={noCount} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Öffentliche Event-Seite</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{publicHost()}/e/{event.slug}</div>
            {event.status !== "PUBLISHED" && (
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6 }}>
                Nur du kannst sie schon jetzt als Vorschau sehen.
              </div>
            )}
          </div>
          <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            {event.status === "PUBLISHED" ? "Seite ansehen" : "Vorschau ansehen"}
          </a>
        </div>

        <details style={{ marginTop: 14 }}>
          <summary style={{ cursor: "pointer", fontSize: 12.5, color: "var(--terracotta-dark)", fontWeight: 600 }}>
            Link bearbeiten
          </summary>
          <form
            action={updateSlug.bind(null, event.id)}
            style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 12 }}
          >
            <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{publicHost()}/e/</span>
            <input
              type="text"
              name="slug"
              defaultValue={event.slug}
              minLength={3}
              required
              style={{ flex: "1 1 180px", padding: "9px 11px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 12.5 }}>
              Speichern
            </button>
          </form>
          <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 6 }}>
            Nur Buchstaben, Zahlen und Bindestriche. Bestehende QR-Codes und geteilte Links zeigen danach ins Leere —
            am besten vor dem ersten Teilen festlegen.
          </div>
        </details>

        <div style={{ borderTop: "1px solid var(--line)", marginTop: 18, paddingTop: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
            So sieht der Link aus, wenn du ihn teilst
          </div>
          <div style={{ display: "flex", gap: 12, border: "1px solid var(--line)", background: "var(--ivory-2)", padding: 12, maxWidth: 420 }}>
            {shareImage && (
              // eslint-disable-next-line @next/next/no-img-element -- Titelbild/Kartendesign, variables Seitenverhaeltnis
              <img src={shareImage} alt="" style={{ width: 56, height: 56, objectFit: "cover", flexShrink: 0, border: "1px solid var(--line)" }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {event.title} – einladi
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {shareDescription}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {publicHost()}
              </div>
            </div>
          </div>

          {event.status === "PUBLISHED" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${event.title} 💌 ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ padding: "8px 14px", fontSize: 12 }}
              >
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ padding: "8px 14px", fontSize: 12 }}
              >
                Facebook
              </a>
              <CopyLinkButton url={shareUrl} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }} />
              <span style={{ fontSize: 11, color: "var(--ink-faint)", alignSelf: "center" }}>
                Instagram &amp; Story: Link kopieren, dann in der Bio oder als Sticker einfügen.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Design & Vorschau */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Design &amp; Vorschau</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Farben, Schriftart &amp; Verzierungen anpassen — jede Änderung speichert automatisch, die Vorschau rechts aktualisiert sich sofort.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          <div style={{ flex: "0 0 260px", minWidth: 240 }}>
            <AutoSubmitForm action={saveDesign.bind(null, event.id)}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                Primär (Text)
                <input type="color" name="primary" defaultValue={activeColors.primary} style={{ width: "100%", height: 40, border: "1px solid var(--line)", cursor: "pointer" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                Akzent
                <input type="color" name="accent" defaultValue={activeColors.accent} style={{ width: "100%", height: 40, border: "1px solid var(--line)", cursor: "pointer" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                Hintergrund
                <input type="color" name="background" defaultValue={activeColors.background} style={{ width: "100%", height: 40, border: "1px solid var(--line)", cursor: "pointer" }} />
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                Schriftart
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(74px, 1fr))", gap: 6 }}>
                  <label className="customizer-font-btn" style={{ display: "block", cursor: "pointer", position: "relative" }}>
                    <input
                      type="radio"
                      name="fontId"
                      value=""
                      defaultChecked={!activeStyle.fontId}
                      style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                    />
                    <span style={{ display: "block", fontFamily: "var(--font-display)", fontStyle: "italic" }}>Aa</span>
                    <small style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 9.5, marginTop: 4 }}>Standard</small>
                  </label>
                  {FONT_OPTIONS.map((f) => (
                    <label key={f.id} className="customizer-font-btn" style={{ display: "block", cursor: "pointer", position: "relative" }}>
                      <input
                        type="radio"
                        name="fontId"
                        value={f.id}
                        defaultChecked={activeStyle.fontId === f.id}
                        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                      />
                      <span
                        style={{
                          display: "block",
                          fontFamily: f.cssVar,
                          fontStyle: f.italic ? "italic" : "normal",
                          textTransform: f.uppercase ? "uppercase" : "none",
                        }}
                      >
                        Aa
                      </span>
                      <small style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 9.5, marginTop: 4 }}>{f.label}</small>
                    </label>
                  ))}
                </div>
              </div>
              <label className="customizer-toggle">
                <input type="checkbox" name="ornaments" defaultChecked={Boolean(activeStyle.ornaments)} />
                <span className="customizer-switch" aria-hidden="true" />
                <span className="customizer-toggle-text">Verzierungen (Eck-Ornamente) anzeigen</span>
              </label>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>Text-Feinsteuerung</div>
                <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 10 }}>
                  Größe &amp; Farbe für jeden Text einzeln — Titel, Untertitel, Datum, Beschreibung.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {TEXT_ELEMENT_KEYS.map((key) => {
                    const el = activeStyle.elements?.[key];
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ flex: "1 1 auto", fontSize: 12, color: "var(--ink-soft)" }}>
                          {TEXT_ELEMENT_LABELS[key]}
                        </span>
                        <select
                          name={`${key}Size`}
                          defaultValue={el?.size ?? "md"}
                          style={{ padding: "7px 8px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 11.5 }}
                        >
                          {ELEMENT_SIZE_PRESETS[key].map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <label
                          title="Eigene Farbe verwenden (sonst folgt der Text der globalen Primär-Farbe oben)"
                          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                        >
                          <input type="checkbox" name={`${key}ColorOn`} defaultChecked={Boolean(el?.color)} style={{ marginRight: 4 }} />
                        </label>
                        <input
                          type="color"
                          name={`${key}Color`}
                          defaultValue={el?.color ?? activeColors.primary}
                          style={{ width: 34, height: 30, border: "1px solid var(--line)", cursor: "pointer", padding: 0 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Änderungen werden automatisch gespeichert.</span>
            </AutoSubmitForm>
            {(hasColorOverride || hasStyleOverride) && (
              <form action={resetDesign.bind(null, event.id)} style={{ marginTop: 8 }}>
                <button type="submit" className="btn btn-ghost" style={{ padding: "9px 14px", fontSize: 12, width: "100%" }}>
                  Zurücksetzen auf Vorlage
                </button>
              </form>
            )}
          </div>
          <div style={{ flex: "1 1 360px", minWidth: 260 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 8 }}>
              Tipp: Titel, Untertitel und Beschreibung direkt in der Vorschau anklicken und bearbeiten.
            </div>
            <LivePreviewFrame
              src={`/e/${event.slug}?dashboardPreview=1`}
              frameKey={`${event.templateId}-${event.colorOverride ?? "default"}-${event.styleJson ?? "default"}`}
            />
          </div>
        </div>
      </div>

      {/* Vorlage wechseln */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Vorlage</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 14 }}>
          Aktuell: <strong>{event.template.name}</strong> ({event.template.category}). Beim Wechsel werden Farben,
          Schriftart und Verzierungen auf die neue Vorlage zurückgesetzt.
        </div>
        <details>
          <summary style={{ cursor: "pointer", fontSize: 12.5, color: "var(--terracotta-dark)", fontWeight: 600 }}>
            Andere Vorlage wählen
          </summary>
          <form action={changeTemplate.bind(null, event.id)} style={{ marginTop: 16 }}>
            {[...templatesByCategory.entries()].map(([category, items]) => (
              <div key={category} style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>{category}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                  {items.map((t) => (
                    <label key={t.id} className="tpl-pick">
                      <input type="radio" name="templateId" value={t.id} defaultChecked={t.id === event.templateId} style={{ position: "absolute", opacity: 0 }} />
                      <TemplatePreview layoutKey={t.layoutKey} />
                      <div className="tpl-pick-label">{t.name}</div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
              Vorlage übernehmen
            </button>
          </form>
        </details>
      </div>

      {/* Titelbild */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Titelbild</div>
        {event.coverImage && (
          <div style={{ marginBottom: 14, maxWidth: 320 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user upload with unknown dimensions, no image-processing dep installed yet */}
            <img
              src={event.coverImage.url}
              alt=""
              style={{ width: "100%", height: "auto", display: "block", border: "1px solid var(--line)" }}
            />
          </div>
        )}
        <form action={uploadCoverImage.bind(null, event.id)} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", maxWidth: 320 }}>
          <FileField
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            label="Bild auswählen"
            colors={{ primary: "var(--ink)", accent: "var(--terracotta)", background: "var(--ivory)" }}
          />
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            {event.coverImage ? "Bild ersetzen" : "Bild hochladen"}
          </button>
        </form>
        {event.coverImage && backgroundRemovalConfigured && (
          <form action={removeCoverImageBackground.bind(null, event.id)} style={{ marginTop: 10 }}>
            <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
              Hintergrund entfernen
            </button>
          </form>
        )}

        {event.coverImage && aiDesignConfigured && aiDesignAddOn && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>KI-Design</div>
            {!aiDesignActivated ? (
              <>
                <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10 }}>
                  Titelbild per KI-Prompt anpassen (z. B. Hintergrund, Lichtstimmung) —{" "}
                  {(aiDesignAddOn.priceCents / 100).toFixed(2)} € für {AI_DESIGN_ATTEMPT_QUOTA} Versuche.
                </p>
                <form action={startAddOnCheckout.bind(null, event.id)}>
                  <input type="hidden" name="addOnKey" value={AI_DESIGN_ADDON_KEY} />
                  <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
                    KI-Design aktivieren
                  </button>
                </form>
              </>
            ) : aiDesignAttemptsLeft > 0 ? (
              <form action={generateAiDesignForCover.bind(null, event.id)} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
                <textarea
                  name="prompt"
                  placeholder="z. B. warmes Abendlicht, goldenes Bokeh im Hintergrund"
                  required
                  rows={2}
                  style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13, fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
                    Generieren
                  </button>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
                    {aiDesignAttemptsLeft} von {AI_DESIGN_ATTEMPT_QUOTA} Versuchen übrig
                  </span>
                </div>
              </form>
            ) : (
              <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                Kontingent von {AI_DESIGN_ATTEMPT_QUOTA} Versuchen aufgebraucht.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Video-Umschlag */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Video-Umschlag</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Statt der Standard-Animation spielt beim Antippen euer eigenes Video, danach erscheint die Einladung — Modul
          &bdquo;Video-Einladung&ldquo; muss dafür aktiviert sein.
        </div>
        {event.envelopeVideo && (
          <div style={{ marginBottom: 14, maxWidth: 240 }}>
            <video src={event.envelopeVideo.url} controls style={{ width: "100%", display: "block", border: "1px solid var(--line)" }} />
          </div>
        )}
        <form action={uploadEnvelopeVideo.bind(null, event.id)} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", maxWidth: 360 }}>
          <FileField
            name="file"
            accept="video/mp4,video/quicktime,video/webm"
            required
            label="Video auswählen"
            colors={{ primary: "var(--ink)", accent: "var(--terracotta)", background: "var(--ivory)" }}
          />
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            {event.envelopeVideo ? "Video ersetzen" : "Video hochladen"}
          </button>
        </form>
        {event.envelopeVideo && (
          <form action={removeEnvelopeVideo.bind(null, event.id)} style={{ marginTop: 10 }}>
            <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
              Video entfernen
            </button>
          </form>
        )}
      </div>

      {/* Hintergrundmusik */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Hintergrundmusik</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Gäste schalten den Titel per Button auf der Einladungsseite selbst ein (kein Autoplay) — Modul
          &bdquo;Hintergrundmusik&ldquo; muss dafür aktiviert sein.
        </div>
        {event.backgroundMusic && (
          <audio src={event.backgroundMusic.url} controls style={{ display: "block", marginBottom: 14, maxWidth: 320 }} />
        )}
        <form action={uploadBackgroundMusic.bind(null, event.id)} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", maxWidth: 360 }}>
          <FileField
            name="file"
            accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg"
            required
            label="Musik auswählen"
            colors={{ primary: "var(--ink)", accent: "var(--terracotta)", background: "var(--ivory)" }}
          />
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            {event.backgroundMusic ? "Titel ersetzen" : "Titel hochladen"}
          </button>
        </form>
        {event.backgroundMusic && (
          <form action={removeBackgroundMusic.bind(null, event.id)} style={{ marginTop: 10 }}>
            <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
              Musik entfernen
            </button>
          </form>
        )}
      </div>

      {/* Module */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Module für dieses Event</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Nur aktivierte Module erscheinen später auf der Event-Seite.
        </div>
        <form action={saveModules.bind(null, event.id)}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 18 }}>
            {allModules.map((m) => {
              const isGated = gatedKeys.has(m.key);
              const checked = !isGated && (enabledByModuleId.get(m.id) ?? true);
              const gatingAddOn = isGated ? addOnByModuleKey.get(m.key) : undefined;
              return (
                <label
                  key={m.id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9,
                    fontSize: 13,
                    color: isGated ? "var(--ink-faint)" : "var(--ink-soft)",
                    padding: "10px 12px",
                    background: "var(--ivory-2)",
                  }}
                >
                  <input type="checkbox" name="modules" value={m.key} defaultChecked={checked} disabled={isGated} style={{ marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, color: isGated ? "var(--ink-faint)" : "var(--ink)" }}>{m.name}</span>
                      {isGated && gatingAddOn ? (
                        <span style={{ marginLeft: "auto", fontSize: 9.5, color: "var(--terracotta-dark)", fontWeight: 600, whiteSpace: "nowrap" }}>
                          Zusatzpaket · {(gatingAddOn.priceCents / 100).toFixed(2)} €
                        </span>
                      ) : (
                        m.isPremium && (
                          <span style={{ marginLeft: "auto", fontSize: 9.5, color: "var(--gold)", fontWeight: 600 }}>PREMIUM</span>
                        )
                      )}
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 3, lineHeight: 1.4 }}>{m.description}</div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
            Module speichern
          </button>
        </form>
      </div>

      {/* Dankeskarte */}
      {thankYouModuleId && (
        <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Digitale Dankeskarte</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
            Erscheint automatisch für eure Gäste auf der Event-Seite, sobald das Datum vorbei ist — kein separater
            Versand nötig. Ohne eigenen Text wird ein Standard-Dank angezeigt.
          </div>
          <form action={saveThankYouCard.bind(null, event.id)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              name="thankYouMessage"
              defaultValue={thankYouMessage}
              placeholder={`Von Herzen: Danke, dass ihr diesen Tag mit uns gefeiert habt! — ${event.title}`}
              rows={3}
              maxLength={500}
              style={{ padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", color: "var(--ink)", fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5, alignSelf: "flex-start" }}>
              Dankeskarte speichern
            </button>
          </form>
        </div>
      )}

      {/* Zusatzpakete */}
      {otherAddOns.length > 0 && (
        <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Zusatzpakete</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
            Unabhängig vom gewählten Einladungs-Paket dazubuchbar.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {otherAddOns.map((addOn) => {
              const eventAddOn = eventAddOnByAddOnId.get(addOn.id);
              const isPaid = eventAddOn?.status === "PAID";
              return (
                <div
                  key={addOn.id}
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--ivory-2)",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      {addOn.name} · {(addOn.priceCents / 100).toFixed(2)} €
                    </div>
                    {addOn.description && (
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2, maxWidth: 480 }}>
                        {addOn.description}
                      </div>
                    )}
                  </div>
                  {isPaid ? (
                    <span style={{ fontSize: 11, color: "var(--sage)", fontWeight: 700 }}>Aktiv</span>
                  ) : (
                    <form action={startAddOnCheckout.bind(null, event.id)}>
                      <input type="hidden" name="addOnKey" value={addOn.key} />
                      <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
                        Kaufen
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR-Codes */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>QR-Codes</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Rohe QR-Codes zum direkten Download. Für die gestaltete Karte samt Druckauftrag siehe unten.
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            ["EVENT_PAGE", "Eventseite"],
            ["RSVP", "RSVP"],
          ].map(([type, label]) => (
            <div key={type} style={{ textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- server-generated SVG, not an optimizable asset */}
              <img
                src={`/dashboard/events/${event.id}/qr/${type}?format=svg`}
                alt={`QR-Code ${label}`}
                width={110}
                height={110}
                style={{ border: "1px solid var(--line)", background: "var(--ivory)" }}
              />
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>{label}</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 6 }}>
                <a href={`/dashboard/events/${event.id}/qr/${type}?format=svg&download=1`} style={{ fontSize: 11 }}>
                  SVG
                </a>
                <a href={`/dashboard/events/${event.id}/qr/${type}?format=png&download=1`} style={{ fontSize: 11 }}>
                  PNG
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Karte herunterladen */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Karte herunterladen</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Gestaltete Tisch-/Aufsteller-Karte mit eurem QR-Code — Design wählen, herunterladen, selbst ausdrucken.
        </div>
        <QrPrintDesignFields eventId={event.id} tables={tables} />
      </div>

      {/* Wunschliste */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Wunschliste</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Geschenkewünsche für eure Gäste — sichtbar, wenn das Modul &bdquo;Wunschliste&ldquo; aktiviert ist.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          {wishlistItems.map((w) => (
            <div
              key={w.id}
              style={{
                border: "1px solid var(--line)",
                background: "var(--ivory-2)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                rowGap: 8,
                fontSize: 13,
              }}
            >
              <span style={{ fontWeight: 600 }}>{w.title}</span>
              <span style={{ color: "var(--ink-faint)", fontSize: 11.5 }}>{wishlistTypeLabel[w.type] ?? w.type}</span>
              <form action={deleteWishlistItem.bind(null, event.id, w.id)}>
                <button type="submit" style={{ fontSize: 11, color: "#B2543A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Entfernen
                </button>
              </form>
            </div>
          ))}
        </div>
        <form action={createWishlistItem.bind(null, event.id)} style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 10 }}>
          <select name="type" defaultValue="GIFT" style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 }}>
            {Object.entries(wishlistTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input name="title" placeholder="z. B. Kaffeemaschine" required style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13, flex: "1 1 200px", minWidth: 0 }} />
          <input name="url" placeholder="Link (optional)" style={{ padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13, flex: "1 1 200px", minWidth: 0 }} />
          <button type="submit" className="btn btn-ghost" style={{ padding: "10px 18px", fontSize: 12.5 }}>
            + Eintrag hinzufügen
          </button>
        </form>
      </div>

      {/* Digitale Menükarte */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Digitale Menükarte</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Gänge und Gerichte — Hauptgänge stehen euren Gästen bei der RSVP zur Auswahl.
        </div>
        {Object.entries(menuCourseLabel).map(([course, label]) => {
          const items = menuItems.filter((m) => m.course === course);
          return (
            <div key={course} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.05em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                {items.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      border: "1px solid var(--line)",
                      background: "var(--ivory-2)",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                    <form action={deleteMenuItem.bind(null, event.id, m.id)}>
                      <button type="submit" style={{ fontSize: 11, color: "#B2543A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        Entfernen
                      </button>
                    </form>
                  </div>
                ))}
              </div>
              <form action={createMenuItem.bind(null, event.id)} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <input type="hidden" name="course" value={course} />
                <input name="name" placeholder="z. B. Lachsfilet" required style={{ padding: "8px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 12.5, flex: "1 1 180px", minWidth: 0 }} />
                <button type="submit" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }}>
                  + Hinzufügen
                </button>
              </form>
            </div>
          );
        })}
      </div>

      {/* Musikwünsche */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
          Musikwünsche {musicRequests.length > 0 && `(${musicRequests.length})`}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Nur für euch sichtbar — Gäste reichen Wünsche ein, ohne die Liste anderer zu sehen.
        </div>
        {musicRequests.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Noch keine Musikwünsche.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {musicRequests.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--ivory-2)",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <span>
                  <strong>{r.guestName}</strong> — {r.song} · {r.artist}
                  {r.message && <span style={{ color: "var(--ink-faint)" }}> ({r.message})</span>}
                </span>
                <form action={deleteMusicRequest.bind(null, event.id, r.id)}>
                  <button type="submit" style={{ fontSize: 11, color: "#B2543A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    Entfernen
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-in-Übersicht */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Check-in-Übersicht</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          {event.guests.filter((g) => g.checkIn).length} von {event.guests.length} Gästen eingecheckt — Gäste checken
          sich selbst über ihren persönlichen Link oder den Check-in-QR-Code am Eingang ein.
        </div>
        {event.guests.filter((g) => !g.checkIn).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {event.guests
              .filter((g) => !g.checkIn)
              .map((g) => (
                <form key={g.id} action={checkInGuest.bind(null, event.id, g.id)}>
                  <button
                    type="submit"
                    style={{ fontSize: 11.5, padding: "6px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", color: "var(--ink-soft)", cursor: "pointer" }}
                  >
                    {g.firstName} {g.lastName ?? ""} manuell einchecken
                  </button>
                </form>
              ))}
          </div>
        )}
      </div>

      {/* Social-Grafik */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Social-Grafik</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Teilbares Bild mit euren Event-Daten und QR-Code zur Einladung — für Instagram Story oder als Beitrag.
        </div>
        <SocialGraphicPreview eventId={event.id} />
      </div>

      {/* Veroeffentlichen */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Veröffentlichen</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            {event.status === "PUBLISHED"
              ? "Dieses Event ist veröffentlicht."
              : canPublish
                ? "Noch nicht veröffentlicht — nur du siehst es."
                : "Das Einladungs-Paket ist noch nicht bezahlt — erst danach lässt sich das Event veröffentlichen."}
          </div>
        </div>
        {event.status !== "PUBLISHED" && (
          canPublish ? (
            <form action={publishEvent.bind(null, event.id)}>
              <button type="submit" className="btn btn-primary">
                Event veröffentlichen
              </button>
            </form>
          ) : (
            <Link href={`/dashboard/events/${event.id}/billing`} className="btn btn-primary">
              Zur Zahlung
            </Link>
          )
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {aiTextConfigured && (
          <Link
            href={`/dashboard/events/${event.id}/text`}
            className="card"
            style={{
              background: "var(--ivory-2)",
              padding: "16px 18px",
              fontSize: 13,
              color: "var(--ink)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Text-Assistent (KI)</span>
            <span style={{ fontSize: 11, color: "var(--terracotta-dark)" }}>Öffnen →</span>
          </Link>
        )}
        <Link
          href={`/dashboard/events/${event.id}/guests`}
          className="card"
          style={{
            background: "var(--ivory-2)",
            padding: "16px 18px",
            fontSize: 13,
            color: "var(--ink)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Gästeliste</span>
          <span style={{ fontSize: 11, color: "var(--terracotta-dark)" }}>Öffnen →</span>
        </Link>
        <Link
          href={`/dashboard/events/${event.id}/seating`}
          className="card"
          style={{
            background: "var(--ivory-2)",
            padding: "16px 18px",
            fontSize: 13,
            color: "var(--ink)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Sitzplan</span>
          <span style={{ fontSize: 11, color: "var(--terracotta-dark)" }}>Öffnen →</span>
        </Link>
        <Link
          href={`/dashboard/events/${event.id}/billing`}
          className="card"
          style={{
            background: "var(--ivory-2)",
            padding: "16px 18px",
            fontSize: 13,
            color: "var(--ink)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            Paket &amp; Zahlung
            {event.order && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10.5,
                  color: event.order.status === "PAID" ? "var(--sage)" : "var(--gold)",
                  fontWeight: 700,
                }}
              >
                {event.order.package.name} · {orderStatusLabel[event.order.status] ?? event.order.status}
              </span>
            )}
          </span>
          <span style={{ fontSize: 11, color: "var(--terracotta-dark)" }}>Öffnen →</span>
        </Link>
        <Link
          href={`/dashboard/events/${event.id}/memories`}
          className="card"
          style={{
            background: "var(--ivory-2)",
            padding: "16px 18px",
            fontSize: 13,
            color: "var(--ink)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            Gästebuch &amp; Galerie
            {pendingMemories > 0 && (
              <span style={{ marginLeft: 8, fontSize: 10.5, color: "var(--gold)", fontWeight: 700 }}>{pendingMemories} neu</span>
            )}
          </span>
          <span style={{ fontSize: 11, color: "var(--terracotta-dark)" }}>Öffnen →</span>
        </Link>
      </div>

      {einladiKiConfigured && <EinladiKiChat eventId={event.id} />}
    </div>
  );
}
