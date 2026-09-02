import { prisma } from "@/lib/prisma";
import { NewEventWizard } from "@/components/dashboard/NewEventWizard";
import { aiTextConfigured } from "@/lib/ai-text";

export default async function NewEventPage() {
  const [eventTypes, templates] = await Promise.all([
    prisma.eventType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.template.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>
        Neues Event
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        Grunddaten für den Start — Bild, Module und Veröffentlichen folgen auf der Event-Seite.
      </p>

      <NewEventWizard
        eventTypes={eventTypes.map((et) => ({ id: et.id, name: et.name, category: et.category }))}
        templates={templates.map((t) => ({ id: t.id, name: t.name, category: t.category, layoutKey: t.layoutKey }))}
        aiTextConfigured={aiTextConfigured}
      />
    </div>
  );
}
