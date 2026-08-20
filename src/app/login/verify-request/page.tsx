export default function VerifyRequestPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ivory)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 380 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, marginBottom: 12, color: "var(--ink)" }}>
          Check deine E-Mails
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          Wir haben dir einen Anmelde-Link geschickt.
        </p>
        <p style={{ fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.6, marginTop: 16 }}>
          Entwicklungsmodus: der Link wird noch nicht wirklich per E-Mail verschickt, sondern steht im Server-Terminal.
        </p>
      </div>
    </main>
  );
}
