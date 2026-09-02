import Link from "next/link";

const CONTENT: Record<string, { title: string; body: string; cta: string }> = {
  CredentialsSignin: {
    title: "Anmeldung fehlgeschlagen",
    body: "E-Mail-Adresse oder Passwort sind falsch. Falls du noch kein Passwort festgelegt hast, nutze stattdessen den Anmelde-Link.",
    cta: "Zurück zur Anmeldung",
  },
  default: {
    title: "Link ungültig",
    body: "Dieser Anmelde-Link wurde bereits verwendet oder ist abgelaufen. Aus jedem Link kann sich nur einmal angemeldet werden — fordere einfach einen neuen an.",
    cta: "Neuen Anmelde-Link anfordern",
  },
};

export default async function LoginErrorPage({ searchParams }: PageProps<"/login/error">) {
  const sp = await searchParams;
  const errorKey = typeof sp.error === "string" ? sp.error : undefined;
  const { title, body, cta } = CONTENT[errorKey ?? "default"] ?? CONTENT.default;

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
          {title}
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 24 }}>{body}</p>
        <Link href="/login" className="btn btn-primary" style={{ justifyContent: "center", padding: 14, width: "100%" }}>
          {cta}
        </Link>
      </div>
    </main>
  );
}
