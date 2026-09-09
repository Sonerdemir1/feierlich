import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { packageSlug } from "@/lib/packages";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

// Gleiche feste Reihenfolge wie /preise/[key] (Basis -> Gaeste -> Premium ->
// Business) — dort schon als "natuerlicher Aufbau" begruendet, hier
// identisch uebernommen fuer ein konsistentes Bild.
const CATEGORY_ORDER = ["Basis", "Gäste", "Premium", "Business"];

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

export const metadata: Metadata = {
  title: "Paketvergleich – einladi",
  description: "Alle vier Pakete von einladi im direkten Funktionsvergleich.",
};

export default async function PackageComparisonPage() {
  const packages = await prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const featuresByPackage = new Map(packages.map((p) => [p.id, new Set<string>(JSON.parse(p.features || "[]"))]));

  // Zeilen der Tabelle = Vereinigungsmenge aller Funktionen, die in
  // MINDESTENS einem der vier aktiven Pakete enthalten sind — nicht der
  // komplette Modul-Katalog. Module, die aktuell in keinem verkauften Paket
  // stecken (z.B. "check-in", nur im inaktiven Business-Paket), sollen hier
  // nicht als Zeile mit vier Kreuzen auftauchen, das waere verwirrend.
  const includedKeys = new Set<string>();
  for (const set of featuresByPackage.values()) for (const key of set) includedKeys.add(key);
  const modules = await prisma.module.findMany({ where: { key: { in: Array.from(includedKeys) } }, orderBy: { sortOrder: "asc" } });
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: modules.filter((m) => m.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <main style={{ background: "var(--ivory)", minHeight: "100vh", padding: "40px 24px 100px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
          <Logo />
          <Link href="/#preise" className="studio-back">
            ← Alle Pakete
          </Link>
        </div>

        <div className="eyebrow">Paketvergleich</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, color: "var(--ink)", marginBottom: 10 }}>
          Alle Pakete im Vergleich
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-soft)", maxWidth: 560, marginBottom: 36 }}>
          Jede Funktion auf einen Blick — welches Paket enthält was.
        </p>

        {/* paddingTop: die "BELIEBTESTE WAHL"-Badge ragt per position:absolute mit
            top:-11px ueber ihren Kartenrahmen hinaus — ohne diesen Puffer schneidet
            der overflowX-Container sie am oberen Rand ab (setzt man overflow-x,
            wird overflow-y implizit ebenfalls "auto" statt "visible", CSS-Spezifikation). */}
        <div style={{ overflowX: "auto", paddingTop: 14, marginBottom: 12 }}>
          <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0 14px 18px 0", minWidth: 200 }} />
                {packages.map((pkg) => {
                  const highlight = pkg.key === "PREMIUM_PLUS";
                  return (
                    <th
                      key={pkg.id}
                      style={{
                        textAlign: "center",
                        padding: "0 10px",
                        verticalAlign: "bottom",
                        minWidth: 130,
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          borderRadius: "var(--radius)",
                          padding: "22px 14px 18px",
                          background: highlight ? "var(--ink)" : "#ffffff",
                          border: highlight ? "1.5px solid var(--terracotta)" : "1px solid var(--line)",
                          boxShadow: highlight ? "var(--shadow-md)" : "var(--shadow-sm)",
                        }}
                      >
                        {highlight && (
                          <div
                            style={{
                              position: "absolute",
                              top: -11,
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: "var(--gold)",
                              color: "var(--ink)",
                              fontSize: 9.5,
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                              padding: "4px 10px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            BELIEBTESTE WAHL
                          </div>
                        )}
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            fontSize: 16,
                            color: highlight ? "var(--ivory)" : "var(--ink)",
                            marginTop: highlight ? 6 : 0,
                          }}
                        >
                          {pkg.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 19,
                            fontWeight: 600,
                            color: highlight ? "var(--ivory)" : "var(--ink)",
                            marginTop: 6,
                          }}
                        >
                          {eur.format(pkg.priceCents / 100)}
                        </div>
                        <Link
                          href={`/preise/${packageSlug(pkg.key)}`}
                          style={{
                            display: "inline-block",
                            marginTop: 10,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: highlight ? "var(--gold)" : "var(--terracotta-dark)",
                            textDecoration: "none",
                          }}
                        >
                          Details →
                        </Link>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.category}>
                  <tr>
                    <td
                      colSpan={packages.length + 1}
                      style={{
                        padding: "22px 0 8px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--terracotta)",
                      }}
                    >
                      {group.category}
                    </td>
                  </tr>
                  {group.items.map((m) => (
                    <tr key={m.key} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px 14px 12px 0", fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{m.name}</td>
                      {packages.map((pkg) => {
                        const highlight = pkg.key === "PREMIUM_PLUS";
                        const included = featuresByPackage.get(pkg.id)?.has(m.key);
                        return (
                          <td
                            key={pkg.id}
                            style={{
                              textAlign: "center",
                              padding: "12px 10px",
                              background: highlight ? "rgba(33,28,25,0.035)" : undefined,
                            }}
                          >
                            <span style={{ color: included ? "var(--terracotta-dark)" : "var(--ink-faint)", opacity: included ? 1 : 0.5 }}>
                              {included ? <Check /> : <Cross />}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 20 }}>Alle Preise einmalig, keine Abo-Kosten.</p>
      </div>
    </main>
  );
}
