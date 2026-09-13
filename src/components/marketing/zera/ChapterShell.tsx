"use client";

import type { ReactNode } from "react";
import Link from "next/link";

// Wiederverwendbare Kapitel-Huelle fuer alle Marketingseiten im Zera-Stil
// (siehe docs/MOTION.md §2): Nummer + Label oben, Inhalt, Paginierung +
// "Weiter"-Link unten. `nextHref` kann ein Sprungziel auf derselben Seite
// (#kapitel-02) oder eine andere Route (/#preise) sein.
export function ChapterShell({
  num,
  totalChapters,
  label,
  id,
  nextHref,
  nextLabel = "Weiter",
  endLabel = "Ende",
  children,
}: {
  num: number;
  totalChapters: number;
  label: string;
  id: string;
  nextHref?: string;
  nextLabel?: string;
  endLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="zc-chapter" id={id}>
      <div className="zc-chapter-head">
        <span className="zc-chapter-num">({String(num).padStart(2, "0")})</span>
        <span className="zc-chapter-label">— {label}</span>
      </div>

      {children}

      <div className="zc-footer-bar">
        <div className="zc-pagination">
          <span>
            {String(num).padStart(2, "0")} / {String(totalChapters).padStart(2, "0")}
          </span>
          <span className="zc-pagination-track" style={{ ["--zc-progress" as string]: `${(num / totalChapters) * 100}%` }} />
        </div>
        {nextHref ? (
          <Link href={nextHref} className="zc-next">
            {nextLabel}
            <span className="zc-next-arrow" aria-hidden="true">
              ↓
            </span>
          </Link>
        ) : (
          <span className="zc-next" style={{ opacity: 0.35, cursor: "default" }}>
            {endLabel}
          </span>
        )}
      </div>
    </section>
  );
}
