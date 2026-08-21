import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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
};

export type UploadValidationError = "no-file" | "bad-type" | "too-large";

export function validateImageFile(file: FormDataEntryValue | null): UploadValidationError | null {
  if (!(file instanceof File) || file.size === 0) return "no-file";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "bad-type";
  if (file.size > MAX_IMAGE_BYTES) return "too-large";
  return null;
}

// Nimmt an, dass validateImageFile() bereits erfolgreich war.
export async function saveEventImage(eventId: string, file: File): Promise<{ url: string; mimeType: string; sizeBytes: number }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = EXTENSION_BY_MIME[file.type] ?? "";
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "events", eventId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return { url: `/uploads/events/${eventId}/${filename}`, mimeType: file.type, sizeBytes: file.size };
}
