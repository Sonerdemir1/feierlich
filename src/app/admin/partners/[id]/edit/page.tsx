import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PartnerForm } from "@/components/admin/PartnerForm";
import { updatePartner, linkPartnerAccount } from "../../actions";

export default async function EditPartnerPage({ params }: PageProps<"/admin/partners/[id]/edit">) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id }, include: { users: true } });
  if (!partner) notFound();

  const field = { padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

  return (
    <div>
      <Link href="/admin/partners" style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zu Partnern
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--ink)", margin: "14px 0 24px" }}>
        {partner.name} bearbeiten
      </h1>

      <div style={{ border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "16px 18px", marginBottom: 28, maxWidth: 480 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Empfehlungslink</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>feierlich.de/p/{partner.slug}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6 }}>
          Kunden, die über diesen Link ein Konto anlegen, werden diesem Partner zugeordnet.
        </div>
      </div>

      <PartnerForm
        action={updatePartner.bind(null, partner.id)}
        defaults={{
          name: partner.name,
          type: partner.type,
          contactEmail: partner.contactEmail,
          brandColor: partner.brandColor,
          commissionRate: partner.commissionRate,
        }}
        submitLabel="Änderungen speichern"
      />

      <div style={{ marginTop: 36, maxWidth: 480 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Zugänge (Login mit Rolle „Partner“)</div>
        {partner.users.length > 0 ? (
          <ul style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16, paddingLeft: 18 }}>
            {partner.users.map((u) => (
              <li key={u.id}>{u.email}</li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 16 }}>Noch kein Konto verknüpft.</p>
        )}
        <form action={linkPartnerAccount.bind(null, partner.id)} style={{ display: "flex", gap: 10 }}>
          <input name="email" type="email" placeholder="E-Mail des Partner-Kontakts" required style={{ ...field, flex: 1 }} />
          <button type="submit" className="btn btn-ghost" style={{ padding: "0 18px", fontSize: 12.5 }}>
            Verknüpfen
          </button>
        </form>
        <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 6 }}>
          Die Person meldet sich danach ganz normal über /login mit dieser E-Mail an.
        </p>
      </div>
    </div>
  );
}
