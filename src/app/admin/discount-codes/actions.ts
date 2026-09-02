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

export async function createDiscountCode(formData: FormData) {
  await requireAdmin();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "PERCENT") === "FIXED" ? "FIXED" : "PERCENT";
  const value = Math.max(0, Number(formData.get("value") ?? 0) || 0);
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  const maxUses = maxUsesRaw ? Math.max(1, Number(maxUsesRaw) || 1) : null;
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  if (!code) throw new Error("Code ist erforderlich.");

  await prisma.discountCode.create({
    data: { code, type, value, maxUses, expiresAt },
  });

  revalidatePath("/admin/discount-codes");
  redirect("/admin/discount-codes");
}

export async function toggleDiscountCodeActive(id: string, nextActive: boolean) {
  await requireAdmin();
  await prisma.discountCode.update({ where: { id }, data: { active: nextActive } });
  revalidatePath("/admin/discount-codes");
  redirect("/admin/discount-codes");
}

export async function deleteDiscountCode(id: string) {
  await requireAdmin();
  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discount-codes");
  redirect("/admin/discount-codes");
}
