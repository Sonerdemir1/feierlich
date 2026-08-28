import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PARTNER") redirect("/dashboard");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ivory)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: 10,
          padding: "20px 28px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <a href="/partner" className="logo">
          <svg width="26" height="20" viewBox="0 0 28 22" fill="none" stroke="#B2543A" strokeWidth="1.4">
            <rect x="1" y="1" width="26" height="20" rx="1.5" />
            <path d="M1.5 2l12 9.5 12-9.5" />
          </svg>
          <span>einladi · Partner</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, rowGap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{session.user.email}</span>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
              Abmelden
            </button>
          </form>
        </div>
      </header>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 28px" }}>{children}</main>
    </div>
  );
}
