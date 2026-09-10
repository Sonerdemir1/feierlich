"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAndRecordLoveStoryAttempt, LoveStoryQuotaError } from "@/lib/ai-text";
import { AiBudgetExceededError } from "@/lib/ai-budget-constants";

async function requireOwnedEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.ownerId !== session.user.id) {
    throw new Error("Event nicht gefunden oder kein Zugriff.");
  }
  return event;
}

export async function generateLoveStory(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const question1 = String(formData.get("question1") ?? "").trim().slice(0, 400);
  const question2 = String(formData.get("question2") ?? "").trim().slice(0, 400);
  const question3 = String(formData.get("question3") ?? "").trim().slice(0, 400);
  const question4 = String(formData.get("question4") ?? "").trim().slice(0, 400);
  if (!question1 || !question2 || !question3 || !question4) {
    redirect(`/dashboard/events/${eventId}/love-story?error=love-story-no-input`);
  }

  try {
    await generateAndRecordLoveStoryAttempt(eventId, { question1, question2, question3, question4 });
  } catch (err) {
    if (err instanceof LoveStoryQuotaError) redirect(`/dashboard/events/${eventId}/love-story?error=love-story-quota`);
    if (err instanceof AiBudgetExceededError) redirect(`/dashboard/events/${eventId}/love-story?error=ai-budget`);
    redirect(`/dashboard/events/${eventId}/love-story?error=love-story-failed`);
  }

  revalidatePath(`/dashboard/events/${eventId}/love-story`);
  redirect(`/dashboard/events/${eventId}/love-story`);
}

export async function applyLoveStory(eventId: string, formData: FormData) {
  await requireOwnedEvent(eventId);

  const loveStoryText = String(formData.get("loveStoryText") ?? "").trim();
  if (!loveStoryText) redirect(`/dashboard/events/${eventId}/love-story?error=love-story-no-input`);

  await prisma.event.update({ where: { id: eventId }, data: { loveStoryText } });

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/love-story`);
  redirect(`/dashboard/events/${eventId}/love-story?storyApplied=1`);
}
