import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadWeddingPortraitSource, generateWeddingPortrait, startWeddingPortraitDownloadCheckout } from "./actions";
import {
  weddingPortraitConfigured,
  WEDDING_PORTRAIT_ATTEMPT_QUOTA,
  WEDDING_PORTRAIT_STYLES,
  WEDDING_PORTRAIT_DOWNLOAD_PRICE_CENTS,
  weddingPortraitStyleByKey,
} from "@/lib/ai-wedding-portrait";
import { FileField } from "@/components/public/FileField";
import { AI_BUDGET_EXCEEDED_MESSAGE } from "@/lib/ai-budget-constants";
import type { WeddingPortraitDownload } from "@/generated/prisma/client";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const errorLabel: Record<string, string> = {
  "no-file": "Bitte eine Datei auswählen.",
  "bad-type": "Nur JPG, PNG, WEBP oder GIF sind erlaubt.",
  "too-large": "Datei ist größer als 8 MB.",
  "wedding-portrait-no-style": "Bitte einen Stil auswählen.",
  "wedding-portrait-quota": `Kontingent von ${WEDDING_PORTRAIT_ATTEMPT_QUOTA} kostenlosen Generierungen aufgebraucht.`,
  "wedding-portrait-no-source": "Bitte zuerst ein Foto hochladen.",
  "wedding-portrait-failed": "Die Generierung ist gerade nicht möglich. Bitte später erneut versuchen.",
  "ai-budget": AI_BUDGET_EXCEEDED_MESSAGE,
  "stripe-not-configured": "Zahlungen sind noch nicht eingerichtet. Bitte später erneut versuchen.",
  "wedding-portrait-download-cancelled": "Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.",
};

// Kauf-/Download-Steuerung fuer EIN Portraet — wiederverwendet fuer das
// "Letztes Ergebnis" wie fuer die "Weitere Versuche"-Kacheln, damit beide
// garantiert denselben Stand zeigen (PAID/nicht) statt zweier getrennter,
// potenziell auseinanderlaufender Implementierungen.
function DownloadOrBuyButton({
  eventId,
  attemptId,
  download,
  compact,
}: {
  eventId: string;
  attemptId: string;
  download: WeddingPortraitDownload | null;
  compact?: boolean;
}) {
  const btnStyle = { padding: compact ? "7px 12px" : "9px 16px", fontSize: compact ? 11.5 : 12.5 };
  if (download?.status === "PAID") {
    return (
      <a href={`/dashboard/events/${eventId}/wedding-portrait/download/${attemptId}`} className="btn btn-primary" style={btnStyle}>
        Hochauflösend herunterladen
      </a>
    );
  }
  return (
    <form action={startWeddingPortraitDownloadCheckout.bind(null, eventId, attemptId)}>
      <button type="submit" className="btn btn-ghost" style={btnStyle}>
        Hochauflösend kaufen — {eur.format(WEDDING_PORTRAIT_DOWNLOAD_PRICE_CENTS / 100)}
      </button>
    </form>
  );
}

export default async function WeddingPortraitPage({ params, searchParams }: PageProps<"/dashboard/events/[id]/wedding-portrait">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const event = await prisma.event.findUnique({ where: { id }, include: { weddingPortraitSource: true } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  if (!weddingPortraitConfigured) notFound();

  const [attempts, attemptCount] = await Promise.all([
    prisma.weddingPortraitAttempt.findMany({ where: { eventId: id }, orderBy: { createdAt: "desc" }, include: { download: true } }),
    prisma.weddingPortraitAttempt.count({ where: { eventId: id } }),
  ]);
  const attemptsLeft = Math.max(0, WEDDING_PORTRAIT_ATTEMPT_QUOTA - attemptCount);
  const latestAttempt = attempts[0] ?? null;
  const latestStyle = latestAttempt ? weddingPortraitStyleByKey(latestAttempt.stylePreset) : null;

  const errorKey = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 6px" }}>
        KI-Hochzeitsporträt — {event.title}
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        Ladet ein eigenes Foto hoch — die KI verwandelt es in ein Kunst-Porträt mit euren Namen und Datum. Die
        Vorschau ist kostenlos, niedrig aufgelöst und mit Wasserzeichen versehen.
      </p>

      {errorKey && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          {errorLabel[errorKey] ?? "Da ist etwas schiefgelaufen."}
        </div>
      )}

      {/* Foto-Upload */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 10 }}>Euer Foto</div>
        <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 14 }}>
          Dein Foto wird nur zur Erstellung dieses Porträts verwendet.
        </p>
        {event.weddingPortraitSource && (
          <div style={{ marginBottom: 14, maxWidth: 220 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Nutzer-Upload, keine feste Groesse */}
            <img
              src={event.weddingPortraitSource.url}
              alt=""
              style={{ width: "100%", height: "auto", display: "block", border: "1px solid var(--line)" }}
            />
          </div>
        )}
        <form action={uploadWeddingPortraitSource.bind(null, id)} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", maxWidth: 320 }}>
          <FileField
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            label="Foto auswählen"
            colors={{ primary: "var(--ink)", accent: "var(--terracotta)", background: "var(--ivory)" }}
            autoSubmit
          />
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            {event.weddingPortraitSource ? "Foto ersetzen" : "Foto hochladen"}
          </button>
        </form>
      </div>

      {/* Stilauswahl + Generieren */}
      {event.weddingPortraitSource && (
        <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Stil wählen</div>
          {attemptsLeft > 0 ? (
            <form action={generateWeddingPortrait.bind(null, id)} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 520 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {WEDDING_PORTRAIT_STYLES.map((style, i) => (
                  <label
                    key={style.key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      fontSize: 12.5,
                      color: "var(--ink-soft)",
                      padding: "10px 14px",
                      border: "1px solid var(--line)",
                      background: "var(--ivory-2)",
                      cursor: "pointer",
                      minWidth: 150,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "var(--ink)" }}>
                      <input type="radio" name="style" value={style.key} defaultChecked={i === 0} />
                      {style.label}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>{style.description}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
                  Generieren
                </button>
                <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
                  {attemptsLeft} von {WEDDING_PORTRAIT_ATTEMPT_QUOTA} kostenlosen Versuchen übrig
                </span>
              </div>
            </form>
          ) : (
            <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              Kontingent von {WEDDING_PORTRAIT_ATTEMPT_QUOTA} kostenlosen Generierungen aufgebraucht.
            </p>
          )}
        </div>
      )}

      {/* Letztes Ergebnis */}
      {latestAttempt && (
        <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>
            Letztes Ergebnis {latestStyle ? `— ${latestStyle.label}` : ""}
          </div>
          <div style={{ maxWidth: 340, marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- generiertes Bild, next/image-Optimierung nicht noetig */}
            <img
              src={latestAttempt.previewUrl}
              alt={`KI-Hochzeitsporträt, Stil ${latestStyle?.label ?? latestAttempt.stylePreset}`}
              style={{ width: "100%", height: "auto", display: "block", border: "1px solid var(--line)" }}
            />
          </div>
          <DownloadOrBuyButton eventId={id} attemptId={latestAttempt.id} download={latestAttempt.download} />
        </div>
      )}

      {/* Bisherige Versuche */}
      {attempts.length > 1 && (
        <div style={{ border: "1px solid var(--line)", padding: "20px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Weitere Versuche</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
            {attempts.slice(1).map((attempt) => {
              const style = weddingPortraitStyleByKey(attempt.stylePreset);
              return (
                <div key={attempt.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- generiertes Bild, next/image-Optimierung nicht noetig */}
                  <img
                    src={attempt.previewUrl}
                    alt={`KI-Hochzeitsporträt, Stil ${style?.label ?? attempt.stylePreset}`}
                    style={{ width: "100%", height: "auto", display: "block", border: "1px solid var(--line)" }}
                  />
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4, marginBottom: 8 }}>{style?.label ?? attempt.stylePreset}</div>
                  <DownloadOrBuyButton eventId={id} attemptId={attempt.id} download={attempt.download} compact />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
