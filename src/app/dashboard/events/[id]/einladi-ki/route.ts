import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { askEinladiKi, EINLADI_KI_MESSAGE_QUOTA, type EinladiKiChatMessage, type EinladiKiContext } from "@/lib/einladi-ki";

async function requireOwnedEvent(id: string) {
  const session = await auth();
  if (!session?.user) return null;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { eventType: true, guests: { include: { rsvp: true } } },
  });
  if (!event || event.ownerId !== session.user.id) return null;
  return event;
}

function buildContext(event: NonNullable<Awaited<ReturnType<typeof requireOwnedEvent>>>): EinladiKiContext {
  const yesCount = event.guests.filter((g) => g.rsvp?.status === "YES").length;
  const noCount = event.guests.filter((g) => g.rsvp?.status === "NO").length;
  const unsureCount = event.guests.filter((g) => g.rsvp?.status === "PENDING").length;
  return {
    title: event.title,
    subtitle: event.subtitle,
    description: event.description,
    eventTypeName: event.eventType.name,
    eventDateLabel: new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate),
    locationName: event.locationName,
    guestCount: event.guests.length,
    yesCount,
    noCount,
    unsureCount,
  };
}

// Verlauf laden, wenn das Chat-Panel geoeffnet wird.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await requireOwnedEvent(id);
  if (!event) return new Response("Nicht gefunden.", { status: 404 });

  const messages = await prisma.einladiKiMessage.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return Response.json({
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      suggestion: m.suggestionJson ? JSON.parse(m.suggestionJson) : null,
    })),
  });
}

// Neue Nutzer-Nachricht — speichert User- und Assistant-Nachricht, gibt die
// Antwort zurueck. Quota zaehlt nur User-Nachrichten (nicht die Antworten).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await requireOwnedEvent(id);
  if (!event) return new Response("Nicht gefunden.", { status: 404 });

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return new Response("Nachricht darf nicht leer sein.", { status: 400 });

  const userMessageCount = await prisma.einladiKiMessage.count({ where: { eventId: id, role: "user" } });
  if (userMessageCount >= EINLADI_KI_MESSAGE_QUOTA) {
    return Response.json({ error: "quota" }, { status: 429 });
  }

  const priorMessages = await prisma.einladiKiMessage.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "asc" },
    take: 40,
  });
  const history: EinladiKiChatMessage[] = priorMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  history.push({ role: "user", content: message });

  await prisma.einladiKiMessage.create({ data: { eventId: id, role: "user", content: message } });

  let result;
  try {
    result = await askEinladiKi(buildContext(event), history);
  } catch {
    return Response.json({ error: "failed" }, { status: 502 });
  }

  await prisma.einladiKiMessage.create({
    data: {
      eventId: id,
      role: "assistant",
      content: result.reply,
      suggestionJson: result.suggestion ? JSON.stringify(result.suggestion) : null,
    },
  });

  return Response.json({ reply: result.reply, suggestion: result.suggestion });
}
