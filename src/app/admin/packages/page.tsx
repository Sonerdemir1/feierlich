import Link from "next/link";
import { prisma } from "@/lib/prisma";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>
        Pakete
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 24 }}>
        Preise und enthaltene Module — sofort live auf der Startseite, keine Code-Änderung nötig.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {packages.map((p) => (
          <Link
            key={p.id}
            href={`/admin/packages/${p.id}/edit`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--line)",
              background: "var(--ivory-2)",
              padding: "16px 20px",
              textDecoration: "none",
              color: "var(--ink)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {p.name} {!p.active && <span style={{ color: "var(--ink-faint)", fontWeight: 400, fontSize: 12 }}>(inaktiv)</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3 }}>{p.description}</div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{eur.format(p.priceCents / 100)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
