import Link from "next/link";

export default function LoginErrorPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ivory)",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, border: "1px solid var(--line)", padding: "40px 32px", background: "var(--ivory-2)", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, marginBottom: 12, color: "var(--ink)" }}>
          Link ungültig
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 24 }}>
          Dieser Anmelde-Link wurde bereits verwendet oder ist abgelaufen. Aus jedem Link kann sich nur
          einmal angemeldet werden — fordere einfach einen neuen an.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ justifyContent: "center", padding: 14, width: "100%" }}>
          Neuen Anmelde-Link anfordern
        </Link>
      </div>
    </main>
  );
}
