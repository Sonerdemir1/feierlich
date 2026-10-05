import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDatabaseSession } from "@/lib/db-session";

// NUR fuer lokale, dediziert angelegte Test-Accounts (claude-test@intern.test)
// waehrend eines Claude-Code-Testdurchlaufs — kein Passwort involviert, keine
// echten Kundendaten betroffen. Diese Datei wird vor jedem Push/Merge wieder
// geloescht (siehe CLAUDE.md Regel 9, kein Deploy von Dev-Only-Bypass-Code).
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({ where: { email: "claude-test@intern.test" } });
  if (!user) {
    return NextResponse.json({ error: "test user not found" }, { status: 404 });
  }
  await createDatabaseSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", "http://localhost:3000"));
}
