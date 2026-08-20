import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePackage } from "../../actions";

export default async function EditPackagePage({ params }: PageProps<"/admin/packages/[id]/edit">) {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) notFound();

  const allModules = await prisma.module.findMany({ orderBy: { sortOrder: "asc" } });
  const selected: string[] = JSON.parse(pkg.features);

  const field = { padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

  return (
    <div>
      <Link href="/admin/packages" style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zu Paketen
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, color: "var(--ink)", margin: "14px 0 24px" }}>
        {pkg.name} bearbeiten
      </h1>

      <form action={updatePackage.bind(null, pkg.id)} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
        <input name="name" defaultValue={pkg.name} required style={field} />
        <textarea name="description" defaultValue={pkg.description ?? ""} rows={2} style={{ ...field, fontFamily: "inherit" }} />
        <label style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
          Preis (€)
          <input name="price" type="number" min={0} step="0.01" defaultValue={pkg.priceCents / 100} style={{ ...field, marginTop: 4, width: 160 }} />
        </label>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Enthaltene Module</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
            {allModules.map((m) => (
              <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "7px 10px" }}>
                <input type="checkbox" name="features" value={m.key} defaultChecked={selected.includes(m.key)} />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" name="active" defaultChecked={pkg.active} />
          Aktiv (auf der Startseite sichtbar)
        </label>

        <button type="submit" className="btn btn-primary" style={{ padding: 14, justifyContent: "center", marginTop: 8 }}>
          Speichern
        </button>
      </form>
    </div>
  );
}
