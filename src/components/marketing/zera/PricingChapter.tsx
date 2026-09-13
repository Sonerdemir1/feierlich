"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChapterShell } from "./ChapterShell";
import { scrollReveal } from "./motion";
import { homepageCopy } from "@/lib/translations/homepage";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const t = homepageCopy.de;

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export type PricingPackage = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  slug: string;
  highlight: boolean;
  // Bereits zu Modulnamen aufgeloest (Server-Komponente), unveraendert
  // gegenueber src/app/page.tsx: die volle Feature-Liste des Pakets, keine
  // Kuerzung.
  features: string[];
};

export type PricingAddOn = { name: string; priceCents: number } | null;

// Live-Pakete-Kapitel, ersetzt den statischen Preise-Platzhalter der
// Dev-Vorschau — Daten/Verlinkung 1:1 wie bisher in src/app/page.tsx
// (gleiche 4 Pakete, gleiches optionales Foto-Video-Zusatzpaket, "Dieses
// Paket waehlen" verlinkt unveraendert auf /?paket=<slug>#vorlagen), nur
// die Optik ist jetzt der Zera-Kapitel-Stil (docs/MOTION.md §1-§2).
// id="preise" ist ein fester Anker, auf den DesignStudio.tsx und die
// /preise/*-Seiten fest verlinken (Rueckwaerts-Kompatibilitaet) — nicht
// umbenennen ohne diese Stellen mit anzupassen.
export function PricingChapter({
  num,
  totalChapters,
  packages,
  addOn,
  nextHref,
  nextLabel,
}: {
  num: number;
  totalChapters: number;
  packages: PricingPackage[];
  addOn: PricingAddOn;
  nextHref?: string;
  nextLabel?: string;
}) {
  return (
    <ChapterShell num={num} totalChapters={totalChapters} label={t.pricing.eyebrow} id="preise" nextHref={nextHref} nextLabel={nextLabel}>
      <div className="zc-full">
        <div className="zc-centered-head">
          <motion.span className="zc-eyebrow" {...scrollReveal(0)}>
            {t.pricing.eyebrow}
          </motion.span>
          <motion.h2 className="zc-heading" {...scrollReveal(0.08)}>
            {t.pricing.heading.toUpperCase()}
          </motion.h2>
        </div>

        {addOn && (
          <motion.div className="zc-pricing-addon" {...scrollReveal(0.14)}>
            <div className="zc-pricing-card zc-pricing-card--highlight">
              <div className="zc-compare-badge">{t.pricing.addOnBadge}</div>
              <div className="zc-pricing-name" style={{ marginTop: 6 }}>
                {addOn.name}
              </div>
              <div className="zc-pricing-tag">{t.pricing.addOnTag}</div>
              <div className="zc-pricing-amount">{eur.format(addOn.priceCents / 100)}</div>
              <div className="zc-pricing-features">
                {t.pricing.addOnFeatures.map((feature) => (
                  <div className="zc-pricing-feature" key={feature}>
                    <span className="zc-pricing-feature-check" aria-hidden="true">
                      <Check />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div className="zc-centered-head" style={{ marginTop: addOn ? 8 : 0 }} {...scrollReveal(0.18)}>
          <span className="zc-eyebrow">{t.pricing.eyebrow2}</span>
          <h3 className="zc-heading" style={{ fontSize: "clamp(20px, 2.4vw, 28px)", marginBottom: 12 }}>
            {t.pricing.heading2}
          </h3>
          <Link href="/preise/vergleich" style={{ fontFamily: "var(--font-karla), system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "var(--zc-accent)" }}>
            Alle Pakete im Vergleich →
          </Link>
        </motion.div>

        <motion.div className="zc-pricing-grid" {...scrollReveal(0.24)}>
          {packages.map((pkg) => (
            <div className={`zc-pricing-card${pkg.highlight ? " zc-pricing-card--highlight" : ""}`} key={pkg.id}>
              {pkg.highlight && <div className="zc-compare-badge">{t.pricing.popularBadge}</div>}
              <div className="zc-pricing-name" style={pkg.highlight ? { marginTop: 6 } : undefined}>
                {pkg.name}
              </div>
              {pkg.description && <div className="zc-pricing-tag">{pkg.description}</div>}
              <div className="zc-pricing-amount">{eur.format(pkg.priceCents / 100)}</div>
              <div className="zc-pricing-features">
                {pkg.features.map((name) => (
                  <div className="zc-pricing-feature" key={name}>
                    <span className="zc-pricing-feature-check" aria-hidden="true">
                      <Check />
                    </span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
              <Link href={`/?paket=${pkg.slug}#vorlagen`} className="zc-btn zc-btn-primary" style={{ width: "100%", justifyContent: "center", textAlign: "center" }}>
                Dieses Paket wählen
              </Link>
              <Link href={`/preise/${pkg.slug}`} className="zc-pricing-details">
                Alle Funktionen ansehen →
              </Link>
            </div>
          ))}
        </motion.div>

        <motion.div className="zc-trust-row" {...scrollReveal(0.3)}>
          {t.trust.items.map((item) => (
            <div className="zc-trust-item" key={item.label}>
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </ChapterShell>
  );
}
