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

export async function updatePackage(packageId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceCents = Math.round((Number(formData.get("price") ?? 0) || 0) * 100);
  const active = formData.get("active") === "on";
  const modules = await prisma.module.findMany();
  const selectedKeys = modules.filter((m) => formData.getAll("features").includes(m.key)).map((m) => m.key);

  if (!name) throw new Error("Name ist erforderlich.");

  await prisma.package.update({
    where: { id: packageId },
    data: { name, description, priceCents, active, features: JSON.stringify(selectedKeys) },
  });

  revalidatePath("/admin/packages");
  redirect("/admin/packages");
}
