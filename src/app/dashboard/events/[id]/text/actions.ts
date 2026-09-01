"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvitationCopy, AI_TEXT_ATTEMPT_QUOTA } from "@/lib/ai-text";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

export async function generateInvitationText(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const names = String(formData.get("names") ?? "").trim().slice(0, 200);
  const eventTypeInput = String(formData.get("eventType") ?? "").trim().slice(0, 100);
  const tone = String(formData.get("tone") ?? "herzlich-leger").trim();
  const keyDetails = String(formData.get("keyDetails") ?? "").trim().slice(0, 800);
  if (!names || !eventTypeInput) redirect(`/dashboard/events/${eventId}/text?error=ai-text-no-input`);

  const attemptCount = await prisma.aiTextAttempt.count({ where: { eventId } });
  if (attemptCount >= AI_TEXT_ATTEMPT_QUOTA) redirect(`/dashboard/events/${eventId}/text?error=ai-text-quota`);

  const prompt = `${names} · ${eventTypeInput} · ${tone}${keyDetails ? ` · ${keyDetails}` : ""}`;

  let result;
  try {
    result = await generateInvitationCopy({ names, eventType: eventTypeInput, tone, keyDetails });
  } catch {
    redirect(`/dashboard/events/${eventId}/text?error=ai-text-failed`);
  }

  await prisma.aiTextAttempt.create({
    data: { eventId, prompt, welcomeText: result.welcomeText, description: result.description },
  });

  revalidatePath(`/dashboard/events/${eventId}/text`);
  redirect(`/dashboard/events/${eventId}/text`);
}

export async function applyGeneratedText(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const welcomeText = String(formData.get("welcomeText") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!welcomeText || !description) redirect(`/dashboard/events/${eventId}/text?error=ai-text-no-input`);

  await prisma.event.update({ where: { id: eventId }, data: { subtitle: welcomeText, description } });

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/text`);
  redirect(`/dashboard/events/${eventId}?textApplied=1`);
}
