"use client";

import { useState } from "react";
import { TemplatePreview } from "@/components/marketing/TemplatePreview";

type TemplateOption = { id: string; name: string; category: string; layoutKey: string };

export function TemplatePicker({
  templates,
  value,
  onChange,
}: {
  templates: TemplateOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const categories = ["Alle", ...Array.from(new Set(templates.map((t) => t.category)))];
  const [activeCategory, setActiveCategory] = useState("Alle");

  const visible = activeCategory === "Alle" ? templates : templates.filter((t) => t.category === activeCategory);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCategory(c)}
            style={{
              padding: "7px 14px",
              fontSize: 12,
              border: "1px solid var(--line)",
              background: activeCategory === c ? "var(--ink)" : "var(--ivory-2)",
              color: activeCategory === c ? "var(--ivory)" : "var(--ink-soft)",
              cursor: "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {visible.map((t) => {
          const selected = t.id === value;
          return (
            <div
              key={t.id}
              className="tpl"
              onClick={() => onChange(t.id)}
              style={{ cursor: "pointer", outline: selected ? "2px solid var(--terracotta)" : "none", outlineOffset: -1 }}
            >
              <TemplatePreview layoutKey={t.layoutKey} />
              <div className="tpl-label">
                <span>{t.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
