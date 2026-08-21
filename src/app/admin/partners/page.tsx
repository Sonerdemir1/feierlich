import Link from "next/link";
import { prisma } from "@/lib/prisma";

const typeLabel: Record<string, string> = {
  LOCATION: "Location",
  DJ: "DJ",
  PHOTOGRAPHER: "Fotograf",
  VIDEOGRAPHER: "Videograf",
  PLANNER: "Planer",
  CATERER: "Caterer",
};

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export default async function AdminPartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: { users: true, orders: { where: { status: "PAID" } } },
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)" }}>
          Partner ({partners.length})
        </h1>
        <Link href="/admin/partners/new" className="btn btn-primary" style={{ padding: "9px 18px", fontSize: 12.5 }}>
          Neuer Partner
        </Link>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 24 }}>
        DJs, Locations, Fotografen &amp; Co., die Kunden vermitteln und dafür eine Provision auf bezahlte Bestellungen erhalten.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {partners.map((p) => {
          const revenue = p.orders.reduce((sum, o) => sum + o.amountCents, 0);
          const commission = revenue * (p.commissionRate ?? 0);
          return (
            <Link
              key={p.id}
              href={`/admin/partners/${p.id}/edit`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid var(--line)",
                background: "var(--ivory-2)",
                padding: "16px 20px",
                textDecoration: "none",
                color: "var(--ink)",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3 }}>
                  {typeLabel[p.type] ?? p.type} · {p.users.length} Zugang/Zugänge · {p.orders.length} bezahlte Bestellungen
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{eur.format(revenue / 100)}</div>
                <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                  Provision ({Math.round((p.commissionRate ?? 0) * 100)}%): {eur.format(commission / 100)}
                </div>
              </div>
            </Link>
          );
        })}
        {partners.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Noch keine Partner angelegt.</p>
        )}
      </div>
    </div>
  );
}
