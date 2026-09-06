import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Erlaubte Stil-Felder je Eintrag — gleiches Vorsichtsprinzip wie
// EDITABLE_FIELDS in inline-text/route.ts bzw. STYLE_FIELDS in
// apply-draft/route.ts, damit kein beliebiges JSON in agendaJson landet.
const STYLE_FIELDS = new Set(["size", "color", "fontId", "align", "bold", "underline", "strikethrough", "italic"]);
const MAX_ITEMS = 30;

function sanitizeStyle(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const entry: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(raw as Record<string, unknown>)) {
    if (STYLE_FIELDS.has(field)) entry[field] = value;
  }
  return Object.keys(entry).length > 0 ? entry : undefined;
}

function sanitizeItems(raw: unknown): { id: string; time: string; label: string; style?: Record<string, unknown> }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is Record<string, unknown> => Boolean(it) && typeof it === "object")
    .slice(0, MAX_ITEMS)
    .map((it) => ({
      id: typeof it.id === "string" && it.id ? it.id : crypto.randomUUID(),
      time: typeof it.time === "string" ? it.time.slice(0, 50) : "",
      label: typeof it.label === "string" ? it.label.slice(0, 200) : "",
      style: sanitizeStyle(it.style),
    }));
}

// Speichert die komplette Ablaufplan-Liste — wie saveModules() (siehe
// actions.ts) behandelt dieser Endpunkt die uebergebene Liste als neuen
// Gesamtzustand (voller Ersatz statt Einzel-Diff), da Hinzufuegen/Entfernen/
// Umsortieren serverseitig ohnehin nur je einen kompletten neuen Zustand
// als Ergebnis hat — genau wie EventEditor.tsx/DesignStudio.tsx ihn lokal
// schon berechnet haben, bevor sie hier speichern.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) return new Response("Ungültige Daten.", { status: 400 });

  const items = sanitizeItems(body.items);
  await prisma.event.update({ where: { id }, data: { agendaJson: JSON.stringify(items) } });
  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true, items });
}
