import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { Prisma } from "@/generated/prisma/client";

// PrismaAdapter loescht beim Einloggen die alte Session, die zum Browser-
// Cookie gehoert (Session-Rotation). Existiert diese DB-Zeile nicht mehr
// (z.B. weil sie schon abgelaufen/aufgeraeumt wurde, aber der Cookie noch
// im Browser lag), wirft Prisma "P2025 record not found" und der komplette
// Login schlaegt mit einer Fehlermeldung fehl — obwohl aus Nutzersicht
// gar nichts falsch gemacht wurde ("beim zweiten Mal funktioniert es
// nicht"). deleteSession/deleteUser hier idempotent gemacht: eine bereits
// fehlende Zeile ist kein Fehler, das Ziel (Zeile weg) ist ja erreicht.
function tolerantAdapter(adapter: ReturnType<typeof PrismaAdapter>): typeof adapter {
  const originalDeleteSession = adapter.deleteSession?.bind(adapter);
  if (originalDeleteSession) {
    adapter.deleteSession = (async (sessionToken: string) => {
      try {
        return await originalDeleteSession(sessionToken);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          return undefined;
        }
        throw error;
      }
    }) as typeof adapter.deleteSession;
  }
  return adapter;
}

const emailProvider = Nodemailer({
  // Required by the provider's validation even though it's unused —
  // sendVerificationRequest below never touches the SMTP transport.
  server: "smtp://localhost:1025",
  from: process.env.EMAIL_FROM ?? "no-reply@einladi.local",
  async sendVerificationRequest({ identifier, url }) {
    await sendEmail({
      to: identifier,
      subject: "Dein Anmelde-Link für einladi",
      html: `<p>Klicke auf den Link, um dich anzumelden:</p><p><a href="${url}">${url}</a></p><p>Der Link ist 24 Stunden gültig. Wenn du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>`,
    });
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: tolerantAdapter(PrismaAdapter(prisma)),
  // Ohne dies lehnt Auth.js in production ausserhalb von Vercel/Cloudflare
  // Pages Requests als "untrusted host" ab (es kennt Railway/Render/Fly
  // nicht automatisch). Unbedenklich hier: die App laeuft nur unter der
  // eigenen Domain, kein Multi-Tenant-Host-Szenario.
  trustHost: true,
  providers: [emailProvider],
  // 60 statt der Auth.js-Standard-30-Tage: Kunden bearbeiten ihre
  // Einladung ueber Wochen/Monate hinweg immer wieder — jedes Mal per
  // E-Mail-Link neu anmelden zu muessen ("muss einfacher sein"), ist bei
  // einem Hochzeits-/Feier-Tool unnoetige Reibung, kein Sicherheitsrisiko
  // wie bei sensibleren Anwendungen.
  session: { strategy: "database", maxAge: 60 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify-request",
    // Ohne eigene Fehlerseite landet ein bereits benutzter/abgelaufener
    // Anmelde-Link auf Auth.js' eingebauter, unbrandeter Standardseite —
    // fuer Kunden verwirrend ("es kommt eine Fehlermeldung").
    error: "/login/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return session;
    },
  },
});
