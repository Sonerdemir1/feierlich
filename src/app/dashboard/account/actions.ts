"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

export async function setPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Nur verlangt, wenn bereits eines gesetzt ist — beim erstmaligen
  // Festlegen ist der Kunde ja schon per Anmelde-Link authentifiziert.
  if (user.passwordHash) {
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) redirect("/dashboard/account?error=wrong-current");
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) redirect("/dashboard/account?error=too-short");
  if (newPassword !== confirmPassword) redirect("/dashboard/account?error=mismatch");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  revalidatePath("/dashboard/account");
  redirect("/dashboard/account?saved=1");
}

export async function removePassword() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: null } });

  revalidatePath("/dashboard/account");
  redirect("/dashboard/account?removed=1");
}
