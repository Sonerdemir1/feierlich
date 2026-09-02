import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startCheckout } from "./actions";

const statusLabel: Record<string, string> = {
  PENDING: "Ausstehend",
  PAID: "Bezahlt",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(cents / 100);
}

export default async function BillingPage({
  params,
  searchParams,
}: PageProps<"/dashboard/events/[id]/billing">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.ownerId !== session.user.id) notFound();

  const [packages, order] = await Promise.all([
    prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.order.findUnique({ where: { eventId: id }, include: { package: true } }),
  ]);

  const cancelled = sp.cancelled === "1";
  const errorKey = typeof sp.error === "string" ? sp.error : undefined;
  const free = sp.free === "1";

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 6 }}>
        Paket &amp; Zahlung
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 24 }}>Für: {event.title}</p>

      {cancelled && (
        <div style={{ border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.
        </div>
      )}
      {errorKey === "bad-package" && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Dieses Paket ist nicht verfügbar.
        </div>
      )}
      {errorKey === "stripe-not-configured" && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Zahlungen sind noch nicht eingerichtet. Bitte später erneut versuchen.
        </div>
      )}
      {errorKey === "discount-invalid" && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Rabattcode ungültig oder abgelaufen.
        </div>
      )}
      {free && (
        <div style={{ border: "1px solid var(--sage)", background: "#EEF2E8", color: "#3E4A2E", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          Kostenlos freigeschaltet — viel Freude mit eurer Einladung!
        </div>
      )}

      {order && (
        <div style={{ border: "1px solid var(--line)", padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Aktuelle Bestellung</div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            {order.package.name} · {formatPrice(order.amountCents, order.currency)} · {statusLabel[order.status] ?? order.status}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {packages.map((pkg) => {
          const features: string[] = JSON.parse(pkg.features || "[]");
          const isCurrent = order?.packageId === pkg.id && order.status === "PAID";
          return (
            <div
              key={pkg.id}
              style={{
                border: isCurrent ? "1px solid var(--terracotta)" : "1px solid var(--line)",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{pkg.name}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "8px 0", color: "var(--ink)" }}>
                {formatPrice(pkg.priceCents, "EUR")}
              </div>
              {pkg.description && (
                <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10 }}>{pkg.description}</p>
              )}
              <ul style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16, paddingLeft: 16 }}>
                {features.slice(0, 6).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <form action={startCheckout.bind(null, event.id)} style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                <input type="hidden" name="packageId" value={pkg.id} />
                {!isCurrent && (
                  <input
                    name="discountCode"
                    placeholder="Rabattcode (optional)"
                    style={{ padding: "8px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 12 }}
                  />
                )}
                <button
                  type="submit"
                  className={isCurrent ? "btn btn-ghost" : "btn btn-primary"}
                  disabled={isCurrent}
                  style={{ padding: "9px 16px", fontSize: 12.5, width: "100%" }}
                >
                  {isCurrent ? "Aktuelles Paket" : "Jetzt buchen"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
