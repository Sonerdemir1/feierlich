"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createEventType(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!name || !category) throw new Error("Name und Kategorie sind erforderlich.");

  const count = await prisma.eventType.count();
  await prisma.eventType.create({
    data: { key: slugify(name) + "-" + Math.random().toString(36).slice(2, 6), name, category, sortOrder: count },
  });

  revalidatePath("/admin/event-types");
  redirect("/admin/event-types");
}

export async function toggleEventTypeActive(eventTypeId: string, nextActive: boolean) {
  await requireAdmin();
  await prisma.eventType.update({ where: { id: eventTypeId }, data: { active: nextActive } });
  revalidatePath("/admin/event-types");
  redirect("/admin/event-types");
}
