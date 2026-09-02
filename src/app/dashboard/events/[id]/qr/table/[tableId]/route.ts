import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { qrPng, qrSvg, safeQrColorsFromEvent } from "@/lib/qr";

// Eigene Route statt Erweiterung von /qr/[type]: ein Tisch-QR ist nicht
// "ein QRCodeType pro Event" (die bestehende QRCode-Tabelle erzwingt genau
// eine Zeile pro (eventId, type) — passt nicht zu "ein QR-Code pro Tisch").
// Ziel-URL ist aus slug+tableId deterministisch ableitbar, daher wird hier
// bewusst keine QRCode-Zeile persistiert — reine On-the-fly-Generierung wie
// bei EVENT_PAGE/RSVP, nur ohne den DB-Zwischenschritt.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const { id, tableId } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id }, include: { template: true } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || table.eventId !== id) return new Response("Tisch nicht gefunden.", { status: 404 });

  const url = new URL(request.url);
  const targetUrl = `${url.protocol}//${url.host}/e/${event.slug}?tisch=${tableId}#galerie`;

  const templateColors: { primary: string; accent: string; background: string } = JSON.parse(event.template.colors);
  const activeColors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  const colors = safeQrColorsFromEvent(activeColors.primary, activeColors.background);

  const format = url.searchParams.get("format") === "png" ? "png" : "svg";
  const download = url.searchParams.get("download") === "1";
  const filename = `qr-tisch-${table.name.toLowerCase().replace(/\s+/g, "-")}-${event.slug}.${format}`;

  if (format === "png") {
    const buffer = await qrPng(targetUrl, colors);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
      },
    });
  }

  const svg = await qrSvg(targetUrl, colors);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
    },
  });
}
