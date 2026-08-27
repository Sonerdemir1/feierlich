import { prisma } from "@/lib/prisma";
import { EnvelopeReveal } from "@/components/marketing/EnvelopeReveal";

// Isolierte Testseite fuer EnvelopeReveal — NICHT Teil der echten
// Vorlagen-Galerie. Laedt genau die eine Testvorlage
// "hochzeit-elegant-gold" und zeigt die Sequenz, um Bildladen/-positionierung
// zu pruefen, bevor irgendwas in die echte Galerie eingebaut wird.
export const dynamic = "force-dynamic";

export default async function TestEnvelopePage() {
  const template = await prisma.template.findUnique({ where: { slug: "hochzeit-elegant-gold" } });

  if (!template || !template.envelopeSequenceUrls) {
    return (
      <main style={{ padding: 48, fontFamily: "var(--font-body)" }}>
        Vorlage &bdquo;hochzeit-elegant-gold&ldquo; oder envelopeSequenceUrls nicht gefunden — Seed nochmal laufen lassen?
      </main>
    );
  }

  const images: string[] = JSON.parse(template.envelopeSequenceUrls);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--ivory)",
        padding: "56px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--terracotta)", marginBottom: 8 }}>
          EnvelopeReveal — Testseite
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, color: "var(--ink)", margin: 0 }}>
          {template.name}
        </h1>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>
          {images.length} Bilder in der Sequenz — Klick auf den Umschlag startet die Animation.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 360 }}>
        <EnvelopeReveal images={images} stepDuration={550} finalZoom={1} finalFocusX={50} finalFocusY={45}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-playfair)",
                fontWeight: 700,
                fontSize: "clamp(24px, 5vw, 32px)",
                color: "var(--ink)",
              }}
            >
              Anna &amp; Lukas
            </div>
            <div style={{ marginTop: 10, fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-soft)" }}>
              14. JUNI 2026 · SCHLOSS EHRENFELS
            </div>
          </div>
        </EnvelopeReveal>
      </div>
    </main>
  );
}
