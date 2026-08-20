import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";

// DEV-STAND-IN: the magic-link sign-in flow itself (token generation,
// verification, session creation) is fully real. Only the actual email
// DELIVERY is stubbed here — it logs the link to the server console
// instead of sending a real email. Before going live this needs a real
// transactional-email provider (e.g. Resend, Postmark) wired in via the
// `server`/`from` options, which costs money per email sent.
const emailProvider = Nodemailer({
  // Required by the provider's validation even though it's unused here —
  // sendVerificationRequest below never touches the real SMTP transport.
  server: "smtp://localhost:1025",
  from: "no-reply@feierlich.local",
  async sendVerificationRequest({ identifier, url }) {
    console.log("\n──────────────────────────────────────────");
    console.log(`Anmelde-Link für ${identifier}:`);
    console.log(url);
    console.log("──────────────────────────────────────────\n");
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
