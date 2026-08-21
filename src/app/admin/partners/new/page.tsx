import Link from "next/link";
import { PartnerForm } from "@/components/admin/PartnerForm";
import { createPartner } from "../actions";

export default function NewPartnerPage() {
  return (
    <div>
      <Link href="/admin/partners" style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zu Partnern
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--ink)", margin: "14px 0 24px" }}>
        Neuer Partner
      </h1>
      <PartnerForm action={createPartner} submitLabel="Partner anlegen" />
    </div>
  );
}
