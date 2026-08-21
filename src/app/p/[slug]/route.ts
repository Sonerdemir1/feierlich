import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REFERRAL_COOKIE = "ref_partner";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// Kurzer, druckbarer Empfehlungslink fuer Partner (DJs, Locations, ...).
// Setzt nur ein Cookie mit dem Partner-Slug; die eigentliche Zuordnung
// passiert beim ersten Event, das der (dann eingeloggte) Kunde anlegt
// (siehe dashboard/events/actions.ts), nicht schon hier bei der Anmeldung.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await prisma.partner.findUnique({ where: { slug } });

  const res = NextResponse.redirect(new URL(partner ? "/login" : "/", req.url));

  if (partner) {
    res.cookies.set(REFERRAL_COOKIE, partner.slug, {
      maxAge: THIRTY_DAYS,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return res;
}
