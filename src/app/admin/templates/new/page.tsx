import Link from "next/link";
import { TemplateForm } from "@/components/admin/TemplateForm";
import { createTemplate } from "../actions";

export default function NewTemplatePage() {
  return (
    <div>
      <Link href="/admin/templates" style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zu Templates
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--ink)", margin: "14px 0 24px" }}>
        Neues Template
      </h1>
      <TemplateForm action={createTemplate} submitLabel="Template anlegen" />
    </div>
  );
}
