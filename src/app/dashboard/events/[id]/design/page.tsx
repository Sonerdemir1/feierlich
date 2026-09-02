import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveDesign, resetDesign } from "../../actions";

type Colors = { primary: string; accent: string; background: string };

export default async function DesignPage({ params }: PageProps<"/dashboard/events/[id]/design">) {
  const { id } = await params;
  const session = await auth();

  const event = await prisma.event.findUnique({ where: { id }, include: { template: true } });
  if (!event || event.ownerId !== session!.user.id) notFound();

  const templateColors: Colors = JSON.parse(event.template.colors);
  const colors: Colors = event.colorOverride ? { ...templateColors, ...JSON.parse(event.colorOverride) } : templateColors;
  const hasOverride = Boolean(event.colorOverride && event.colorOverride !== "{}");

  const field = { padding: "10px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5, width: "100%", height: 44, cursor: "pointer" };

  return (
    <div>
      <Link href={`/dashboard/events/${id}`} style={{ fontSize: 12.5, color: "var(--terracotta-dark)" }}>
        ← Zurück zum Event
      </Link>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, color: "var(--ink)", margin: "14px 0 6px" }}>
        Design &amp; Vorschau — {event.title}
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 28 }}>
        Farben anpassen und das Ergebnis direkt in der Vorschau sehen.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        <div style={{ flex: "0 0 280px", minWidth: 260 }}>
          <div style={{ border: "1px solid var(--line)", padding: "20px 22px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Farben</div>
            <form action={saveDesign.bind(null, id)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
                Primär (Text)
                <input type="color" name="primary" defaultValue={colors.primary} style={field} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
                Akzent
                <input type="color" name="accent" defaultValue={colors.accent} style={field} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
                Hintergrund
                <input type="color" name="background" defaultValue={colors.background} style={field} />
              </label>
              <button type="submit" className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 12.5 }}>
                Speichern
              </button>
            </form>
            {hasOverride && (
              <form action={resetDesign.bind(null, id)} style={{ marginTop: 10 }}>
                <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12, width: "100%" }}>
                  Zurücksetzen auf Vorlage
                </button>
              </form>
            )}
          </div>
        </div>

        <div style={{ flex: "1 1 420px", minWidth: 280 }}>
          <div style={{ border: "1px solid var(--line)", height: 720, overflow: "hidden" }}>
            <iframe
              key={event.colorOverride ?? "default"}
              title="Vorschau der Einladungsseite"
              src={`/e/${event.slug}`}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
