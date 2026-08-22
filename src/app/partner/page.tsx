import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publicHost } from "@/lib/site";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const orderStatusLabel: Record<string, string> = {
  PENDING: "Ausstehend",
  PAID: "Bezahlt",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
};

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "18px 20px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 6, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

export default async function PartnerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.partnerId) {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { id: user.partnerId },
    include: {
      users: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { package: true, user: true, event: true },
      },
    },
  });

  if (!partner) redirect("/dashboard");

  const referredCustomers = partner.users.filter((u) => u.role === "CUSTOMER");
  const paidOrders = partner.orders.filter((o) => o.status === "PAID");
  const revenue = paidOrders.reduce((sum, o) => sum + o.amountCents, 0);
  const commission = revenue * (partner.commissionRate ?? 0);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, color: "var(--ink)", marginBottom: 6 }}>
        {partner.name}
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        Provisionssatz: {Math.round((partner.commissionRate ?? 0) * 100)}%
      </p>

      <div style={{ border: "1px solid var(--line)", padding: "18px 20px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Dein Empfehlungslink</div>
        <div style={{ fontSize: 14, color: "var(--terracotta-dark)" }}>{publicHost()}/p/{partner.slug}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6 }}>
          Kunden, die über diesen Link ein Konto anlegen und ein Event erstellen, werden dir automatisch zugeordnet.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 36 }}>
        <Tile label="Vermittelte Kunden" value={String(referredCustomers.length)} />
        <Tile label="Bezahlte Bestellungen" value={String(paidOrders.length)} />
        <Tile label="Umsatz" value={eur.format(revenue / 100)} />
        <Tile label="Deine Provision" value={eur.format(commission / 100)} />
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 12 }}>Bestellungen</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {partner.orders.map((o) => (
          <div
            key={o.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid var(--line)",
              background: "var(--ivory-2)",
              padding: "14px 16px",
              fontSize: 13,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: "var(--ink)" }}>{o.event?.title ?? "—"}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{o.user.email}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>{o.package.name} · {eur.format(o.amountCents / 100)}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{orderStatusLabel[o.status] ?? o.status}</div>
            </div>
          </div>
        ))}
        {partner.orders.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Noch keine Bestellungen über deinen Link.</p>
        )}
      </div>
    </div>
  );
}
