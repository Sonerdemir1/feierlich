"use server";

import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";

const CONTACT_EMAIL = "info@sonerdemir.de";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendContactMessage(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const message = String(formData.get("message") ?? "").trim().slice(0, 4000);

  if (!name || !email || !message) {
    redirect("/kontakt?error=missing-fields");
  }

  await sendEmail({
    to: CONTACT_EMAIL,
    subject: `Kontaktanfrage von ${name} — einladi.de`,
    html: `<p><strong>Von:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    replyTo: email,
  });

  redirect("/kontakt?success=1");
}
