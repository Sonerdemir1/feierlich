import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "event"}-${suffix}`;
}

export default async function NewEventPage() {
  const session = await auth();
  const [eventTypes, templates] = await Promise.all([
    prisma.eventType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.template.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
  ]);

  async function createEvent(formData: FormData) {
    "use server";
    const title = String(formData.get("title") ?? "").trim();
    const eventTypeId = String(formData.get("eventTypeId") ?? "");
    const templateId = String(formData.get("templateId") ?? "");
    const eventDate = String(formData.get("eventDate") ?? "");
    if (!title || !eventTypeId || !templateId || !eventDate) return;

    const event = await prisma.event.create({
      data: {
        title,
        slug: slugify(title),
        eventTypeId,
        templateId,
        eventDate: new Date(eventDate),
        ownerId: session!.user.id,
      },
    });
    redirect(`/dashboard/events/${event.id}`);
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>
        Neues Event
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        Grunddaten für den Start — Design, Module und Gäste folgen danach.
      </p>

      <form action={createEvent} style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 480 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
          Eventtyp
          <select
            name="eventTypeId"
            required
            style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
          >
            {eventTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
          Template
          <select
            name="templateId"
            required
            style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
          Titel (z. B. &bdquo;Anna &amp; Lukas&ldquo; oder &bdquo;Firmenfeier 2027&ldquo;)
          <input
            type="text"
            name="title"
            required
            style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
          Datum
          <input
            type="date"
            name="eventDate"
            required
            style={{ padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 }}
          />
        </label>

        <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", padding: 14, marginTop: 8 }}>
          Event anlegen
        </button>
      </form>
    </div>
  );
}
