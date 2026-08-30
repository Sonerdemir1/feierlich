import { randomUUID } from "crypto";
import { putObject } from "./storage";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
// Kurze Handy-Videoclips (30-90s) liegen typischerweise bei 30-80MB in
// 1080p — 100MB laesst Spielraum fuer etwas laengere/hoeher aufgeloeste
// Clips, ohne dass ein einzelner Gast-Upload die R2-Speicherkosten
// unkontrolliert hochtreibt. Bei Bedarf anpassen.
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

// Erweiterung wird ausschliesslich aus dem geprueften MIME-Typ abgeleitet,
// nie aus dem client-gelieferten Dateinamen — sonst koennte jemand per
// gefaelschtem `name` (z. B. "bild.png" mit echtem Content-Type image/png,
// aber beliebigem Dateinamen im Request) eine unerwuenschte Endung auf die
// Platte schreiben.
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
};

export type UploadValidationError = "no-file" | "bad-type" | "too-large";
export type MediaKind = "IMAGE" | "VIDEO";

export function validateImageFile(file: FormDataEntryValue | null): UploadValidationError | null {
  if (!(file instanceof File) || file.size === 0) return "no-file";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "bad-type";
  if (file.size > MAX_IMAGE_BYTES) return "too-large";
  return null;
}

// Wie validateImageFile(), akzeptiert zusaetzlich Videos (eigenes,
// grosszuegigeres Groessenlimit) — fuer die Gaeste-Galerie/das Gaestebuch,
// wo beides erlaubt sein soll. Das Cover-Bild eines Events (Dashboard)
// bleibt bewusst bei validateImageFile(): ein Video als Titelbild ergibt
// keinen Sinn.
export function validateMediaFile(file: FormDataEntryValue | null): UploadValidationError | null {
  if (!(file instanceof File) || file.size === 0) return "no-file";
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return file.size > MAX_IMAGE_BYTES ? "too-large" : null;
  }
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return file.size > MAX_VIDEO_BYTES ? "too-large" : null;
  }
  return "bad-type";
}

export function mediaKindFromMime(mimeType: string): MediaKind {
  return ALLOWED_VIDEO_TYPES.includes(mimeType) ? "VIDEO" : "IMAGE";
}

async function saveFile(eventId: string, file: File): Promise<{ url: string; mimeType: string; sizeBytes: number }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = EXTENSION_BY_MIME[file.type] ?? "";
  const filename = `${randomUUID()}${ext}`;
  const url = await putObject(`events/${eventId}/${filename}`, bytes, file.type);
  return { url, mimeType: file.type, sizeBytes: file.size };
}

// Nimmt an, dass validateImageFile() bereits erfolgreich war.
export async function saveEventImage(eventId: string, file: File): Promise<{ url: string; mimeType: string; sizeBytes: number }> {
  return saveFile(eventId, file);
}

// Nimmt an, dass validateMediaFile() bereits erfolgreich war.
export async function saveEventMedia(eventId: string, file: File): Promise<{ url: string; mimeType: string; sizeBytes: number }> {
  return saveFile(eventId, file);
}
