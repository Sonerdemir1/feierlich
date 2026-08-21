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

type PartnerTypeValue = "LOCATION" | "DJ" | "PHOTOGRAPHER" | "VIDEOGRAPHER" | "PLANNER" | "CATERER";

function readPartnerFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? "DJ") as PartnerTypeValue,
    contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
    brandColor: String(formData.get("brandColor") ?? "").trim() || null,
    commissionRate: Math.max(0, Math.min(100, Number(formData.get("commissionRate") ?? 0) || 0)) / 100,
  };
}

export async function createPartner(formData: FormData) {
  await requireAdmin();
  const fields = readPartnerFields(formData);
  if (!fields.name) throw new Error("Name ist erforderlich.");

  await prisma.partner.create({
    data: { ...fields, slug: slugify(fields.name) + "-" + Math.random().toString(36).slice(2, 6) },
  });

  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}

export async function updatePartner(partnerId: string, formData: FormData) {
  await requireAdmin();
  const fields = readPartnerFields(formData);
  if (!fields.name) throw new Error("Name ist erforderlich.");

  await prisma.partner.update({ where: { id: partnerId }, data: fields });

  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}

// Verknuepft (oder legt an) das Nutzerkonto, mit dem sich dieser Partner
// einloggt. Es gibt keinen separaten Einladungs-Mechanismus: Konten
// entstehen sonst erst automatisch beim ersten Magic-Link-Login, ein
// Partner-Kontakt braucht seines aber schon vorher, damit die Rolle steht.
export async function linkPartnerAccount(partnerId: string, formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) throw new Error("E-Mail ist erforderlich.");

  await prisma.user.upsert({
    where: { email },
    update: { role: "PARTNER", partnerId },
    create: { email, role: "PARTNER", partnerId },
  });

  revalidatePath(`/admin/partners/${partnerId}/edit`);
  redirect(`/admin/partners/${partnerId}/edit`);
}
