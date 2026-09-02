import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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
