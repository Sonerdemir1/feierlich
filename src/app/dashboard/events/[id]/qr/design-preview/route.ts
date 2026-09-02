import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildQrDesignSvg, type PrintSize, type QrTheme } from "@/lib/qr-design";
import { safeQrColorsFromEvent } from "@/lib/qr";

// Live-Vorschau fuer das Karten-Design auf der Sitzplan-Seite (Theme/Groesse/
// Tisch per Query-Param) — spiegelt exakt die Parameter, die emailQrDesign
// tatsaechlich verschickt (gleiches primary/accent, kein separates background),
// damit die Vorschau nie vom tatsaechlich versendeten Design abweicht.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id }, include: { template: true } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const url = new URL(request.url);
  const size: PrintSize = url.searchParams.get("size") === "A5" ? "A5" : "A6";
  const themeParam = url.searchParams.get("theme");
  const theme: QrTheme = themeParam === "modern-block" || themeParam === "gold-frame" ? themeParam : "classic";
  const tableId = url.searchParams.get("tableId") ?? "";

  const baseUrl = `${url.protocol}//${url.host}`;
  let targetUrl: string;
  let title: string;
  let subtitle: string;

  if (tableId) {
    const table = await prisma.table.findFirst({ where: { id: tableId, eventId: id } });
    if (!table) return new Response("Tisch nicht gefunden.", { status: 404 });
    targetUrl = `${baseUrl}/e/${event.slug}?tisch=${table.id}#galerie`;
    title = table.name;
    subtitle = "Fotos & Videos teilen";
  } else {
    targetUrl = `${baseUrl}/e/${event.slug}`;
    title = "Einladung";
    subtitle = "Scannt für alle Infos";
  }

  const templateColors: { primary: string; accent: string; background: string } = JSON.parse(event.template.colors);
  const activeColors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  // Kartendesign hat einen fest hellen Standardhintergrund (kein Nachdruck
  // einer dunklen Vorlage) — die Textfarbe muss dazu ausreichend dunkel sein,
  // sonst waere z.B. bei "Gold Line"/"Onyx" (helle Schrift auf dunklem
  // Vorlagenhintergrund) der Titel auf der Karte unsichtbar.
  const { dark: safePrimary, light: safeBackground } = safeQrColorsFromEvent(activeColors.primary, activeColors.background);

  const svg = await buildQrDesignSvg({
    size,
    theme,
    title,
    subtitle,
    targetUrl,
    primary: safePrimary,
    accent: activeColors.accent,
    background: safeBackground,
  });

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
}
