import { ImageResponse } from "next/og";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { qrPng, safeQrColorsFromEvent } from "@/lib/qr";
import { publicHost } from "@/lib/site";
import { loadGoogleFont, SOCIAL_GRAPHIC_SIZES, type SocialGraphicFormat } from "@/lib/social-graphic";
import { fontOptionById } from "@/lib/fonts";

// Erzeugt ein teilbares Social-Media-Bild (Story/Beitrag) mit den echten
// Vorlagenfarben des Events + QR-Code zur Einladungsseite. Nutzt next/og
// (Satori + resvg, in Next.js selbst gebuendelt) statt einer neuen
// Bild-Bibliothek — reine Node-Route, kein Edge-Runtime noetig.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id }, include: { template: true, eventType: true } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const url = new URL(request.url);
  const format: SocialGraphicFormat = url.searchParams.get("format") === "post" ? "post" : "story";
  const download = url.searchParams.get("download") === "1";
  const { width, height } = SOCIAL_GRAPHIC_SIZES[format];

  const templateColors: { primary: string; accent: string; background: string } = JSON.parse(event.template.colors);
  const colors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  const activeStyle: { fontId?: string } = event.styleJson ? JSON.parse(event.styleJson) : {};
  const chosenFont = fontOptionById(activeStyle.fontId);
  const displayFamily = chosenFont?.googleFamily ?? "Playfair Display";

  const dateLabel = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(event.eventDate);
  const targetUrl = `https://${publicHost()}/e/${event.slug}`;
  const qrColors = safeQrColorsFromEvent(colors.primary, colors.background);
  const qrBuffer = await qrPng(targetUrl, qrColors);
  const qrDataUri = `data:image/png;base64,${qrBuffer.toString("base64")}`;

  const text = `${event.title} ${event.subtitle ?? ""} ${dateLabel} ${event.locationName ?? ""} ${event.eventType.name} Scannt für die Einladung EINLADI.DE`;

  let fonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[] = [];
  try {
    const [display, body] = await Promise.all([
      loadGoogleFont(displayFamily, text, 700),
      loadGoogleFont("Inter", text, 400),
    ]);
    fonts = [
      { name: displayFamily, data: display, weight: 700, style: "normal" },
      { name: "Inter", data: body, weight: 400, style: "normal" },
    ];
  } catch {
    // Google Fonts nicht erreichbar — Satori faellt auf seine eingebaute
    // Standardschrift zurueck, das Bild bleibt trotzdem nutzbar.
  }
  const displayFont = fonts.length ? displayFamily : undefined;
  const bodyFont = fonts.length ? "Inter" : undefined;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: colors.background,
          padding: 90,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: colors.accent, fontFamily: bodyFont }}>
          {event.eventType.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: format === "post" ? 58 : 72,
            fontWeight: 700,
            color: colors.primary,
            marginTop: 26,
            fontFamily: displayFont,
          }}
        >
          {event.title}
        </div>
        {event.subtitle && (
          <div style={{ display: "flex", fontSize: 28, color: colors.primary, opacity: 0.8, marginTop: 18, fontFamily: bodyFont }}>
            {event.subtitle}
          </div>
        )}
        <div style={{ display: "flex", width: 64, height: 2, background: colors.accent, marginTop: 44, marginBottom: 44 }} />
        <div style={{ display: "flex", fontSize: 30, color: colors.primary, fontFamily: bodyFont }}>{dateLabel}</div>
        {event.locationName && (
          <div style={{ display: "flex", fontSize: 24, color: colors.primary, opacity: 0.75, marginTop: 10, fontFamily: bodyFont }}>
            {event.locationName}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 64 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori (next/og) rendert kein next/image, nur <img> */}
          <img src={qrDataUri} alt="" width={170} height={170} style={{ borderRadius: 10 }} />
          <div style={{ display: "flex", fontSize: 18, color: colors.primary, opacity: 0.7, marginTop: 14, fontFamily: bodyFont }}>
            Scannt für die Einladung
          </div>
        </div>
      </div>
    ),
    { width, height, fonts }
  );

  if (!download) return image;

  const headers = new Headers(image.headers);
  headers.set("Content-Disposition", `attachment; filename="einladung-${format}-${event.slug}.png"`);
  return new Response(image.body, { headers, status: image.status });
}
