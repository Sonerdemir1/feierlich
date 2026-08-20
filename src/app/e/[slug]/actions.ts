"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function submitRsvp(eventId: string, slug: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`/e/${slug}?rsvp=error`);

  const attending = formData.get("attending") === "yes";
  const countRaw = Number(formData.get("count") ?? 1);
  const count = Number.isFinite(countRaw) && countRaw > 0 ? Math.min(countRaw, 20) : 1;
  const message = String(formData.get("message") ?? "").trim() || null;

  const guest = await prisma.guest.create({
    data: { eventId, firstName: name, invitedCount: count },
  });
  await prisma.rSVP.create({
    data: {
      guestId: guest.id,
      status: attending ? "YES" : "NO",
      attendingCount: attending ? count : 0,
      message,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/e/${slug}`);
  redirect(`/e/${slug}?rsvp=success`);
}
