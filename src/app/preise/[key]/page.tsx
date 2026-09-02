import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { packageSlug, packageKeyFromSlug } from "@/lib/packages";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

// Feste Reihenfolge statt alphabetisch — folgt dem natuerlichen Aufbau
// "erst Basis, dann fuer Gaeste, dann die groesseren Extras".
const CATEGORY_ORDER = ["Basis", "Gäste", "Premium", "Business"];

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" className="logo">
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" stroke="var(--terracotta)" strokeWidth="1.4">
        <rect x="1" y="1" width="26" height="20" rx="1.5" />
        <path d="M1.5 2l12 9.5 12-9.5" />
      </svg>
      <span>einladi</span>
    </Link>
  );
}

async function loadPackage(slug: string) {
  const key = packageKeyFromSlug(slug);
  const pkg = await prisma.package.findFirst({ where: { key, active: true } });
  if (!pkg) return null;
  const featureKeys: string[] = JSON.parse(pkg.features || "[]");
  const modules = await prisma.module.findMany({ where: { key: { in: featureKeys } } });
  const moduleByKey = new Map(modules.map((m) => [m.key, m]));
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: featureKeys.map((k) => moduleByKey.get(k)).filter((m): m is NonNullable<typeof m> => !!m && m.category === category),
  })).filter((g) => g.items.length > 0);
  return { pkg, groups };
}

export async function generateMetadata({ params }: PageProps<"/preise/[key]">): Promise<Metadata> {
  const { key } = await params;
  const data = await loadPackage(key);
  if (!data) return { title: "Paket – einladi" };
  return {
    title: `${data.pkg.name} – Paket & Preise – einladi`,
    description: data.pkg.description ?? undefined,
  };
}

export default async function PackageDetailPage({ params }: PageProps<"/preise/[key]">) {
  const { key } = await params;
  const data = await loadPackage(key);
  if (!data) notFound();
  const { pkg, groups } = data;

  const allPackages = await prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const idx = allPackages.findIndex((p) => p.id === pkg.id);
  const others = allPackages.filter((p) => p.id !== pkg.id);

  return (
    <main style={{ background: "var(--ivory)", minHeight: "100vh", padding: "40px 24px 100px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <Logo />
          <Link href="/#preise" className="studio-back">
            ← Alle Pakete
          </Link>
        </div>

        <div className="eyebrow">{idx === allPackages.length - 1 ? "Größtes Paket" : `Paket ${idx + 1} von ${allPackages.length}`}</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 40, color: "var(--ink)", marginBottom: 10 }}>
          {pkg.name}
        </h1>
        {pkg.description && (
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-soft)", maxWidth: 520, marginBottom: 22 }}>
            {pkg.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 28 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600, color: "var(--ink)" }}>
            {eur.format(pkg.priceCents / 100)}
          </span>
          <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>einmalig</span>
        </div>
        <Link href="/dashboard" className="btn btn-primary" style={{ marginBottom: 48 }}>
          Jetzt mit {pkg.name} starten
        </Link>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {groups.map((group) => (
            <div key={group.category}>
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--terracotta)",
                  marginBottom: 14,
                }}
              >
                {group.category}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {group.items.map((m) => (
                  <div key={m.key} style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: "var(--terracotta-dark)", flexShrink: 0, marginTop: 3 }}>
                      <Check />
                    </span>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{m.name}</div>
                      {m.description && (
                        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 2 }}>
                          {m.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, color: "var(--ink)", marginBottom: 16 }}>
            Andere Pakete
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {others.map((p) => (
              <Link
                key={p.id}
                href={`/preise/${packageSlug(p.key)}`}
                className="card"
                style={{ display: "block", padding: "14px 16px", textDecoration: "none" }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4 }}>{eur.format(p.priceCents / 100)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
