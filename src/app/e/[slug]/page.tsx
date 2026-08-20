import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Countdown } from "@/components/public/Countdown";
import { submitRsvp } from "./actions";

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
  if (!event) return {};
  return {
    title: `${event.title} – feierlich`,
    description: event.description ?? `${event.eventType.name} am ${new Intl.DateTimeFormat("de-DE").format(event.eventDate)}`,
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
  }

  const eventModules = await prisma.eventModule.findMany({ where: { eventId: event.id } });
  const enabled = new Map(eventModules.map((em) => [em.moduleId, em.enabled]));
  const modules = await prisma.module.findMany();
  const isModuleOn = (key: string) => {
    const m = modules.find((mm) => mm.key === key);
    if (!m) return false;
    return enabled.get(m.id) ?? true;
  };

  const templateColors: TemplateColors = JSON.parse(event.template.colors);
  const templateFonts: TemplateFonts = JSON.parse(event.template.fonts);
  const colors: TemplateColors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  const headingFont = templateFonts.display === templateFonts.body ? "var(--font-body)" : "var(--font-display)";

  const rsvpStatus = typeof sp.rsvp === "string" ? sp.rsvp : undefined;

  return (
    <main style={{ background: colors.background, minHeight: "100vh", color: colors.primary, fontFamily: "var(--font-body)" }}>
      {isOwner && event.status !== "PUBLISHED" && (
        <div style={{ background: "#211C19", color: "#FAF6EF", textAlign: "center", padding: "8px 16px", fontSize: 12 }}>
          Vorschau — dieses Event ist noch nicht veröffentlicht. Nur du siehst diesen Hinweis.
        </div>
      )}

      <section style={{ padding: "72px 28px 48px", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: colors.accent, marginBottom: 20 }}>
          {event.eventType.name}
        </div>
        <h1 style={{ fontFamily: headingFont, fontStyle: headingFont === "var(--font-display)" ? "italic" : "normal", fontWeight: 600, fontSize: "clamp(34px, 6vw, 52px)", margin: 0 }}>
          {event.title}
        </h1>
        {event.subtitle && <p style={{ fontSize: 15, opacity: 0.75, marginTop: 12 }}>{event.subtitle}</p>}
        <div style={{ width: 30, height: 1, background: colors.accent, margin: "24px auto" }} />
        <div style={{ fontSize: 13, letterSpacing: "0.06em", opacity: 0.8 }}>
          {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate)}
          {event.eventTime ? ` · ${event.eventTime} Uhr` : ""}
        </div>

        {isModuleOn("countdown") && (
          <div style={{ marginTop: 32 }}>
            <Countdown targetIso={event.eventDate.toISOString()} accent={colors.accent} />
          </div>
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
          <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, whiteSpace: "pre-line" }}>{event.description}</p>
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
                <input
                  type="text"
                  name="name"
                  placeholder="Euer Name"
                  required
                  style={{ padding: "12px 14px", border: `1px solid ${colors.accent}55`, background: "transparent", color: colors.primary, fontSize: 13.5 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>
                    <input type="radio" name="attending" value="yes" defaultChecked /> Wir kommen
                  </label>
                  <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 0", fontSize: 13, cursor: "pointer" }}>
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

      <footer style={{ textAlign: "center", padding: "24px 28px 40px", fontSize: 11, opacity: 0.5 }}>
        Erstellt mit feierlich
      </footer>
    </main>
  );
}
