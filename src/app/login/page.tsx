import Link from "next/link";
import { signIn } from "@/auth";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    await signIn("nodemailer", { ...Object.fromEntries(formData), redirectTo: "/dashboard" });
  }

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
      <div style={{ width: "100%", maxWidth: 380, border: "1px solid var(--line)", padding: "40px 32px", background: "var(--ivory-2)" }}>
        <Link href="/" className="logo" style={{ marginBottom: 28, display: "flex" }}>
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none" stroke="#B2543A" strokeWidth="1.4">
            <rect x="1" y="1" width="26" height="20" rx="1.5" />
            <path d="M1.5 2l12 9.5 12-9.5" />
          </svg>
          <span>feierlich</span>
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 26,
            marginBottom: 10,
            color: "var(--ink)",
          }}
        >
          Anmelden
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 24 }}>
          Gib deine E-Mail-Adresse ein — wir schicken dir einen Anmelde-Link, kein Passwort nötig.
        </p>
        <form action={login} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            name="email"
            required
            placeholder="deine@email.de"
            style={{ padding: "13px 14px", border: "1px solid #D8CBB5", background: "var(--ivory)", fontSize: 13.5 }}
          />
          <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", padding: 14 }}>
            Anmelde-Link senden
          </button>
        </form>
      </div>
    </main>
  );
}
