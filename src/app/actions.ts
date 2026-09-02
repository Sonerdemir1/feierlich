"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export async function setLocale(formData: FormData) {
  const locale: Locale = formData.get("locale") === "tr" ? "tr" : "de";
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  redirect(redirectTo);
}
