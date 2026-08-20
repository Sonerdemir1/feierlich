import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateForm } from "@/components/admin/TemplateForm";
import { updateTemplate, archiveTemplate } from "../../actions";

export default async function EditTemplatePage({ params }: PageProps<"/admin/templates/[id]/edit">) {
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <div>
      <Link href="/admin/templates" style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zu Templates
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--ink)", margin: "14px 0 24px" }}>
        Template bearbeiten
      </h1>
      <TemplateForm action={updateTemplate.bind(null, template.id)} defaults={template} submitLabel="Speichern" />

      <form action={archiveTemplate.bind(null, template.id)} style={{ marginTop: 24 }}>
        <button type="submit" style={{ fontSize: 12, color: "#B2543A", background: "none", border: "1px solid #B2543A55", padding: "8px 14px", cursor: "pointer" }}>
          Template archivieren
        </button>
      </form>
    </div>
  );
}
