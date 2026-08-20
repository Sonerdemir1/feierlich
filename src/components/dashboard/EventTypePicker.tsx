"use client";

type EventTypeOption = { id: string; name: string; category: string };

export function EventTypePicker({
  eventTypes,
  value,
  onChange,
}: {
  eventTypes: EventTypeOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const byCategory = new Map<string, EventTypeOption[]>();
  for (const et of eventTypes) {
    const list = byCategory.get(et.category) ?? [];
    list.push(et);
    byCategory.set(et.category, list);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {[...byCategory.entries()].map(([category, items]) => (
        <div key={category}>
          <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 10 }}>
            {category}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {items.map((et) => {
              const selected = et.id === value;
              return (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => onChange(et.id)}
                  style={{
                    padding: "14px 12px",
                    textAlign: "left",
                    fontSize: 13,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    border: selected ? "1.5px solid var(--ink)" : "1px solid var(--line)",
                    background: selected ? "var(--ink)" : "var(--ivory-2)",
                    color: selected ? "var(--ivory)" : "var(--ink)",
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {et.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
