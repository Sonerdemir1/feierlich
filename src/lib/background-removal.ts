const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY;

export const backgroundRemovalConfigured = Boolean(REMOVEBG_API_KEY);

// remove.bg liefert bei Erfolg direkt die PNG-Bytes im Response-Body,
// bei Fehlern ein JSON mit { errors: [{ title, code }, ...] } — daher der
// Content-Type-Check statt eines reinen response.ok.
export async function removeImageBackground(source: Buffer, mimeType: string): Promise<Buffer> {
  if (!REMOVEBG_API_KEY) {
    throw new Error("REMOVEBG_API_KEY ist nicht gesetzt — Hintergrund-Freistellung ist nicht konfiguriert.");
  }

  const form = new FormData();
  form.set("image_file", new Blob([new Uint8Array(source)], { type: mimeType }), "image");
  form.set("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": REMOVEBG_API_KEY },
    body: form,
  });

  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    const detail = await response.text().catch(() => "");
    throw new Error(`remove.bg-Anfrage fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
