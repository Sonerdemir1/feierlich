"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createDatabaseSession } from "@/lib/db-session";

// Bewusst kein signIn("credentials", ...) — siehe Kommentar in src/auth.ts.
export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login/error?error=CredentialsSignin");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) redirect("/login/error?error=CredentialsSignin");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) redirect("/login/error?error=CredentialsSignin");

  await createDatabaseSession(user.id);
  redirect("/dashboard");
}
