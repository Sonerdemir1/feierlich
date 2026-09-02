import Link from "next/link";
import { sendContactMessage } from "./actions";

export const metadata = { title: "Kontakt – einladi" };

function Logo() {
  return (
    <Link href="/" className="logo">
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" stroke="var(--terracotta)" strokeWidth="1.4">
        <rect x="1" y="1" width="26" height="20" rx="1.5" />
        <path d="M1.5 2l12 9.5 12-9.5" />
      </svg>
      <span>einladi</span>
    </Link>
  );
}

export default async function KontaktPage({ searchParams }: PageProps<"/kontakt">) {
  const sp = await searchParams;
  const success = sp.success === "1";
  const error = sp.error === "missing-fields";

  return (
    <main style={{ background: "var(--ivory)", minHeight: "100vh", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <Logo />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--ink)", marginBottom: 10 }}>
          Kontakt
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.7, marginBottom: 28 }}>
          Fragen zu einladi, eurem Event oder einer Buchung? Schreibt uns — wir melden uns so schnell wie möglich.
          Alternativ direkt per E-Mail an{" "}
          <a href="mailto:info@sonerdemir.de" style={{ color: "var(--terracotta-dark)" }}>
            info@sonerdemir.de
          </a>
          .
        </p>

        {success && (
          <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
            Danke! Deine Nachricht ist angekommen — wir melden uns so schnell wie möglich.
          </div>
        )}
        {error && (
          <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
            Bitte alle Felder ausfüllen.
          </div>
        )}

        <form action={sendContactMessage} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
            Name
            <input
              type="text"
              name="name"
              required
              style={{ padding: "12px 14px", border: "1px solid #D8CBB5", background: "var(--ivory-2)", fontSize: 14 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
            E-Mail
            <input
              type="email"
              name="email"
              required
              placeholder="deine@email.de"
              style={{ padding: "12px 14px", border: "1px solid #D8CBB5", background: "var(--ivory-2)", fontSize: 14 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
            Nachricht
            <textarea
              name="message"
              required
              rows={6}
              style={{ padding: "12px 14px", border: "1px solid #D8CBB5", background: "var(--ivory-2)", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />
          </label>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", padding: 14, marginTop: 4 }}>
            Nachricht senden
          </button>
        </form>
      </div>
    </main>
  );
}
