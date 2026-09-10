import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aiTextConfigured, generateHashtagSuggestions } from "@/lib/ai-text";
import { AiBudgetExceededError } from "@/lib/ai-budget-constants";

// Direkter KI-Vorschlag-Button im Hashtag-Text-Panel des Dashboard-Editors
// (DesignEditor.tsx) — gleiches Sofort-Speichern-Prinzip wie
// suggest-description/route.ts (Teil C), aber OHNE Kontingent (siehe
// generateHashtagSuggestions()-Kommentar): kein attemptsLeft im Response,
// der Button bleibt immer aktiv.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("Nicht angemeldet.", { status: 401 });
  if (!aiTextConfigured) return new Response("Text-Assistent ist nicht konfiguriert.", { status: 500 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) return new Response("Nicht gefunden.", { status: 404 });

  let socialMediaText: string;
  try {
    socialMediaText = await generateHashtagSuggestions(event.title, event.eventDate.getUTCFullYear());
  } catch (err) {
    if (err instanceof AiBudgetExceededError) return Response.json({ ok: false, error: "budget" }, { status: 429 });
    return Response.json({ ok: false, error: "failed" }, { status: 502 });
  }

  await prisma.event.update({ where: { id }, data: { socialMediaText } });

  revalidatePath(`/dashboard/events/${id}`);
  revalidatePath(`/e/${event.slug}`);

  return Response.json({ ok: true, socialMediaText });
}
