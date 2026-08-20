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

function readTemplateFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    layoutKey: String(formData.get("layoutKey") ?? "").trim(),
    priceCents: Math.round((Number(formData.get("price") ?? 0) || 0) * 100),
    status: String(formData.get("status") ?? "DRAFT") as "DRAFT" | "ACTIVE" | "ARCHIVED",
    colors: JSON.stringify({
      primary: String(formData.get("colorPrimary") ?? "#211C19"),
      accent: String(formData.get("colorAccent") ?? "#B2543A"),
      background: String(formData.get("colorBackground") ?? "#FAF6EF"),
    }),
    fonts: JSON.stringify({
      display: String(formData.get("fontDisplay") ?? "Cormorant Garamond"),
      body: String(formData.get("fontBody") ?? "Work Sans"),
    }),
  };
}

export async function createTemplate(formData: FormData) {
  await requireAdmin();
  const fields = readTemplateFields(formData);
  if (!fields.name || !fields.category || !fields.layoutKey) {
    throw new Error("Name, Kategorie und Layout-Schlüssel sind erforderlich.");
  }

  await prisma.template.create({
    data: { ...fields, slug: slugify(fields.name) + "-" + Math.random().toString(36).slice(2, 6) },
  });

  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function updateTemplate(templateId: string, formData: FormData) {
  await requireAdmin();
  const fields = readTemplateFields(formData);
  if (!fields.name || !fields.category || !fields.layoutKey) {
    throw new Error("Name, Kategorie und Layout-Schlüssel sind erforderlich.");
  }

  await prisma.template.update({ where: { id: templateId }, data: fields });
  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function archiveTemplate(templateId: string) {
  await requireAdmin();
  await prisma.template.update({ where: { id: templateId }, data: { status: "ARCHIVED" } });
  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}
