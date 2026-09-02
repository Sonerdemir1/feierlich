import { randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";

// Muss mit session.maxAge in src/auth.ts uebereinstimmen.
const SESSION_MAX_AGE_SECONDS = 60 * 24 * 60 * 60;

// Legt manuell eine echte Datenbank-Session an (gleiche Session-Tabelle,
// gleiches Cookie-Format wie beim Anmelde-Link) — noetig fuer den
// Passwort-Login, da Auth.js' eigener Credentials-Provider technisch immer
// eine JWT-Session erzwingt, unabhaengig von der global gesetzten
// "database"-Strategie (siehe Kommentar in src/auth.ts). Cookie-Name/-Optionen
// hier bewusst identisch zu @auth/core's defaultCookies() nachgebaut, damit
// auth() diese Session exakt wie eine per Anmelde-Link erzeugte erkennt.
export async function createDatabaseSession(userId: string): Promise<void> {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({ data: { sessionToken, userId, expires } });

  const hdrs = await headers();
  const forwardedProto = hdrs.get("x-forwarded-proto");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const useSecureCookies = forwardedProto === "https" || appUrl.startsWith("https://");
  const cookieName = useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token";

  const jar = await cookies();
  jar.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies,
    expires,
  });
}
