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
} from "../actions";
import { backgroundRemovalConfigured } from "@/lib/background-removal";
import { aiDesignConfigured, AI_DESIGN_ADDON_KEY, AI_DESIGN_ATTEMPT_QUOTA } from "@/lib/ai-design";
import { aiTextConfigured } from "@/lib/ai-text";

const statusLabel: Record<string, string> = {
  DRAFT: "Entwurf",
  PUBLISHED: "Veröffentlicht",
  ARCHIVED: "Archiviert",
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
};

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "18px 20px" }}>
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
      guests: { include: { rsvp: true } },
      coverImage: true,
      order: { include: { package: true } },
    },
  });

  if (!event || event.ownerId !== session!.user.id) {
    notFound();
  }

  const yesCount = event.guests.filter((g) => g.rsvp?.status === "YES").length;
  const noCount = event.guests.filter((g) => g.rsvp?.status === "NO").length;

  const [allModules, eventModules, pendingGallery, pendingGuestbook, aiDesignAddOn, aiDesignAttemptCount, allAddOns, eventAddOns] = await Promise.all([
    prisma.module.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.eventModule.findMany({ where: { eventId: id } }),
    prisma.galleryItem.count({ where: { eventId: id, status: "PENDING" } }),
    prisma.guestbookEntry.count({ where: { eventId: id, status: "PENDING" } }),
    prisma.addOn.findUnique({ where: { key: AI_DESIGN_ADDON_KEY } }),
    prisma.aiDesignAttempt.count({ where: { eventId: id } }),
    prisma.addOn.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.eventAddOn.findMany({ where: { eventId: id } }),
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

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--terracotta-dark)", marginBottom: 8 }}>
        {event.eventType.name} · {event.template.name}
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 32, color: "var(--ink)", marginBottom: 6 }}>
        {event.title}
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 32 }}>
        {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate)} · Status:{" "}
        {statusLabel[event.status] ?? event.status}
      </p>

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 36 }}>
        <Tile label="Gäste" value={String(event.guests.length)} />
        <Tile label="Zusagen" value={String(yesCount)} note={noCount > 0 ? `${noCount} Absagen` : undefined} />
        <Tile label="Aufrufe" value={String(event.viewCount)} />
        <Tile label="QR-Codes" value="2" note="Eventseite · RSVP" />
      </div>

      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
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

      {/* Titelbild */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
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
        <form action={uploadCoverImage.bind(null, event.id)} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required style={{ fontSize: 13 }} />
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

      {/* Module */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    fontSize: 13,
                    color: isGated ? "var(--ink-faint)" : "var(--ink-soft)",
                    padding: "8px 10px",
                    border: "1px solid var(--line)",
                    background: "var(--ivory-2)",
                  }}
                >
                  <input type="checkbox" name="modules" value={m.key} defaultChecked={checked} disabled={isGated} />
                  {m.name}
                  {isGated && gatingAddOn ? (
                    <span style={{ marginLeft: "auto", fontSize: 9.5, color: "var(--terracotta-dark)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      Zusatzpaket · {(gatingAddOn.priceCents / 100).toFixed(2)} €
                    </span>
                  ) : (
                    m.isPremium && (
                      <span style={{ marginLeft: "auto", fontSize: 9.5, color: "var(--gold)", fontWeight: 600 }}>PREMIUM</span>
                    )
                  )}
                </label>
              );
            })}
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
            Module speichern
          </button>
        </form>
      </div>

      {/* Zusatzpakete */}
      {otherAddOns.length > 0 && (
        <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
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
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>QR-Codes</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Zum Ausdrucken auf Einladung, Tischkarten oder Aushang.
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

      {/* Veroeffentlichen */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Veröffentlichen</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            {event.status === "PUBLISHED" ? "Dieses Event ist veröffentlicht." : "Noch nicht veröffentlicht — nur du siehst es."}
          </div>
        </div>
        {event.status !== "PUBLISHED" && (
          <form action={publishEvent.bind(null, event.id)}>
            <button type="submit" className="btn btn-primary">
              Event veröffentlichen
            </button>
          </form>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {aiTextConfigured && (
          <Link
            href={`/dashboard/events/${event.id}/text`}
            style={{
              border: "1px solid var(--line)",
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
          style={{
            border: "1px solid var(--line)",
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
          style={{
            border: "1px solid var(--line)",
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
          style={{
            border: "1px solid var(--line)",
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
          style={{
            border: "1px solid var(--line)",
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
    </div>
  );
}
