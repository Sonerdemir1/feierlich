import { prisma } from "@/lib/prisma";
import { createEventType, toggleEventTypeActive } from "./actions";

export default async function AdminEventTypesPage() {
  const eventTypes = await prisma.eventType.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });

  const byCategory = new Map<string, typeof eventTypes>();
  for (const et of eventTypes) {
    const list = byCategory.get(et.category) ?? [];
    list.push(et);
    byCategory.set(et.category, list);
  }

  const field = { padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>
        Eventtypen ({eventTypes.length})
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 24 }}>
        Neue Typen erscheinen sofort im Event-Builder — keine Code-Änderung nötig.
      </p>

      <div style={{ border: "1px solid var(--line)", padding: "18px 20px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Neuer Eventtyp</div>
        <form action={createEventType} style={{ display: "flex", gap: 10 }}>
          <input name="name" placeholder="z. B. Polterabend" required style={{ ...field, flex: 1 }} />
          <input name="category" placeholder="Kategorie" required style={{ ...field, flex: 1 }} />
          <button type="submit" className="btn btn-primary" style={{ padding: "0 20px", fontSize: 12.5 }}>
            Hinzufügen
          </button>
        </form>
      </div>

      {[...byCategory.entries()].map(([category, items]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, marginBottom: 10 }}>{category}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.map((et) => (
              <form key={et.id} action={toggleEventTypeActive.bind(null, et.id, !et.active)}>
                <button
                  type="submit"
                  style={{
                    fontSize: 12.5,
                    padding: "7px 12px",
                    border: "1px solid var(--line)",
                    background: et.active ? "var(--ivory-2)" : "transparent",
                    color: et.active ? "var(--ink)" : "var(--ink-faint)",
                    textDecoration: et.active ? "none" : "line-through",
                    cursor: "pointer",
                  }}
                  title={et.active ? "Klicken zum Deaktivieren" : "Klicken zum Aktivieren"}
                >
                  {et.name}
                </button>
              </form>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
