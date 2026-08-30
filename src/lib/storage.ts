import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Zwei Speicher-Backends hinter einer Funktion:
//  - "local": Dateisystem unter public/uploads/... (Standard, ohne Setup
//    nutzbar, aber ueberlebt keine Redeploys auf Plattformen wie Vercel).
//  - "r2": Cloudflare R2 (S3-kompatibel) — sobald die drei R2_*-Variablen
//    gesetzt sind, wird automatisch umgeschaltet. Kein Code-Pfad-Wechsel
//    fuer Aufrufer noetig, saveEventImage() bleibt gleich.
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const r2Configured = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID!, secretAccessKey: R2_SECRET_ACCESS_KEY! },
    });
  }
  return s3Client;
}

export const storageDriver: "local" | "r2" = r2Configured ? "r2" : "local";

// `key` ist ein relativer Pfad wie "events/<eventId>/<uuid>.png".
export async function putObject(key: string, bytes: Buffer, mimeType: string): Promise<string> {
  if (storageDriver === "r2") {
    await getS3Client().send(
      new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: bytes, ContentType: mimeType })
    );
    return `${R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads", path.dirname(key));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "uploads", key), bytes);
  return `/uploads/${key}`;
}

// Liest die Bytes einer zuvor per putObject() gespeicherten Datei wieder
// ein, anhand ihrer gespeicherten `url` (nicht des `key`s, da nur die URL
// in der DB vorliegt). Lokal: direkter Dateisystem-Zugriff (die URL ist
// ein relativer /uploads/...-Pfad). R2: HTTP-Fetch, da R2_PUBLIC_URL
// bereits eine vollstaendige, oeffentlich erreichbare Adresse ist.
export async function readObject(url: string): Promise<Buffer> {
  if (url.startsWith("/uploads/")) {
    return readFile(path.join(process.cwd(), "public", url));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Datei konnte nicht gelesen werden (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
