import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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
  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "events", eventId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return { url: `/uploads/events/${eventId}/${filename}`, mimeType: file.type, sizeBytes: file.size };
}
