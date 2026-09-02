import { cookies } from "next/headers";

export type Locale = "de" | "tr";

export const LOCALE_COOKIE = "einladi_locale";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get(LOCALE_COOKIE)?.value === "tr" ? "tr" : "de";
}
