import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

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
          padding: "20px 28px",
          borderBottom: "1px solid var(--line)",
          background: "#211C19",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/admin" className="logo">
            <svg width="26" height="20" viewBox="0 0 28 22" fill="none" stroke="#B9975B" strokeWidth="1.4">
              <rect x="1" y="1" width="26" height="20" rx="1.5" />
              <path d="M1.5 2l12 9.5 12-9.5" />
            </svg>
            <span style={{ color: "#FAF6EF" }}>feierlich · Admin</span>
          </Link>
          <nav style={{ display: "flex", gap: 20 }}>
            {[
              ["/admin", "Übersicht"],
              ["/admin/customers", "Kunden"],
              ["/admin/events", "Events"],
              ["/admin/templates", "Templates"],
              ["/admin/packages", "Pakete"],
              ["/admin/partners", "Partner"],
              ["/admin/event-types", "Eventtypen"],
            ].map(([href, label]) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: "#C9C1B8" }}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12, borderColor: "#4A423A", color: "#C9C1B8" }}>
            Abmelden
          </button>
        </form>
      </header>
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px" }}>{children}</main>
    </div>
  );
}
