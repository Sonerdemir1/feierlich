import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadCoverImage, saveModules, publishEvent } from "../actions";

const statusLabel: Record<string, string> = {
  DRAFT: "Entwurf",
  PUBLISHED: "Veröffentlicht",
  ARCHIVED: "Archiviert",
};

const uploadErrorLabel: Record<string, string> = {
  "no-file": "Bitte eine Datei auswählen.",
  "bad-type": "Nur JPG, PNG, WEBP oder GIF sind erlaubt.",
  "too-large": "Datei ist größer als 8 MB.",
};

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", background: "var(--ivory-2)", padding: "18px 20px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 6, color: "var(--ink)" }}>{value}</div>
      {note && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 4 }}>{note}</div>}
    </div>
  );
}

export default async function EventDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const event = await prisma.event.findUnique({
    where: { id },
    include: { eventType: true, template: true, guests: true, coverImage: true },
  });

  if (!event || event.ownerId !== session!.user.id) {
    notFound();
  }

  const [allModules, eventModules] = await Promise.all([
    prisma.module.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.eventModule.findMany({ where: { eventId: id } }),
  ]);
  const enabledByModuleId = new Map(eventModules.map((em) => [em.moduleId, em.enabled]));

  const errorKey = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--terracotta-dark)", marginBottom: 8 }}>
        {event.eventType.name} · {event.template.name}
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 32, color: "var(--ink)", marginBottom: 6 }}>
        {event.title}
      </h1>
      <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 32 }}>
        {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(event.eventDate)} · Status:{" "}
        {statusLabel[event.status] ?? event.status}
      </p>

      {errorKey && (
        <div style={{ border: "1px solid #C97E5E", background: "#F5E1DE", color: "#6B2F1A", padding: "12px 16px", fontSize: 13, marginBottom: 24 }}>
          {uploadErrorLabel[errorKey] ?? "Da ist etwas schiefgelaufen."}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 36 }}>
        <Tile label="Gäste" value={String(event.guests.length)} />
        <Tile label="Zusagen" value="—" note="Phase 7" />
        <Tile label="Aufrufe" value="—" note="Phase 6" />
        <Tile label="QR-Codes" value="—" note="Phase 8" />
      </div>

      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Öffentliche Event-Seite</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>digitaleventstudio.de/e/{event.slug}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6 }}>
          Die öffentliche Seite selbst kommt in Phase 6 (Event-Webseite).
        </div>
      </div>

      {/* Titelbild */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 14 }}>Titelbild</div>
        {event.coverImage && (
          <div style={{ marginBottom: 14, maxWidth: 320 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user upload with unknown dimensions, no image-processing dep installed yet */}
            <img
              src={event.coverImage.url}
              alt=""
              style={{ width: "100%", height: "auto", display: "block", border: "1px solid var(--line)" }}
            />
          </div>
        )}
        <form action={uploadCoverImage.bind(null, event.id)} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required style={{ fontSize: 13 }} />
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 16px", fontSize: 12.5 }}>
            {event.coverImage ? "Bild ersetzen" : "Bild hochladen"}
          </button>
        </form>
      </div>

      {/* Module */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Module für dieses Event</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 16 }}>
          Nur aktivierte Module erscheinen später auf der Event-Seite.
        </div>
        <form action={saveModules.bind(null, event.id)}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 18 }}>
            {allModules.map((m) => {
              const checked = enabledByModuleId.get(m.id) ?? true;
              return (
                <label
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    fontSize: 13,
                    color: "var(--ink-soft)",
                    padding: "8px 10px",
                    border: "1px solid var(--line)",
                    background: "var(--ivory-2)",
                  }}
                >
                  <input type="checkbox" name="modules" value={m.key} defaultChecked={checked} />
                  {m.name}
                  {m.isPremium && (
                    <span style={{ marginLeft: "auto", fontSize: 9.5, color: "var(--gold)", fontWeight: 600 }}>PREMIUM</span>
                  )}
                </label>
              );
            })}
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 12.5 }}>
            Module speichern
          </button>
        </form>
      </div>

      {/* Veroeffentlichen */}
      <div style={{ border: "1px solid var(--line)", padding: "20px 22px", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Veröffentlichen</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            {event.status === "PUBLISHED" ? "Dieses Event ist veröffentlicht." : "Noch nicht veröffentlicht — nur du siehst es."}
          </div>
        </div>
        {event.status !== "PUBLISHED" && (
          <form action={publishEvent.bind(null, event.id)}>
            <button type="submit" className="btn btn-primary">
              Event veröffentlichen
            </button>
          </form>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[
          ["Gästeliste", "Phase 7"],
          ["Sitzplan", "Phase 9"],
          ["Gästebuch & Galerie", "Phase 10"],
        ].map(([label, phase]) => (
          <div
            key={label}
            style={{
              border: "1px dashed var(--line)",
              padding: "16px 18px",
              fontSize: 13,
              color: "var(--ink-faint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{label}</span>
            <span style={{ fontSize: 11 }}>{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
