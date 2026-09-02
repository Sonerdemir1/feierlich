const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
export const emailSendingConfigured = Boolean(RESEND_API_KEY && EMAIL_FROM);

export type EmailAttachment = { filename: string; content: string /* base64 */ };

// Verallgemeinerte Version von auth.ts' fruehrerer sendMagicLinkEmail() —
// jetzt fuer jeden E-Mail-Versand im Projekt (Magic-Link-Login, QR-Design-
// Versand etc.), damit der Resend-Aufruf nicht mehrfach dupliziert wird.
// Ohne RESEND_API_KEY/EMAIL_FROM (lokale Entwicklung) wird nur in die
// Server-Konsole geloggt statt wirklich verschickt.
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  // Fuer das Kontaktformular: Absender-Adresse des Nutzers, damit der
  // Betreiber direkt auf die Benachrichtigung antworten kann, statt die
  // Adresse manuell aus dem Text kopieren zu muessen.
  replyTo?: string;
}): Promise<void> {
  if (!emailSendingConfigured) {
    console.log("\n──────────────────────────────────────────");
    console.log(`E-Mail an ${params.to}: ${params.subject}`);
    console.log(params.html);
    if (params.attachments?.length) {
      console.log(`(${params.attachments.length} Anhang/Anhänge, im Dev-Modus nicht angezeigt)`);
    }
    console.log("──────────────────────────────────────────\n");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.attachments ? { attachments: params.attachments } : {}),
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`E-Mail-Versand fehlgeschlagen (${res.status}): ${await res.text()}`);
  }
}
