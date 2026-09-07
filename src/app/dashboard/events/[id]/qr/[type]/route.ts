import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { qrPng, qrSvg, safeQrColorsFromEvent } from "@/lib/qr";
import type { QRCodeType } from "@/generated/prisma/client";

const SUPPORTED: Record<string, (slug: string) => string> = {
  EVENT_PAGE: (slug) => `/e/${slug}`,
  RSVP: (slug) => `/e/${slug}#rsvp`,
  SEATING: (slug) => `/e/${slug}#sitzplatz`,
  MENU: (slug) => `/e/${slug}#menu`,
  GUESTBOOK: (slug) => `/e/${slug}#gaestebuch`,
  MUSIC_REQUEST: (slug) => `/e/${slug}#musikwuensche`,
  GALLERY_UPLOAD: (slug) => `/e/${slug}#galerie`,
  // Eigene, schlanke Personal-Ansicht statt eines Ankers auf der vollen
  // Gaeste-Seite — siehe der "?checkin=staff"-Zweig in e/[slug]/page.tsx.
  CHECK_IN: (slug) => `/e/${slug}?checkin=staff`,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id }, include: { template: true } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const buildPath = SUPPORTED[type];
  if (!buildPath) return new Response("QR-Code-Typ noch nicht verfügbar.", { status: 400 });

  const url = new URL(request.url);
  const targetUrl = `${url.protocol}//${url.host}${buildPath(event.slug)}`;

  const templateColors: { primary: string; accent: string; background: string } = JSON.parse(event.template.colors);
  const activeColors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  const colors = safeQrColorsFromEvent(activeColors.primary, activeColors.background);

  await prisma.qRCode.upsert({
    where: { eventId_type: { eventId: id, type: type as QRCodeType } },
    update: { targetUrl },
    create: { eventId: id, type: type as QRCodeType, targetUrl },
  });

  const format = url.searchParams.get("format") === "png" ? "png" : "svg";
  const download = url.searchParams.get("download") === "1";
  const filename = `qr-${type.toLowerCase()}-${event.slug}.${format}`;

  if (format === "png") {
    const buffer = await qrPng(targetUrl, colors);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
      },
    });
  }

  const svg = await qrSvg(targetUrl, colors);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
      ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
    },
  });
}
