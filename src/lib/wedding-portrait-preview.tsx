import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/social-graphic";
import type { WeddingPortraitStyle } from "@/lib/ai-wedding-portrait";

// Groesse der KOSTENLOSEN Vorschau — bewusst kleiner als das von OpenAI
// gelieferte 1024x1024-Rohbild (siehe generateWeddingPortraitImage), das
// unveraendert als "rawUrl" fuer den spaeteren bezahlten hochaufgeloesten
// Download aufgehoben wird (WeddingPortraitAttempt). Diese Funktion hier
// erzeugt NUR die niedrig aufgeloeste, mit Overlay + Wasserzeichen versehene
// "previewUrl".
const PREVIEW_SIZE = 640;

// Baut aus dem rohen KI-Bild + Namen/Datum die anzeigbare Vorschau — Namen
// und Datum liegen als eigener Textblock in einer halbtransparenten Leiste
// AM UNTEREN RAND (nicht ueber dem Gesicht, siehe Anforderung 3), das
// Wasserzeichen sitzt dezent oben rechts, getrennt vom Namen/Datum-Block.
// Nutzt next/og (Satori + resvg, in Next.js selbst gebuendelt, siehe auch
// social-graphic/route.tsx) statt einer neuen Bild-Bibliothek.
export async function composeWeddingPortraitPreview(
  rawImage: Buffer,
  style: WeddingPortraitStyle,
  names: string,
  dateLabel: string
): Promise<Buffer> {
  const imageDataUri = `data:image/png;base64,${rawImage.toString("base64")}`;

  const displayNames = style.overlayUppercase ? names.toUpperCase() : names;
  const displayDate = style.overlayUppercase ? dateLabel.toUpperCase() : dateLabel;
  const overlayText = `${displayNames} ${displayDate} einladi.de`;

  let fonts: { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" }[] = [];
  try {
    const [overlayFont, bodyFont] = await Promise.all([
      loadGoogleFont(style.overlayFontFamily, overlayText, style.overlayFontWeight),
      loadGoogleFont("Inter", overlayText, 400),
    ]);
    fonts = [
      { name: style.overlayFontFamily, data: overlayFont, weight: style.overlayFontWeight, style: "normal" },
      { name: "Inter", data: bodyFont, weight: 400, style: "normal" },
    ];
  } catch {
    // Google Fonts nicht erreichbar — Satori faellt auf seine eingebaute
    // Standardschrift zurueck, die Vorschau bleibt trotzdem nutzbar.
  }
  const overlayFontFamily = fonts.length ? style.overlayFontFamily : undefined;
  const bodyFontFamily = fonts.length ? "Inter" : undefined;

  const image = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (next/og) rendert kein next/image, nur <img> */}
        <img
          src={imageDataUri}
          alt=""
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Wasserzeichen — dezent, oben rechts, bewusst getrennt vom Namen/Datum-Block unten.
            Eigene halbtransparente dunkle Grundflaeche statt reinem weissem Text: die Ausgangsbilder
            variieren je nach Stil stark in der Helligkeit (z.B. Line-Art fast weiss), reiner weisser
            Text waere dort kaum lesbar — Anforderung 4 verlangt "sichtbares" Wasserzeichen. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 16,
            right: 16,
            padding: "5px 10px",
            background: "rgba(20,16,14,0.45)",
            fontSize: 14,
            fontFamily: bodyFontFamily,
            color: "#ffffff",
            letterSpacing: 1,
          }}
        >
          einladi.de
        </div>

        {/* Namen + Datum — halbtransparente Leiste am unteren Rand, nicht ueber dem Gesicht */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "26px 20px 22px",
            background: "rgba(20,16,14,0.52)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: style.overlayFontWeight,
              fontFamily: overlayFontFamily,
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            {displayNames}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 15,
              fontFamily: bodyFontFamily,
              color: "#ffffff",
              opacity: 0.85,
              marginTop: 8,
              letterSpacing: 1,
            }}
          >
            {displayDate}
          </div>
        </div>
      </div>
    ),
    { width: PREVIEW_SIZE, height: PREVIEW_SIZE, fonts }
  );

  return Buffer.from(await image.arrayBuffer());
}
