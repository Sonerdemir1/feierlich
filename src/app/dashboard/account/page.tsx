import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setPassword, removePassword } from "./actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

const errorLabel: Record<string, string> = {
  "wrong-current": "Aktuelles Passwort ist falsch.",
  "too-short": `Neues Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben.`,
  mismatch: "Die beiden Passwörter stimmen nicht überein.",
};

const fieldStyle = { padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

export default async function AccountPage({ searchParams }: PageProps<"/dashboard/account">) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const sp = await searchParams;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const errorKey = typeof sp.error === "string" ? sp.error : undefined;
  const saved = sp.saved === "1";
  const removed = sp.removed === "1";
  const hasPassword = Boolean(user.passwordHash);

  return (
    <div>
      <Link href="/dashboard" style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Dashboard
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 6px" }}>
        Konto
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 28 }}>{user.email}</p>

      {errorKey && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          {errorLabel[errorKey] ?? "Da ist etwas schiefgelaufen."}
        </div>
      )}
      {saved && (
        <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Passwort gespeichert.
        </div>
      )}
      {removed && (
        <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Passwort entfernt — Anmeldung geht wieder nur per Anmelde-Link.
        </div>
      )}

      <div className="card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Passwort-Login</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 20 }}>
          {hasPassword
            ? "Du kannst dich damit direkt per E-Mail + Passwort anmelden, zusätzlich zum Anmelde-Link."
            : "Optional — der Anmelde-Link per E-Mail funktioniert immer, auch ohne Passwort. Ein Passwort ist nur ein schnellerer Zusatzweg."}
        </div>

        <form action={setPassword} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360 }}>
          {hasPassword && (
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
              Aktuelles Passwort
              <input type="password" name="currentPassword" required autoComplete="current-password" style={fieldStyle} />
            </label>
          )}
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
            Neues Passwort
            <input
              type="password"
              name="newPassword"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              style={fieldStyle}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
            Neues Passwort bestätigen
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              style={fieldStyle}
            />
          </label>
          <button type="submit" className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 12.5, alignSelf: "flex-start" }}>
            {hasPassword ? "Passwort ändern" : "Passwort festlegen"}
          </button>
        </form>

        {hasPassword && (
          <form action={removePassword} style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12 }}>
              Passwort entfernen
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
