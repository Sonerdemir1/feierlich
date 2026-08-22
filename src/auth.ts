import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const emailSendingConfigured = Boolean(RESEND_API_KEY && EMAIL_FROM);

// Ohne RESEND_API_KEY/EMAIL_FROM (lokale Entwicklung) wird der Link nur
// in die Server-Konsole geloggt statt wirklich verschickt — der Rest des
// Magic-Link-Flows (Token, Verifizierung, Session) ist davon unabhaengig
// und voll funktionsfaehig. Resend statt eines SMTP-Providers, weil ein
// simpler REST-Call reicht und keine zusaetzliche Abhaengigkeit braucht.
async function sendMagicLinkEmail(to: string, url: string) {
  if (!emailSendingConfigured) {
    console.log("\n──────────────────────────────────────────");
    console.log(`Anmelde-Link für ${to}:`);
    console.log(url);
    console.log("──────────────────────────────────────────\n");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject: "Dein Anmelde-Link für einladi",
      html: `<p>Klicke auf den Link, um dich anzumelden:</p><p><a href="${url}">${url}</a></p><p>Der Link ist 24 Stunden gültig. Wenn du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>`,
    }),
  });

  if (!res.ok) {
    throw new Error(`E-Mail-Versand fehlgeschlagen (${res.status}): ${await res.text()}`);
  }
}

const emailProvider = Nodemailer({
  // Required by the provider's validation even though it's unused —
  // sendVerificationRequest below never touches the SMTP transport.
  server: "smtp://localhost:1025",
  from: EMAIL_FROM ?? "no-reply@einladi.local",
  async sendVerificationRequest({ identifier, url }) {
    await sendMagicLinkEmail(identifier, url);
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Ohne dies lehnt Auth.js in production ausserhalb von Vercel/Cloudflare
  // Pages Requests als "untrusted host" ab (es kennt Railway/Render/Fly
  // nicht automatisch). Unbedenklich hier: die App laeuft nur unter der
  // eigenen Domain, kein Multi-Tenant-Host-Szenario.
  trustHost: true,
  providers: [emailProvider],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify-request",
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
