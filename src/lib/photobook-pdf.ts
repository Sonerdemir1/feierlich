import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { readObject } from "@/lib/storage";

// Farben 1:1 aus globals.css uebernommen (--ivory/--ink/--terracotta/--line),
// damit das PDF sich an die restliche Editor-Optik anlehnt, ohne eine
// zweite, unabhaengig gepflegte Farbpalette einzufuehren.
const IVORY = rgb(0xfa / 255, 0xf6 / 255, 0xef / 255);
const INK = rgb(0x21 / 255, 0x1c / 255, 0x19 / 255);
const TERRACOTTA = rgb(0xb2 / 255, 0x54 / 255, 0x3a / 255);
const LINE = rgb(0xe4 / 255, 0xd9 / 255, 0xc8 / 255);

const PAGE_WIDTH = 595.28; // A4 hoch, in pt
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

export type PhotobookPhoto = { url: string; mimeType: string };

// Nur JPEG/PNG sind hier einbettbar (pdf-lib unterstuetzt keine WEBP/GIF-
// Dekodierung) — der Aufrufer (photobook/page.tsx) filtert das bereits vor
// der Auswahl, hier trotzdem defensiv nochmal geprueft, falls sich ein
// nicht unterstuetztes Format doch einschleicht (z.B. durch spaeteren
// Formatwechsel eines bereits ausgewaehlten Fotos).
function isEmbeddableMimeType(mimeType: string): boolean {
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

function drawCoverFrame(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: IVORY });
  const inset = 28;
  page.drawRectangle({
    x: inset,
    y: inset,
    width: PAGE_WIDTH - inset * 2,
    height: PAGE_HEIGHT - inset * 2,
    borderColor: TERRACOTTA,
    borderWidth: 1.2,
  });
  const inset2 = inset + 6;
  page.drawRectangle({
    x: inset2,
    y: inset2,
    width: PAGE_WIDTH - inset2 * 2,
    height: PAGE_HEIGHT - inset2 * 2,
    borderColor: TERRACOTTA,
    borderWidth: 0.5,
  });
}

function centeredText(page: PDFPage, text: string, font: PDFFont, size: number, y: number, color = INK) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font, color });
}

// Grobe Annaeherung an Buchstaben-Sperrung (letter-spacing) fuer die
// Eyebrow-Zeile — pdf-lib kennt keine Zeichenabstands-Option, echte
// Leerzeichen zwischen den Buchstaben erzeugen aber optisch denselben
// "gesperrten Kapitaelchen"-Effekt wie im restlichen Editor (siehe
// letter-spacing: 0.18em auf .eyebrow in globals.css).
function letterSpaced(text: string): string {
  return text.toUpperCase().split("").join(" ");
}

async function drawCoverPage(pdfDoc: PDFDocument, coupleNames: string, eventDateLabel: string) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawCoverFrame(page);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  centeredText(page, letterSpaced("Erinnerungs-Fotobuch"), helvetica, 11, PAGE_HEIGHT - 260, TERRACOTTA);

  const namesSize = coupleNames.length > 22 ? 30 : 38;
  centeredText(page, coupleNames, timesItalic, namesSize, PAGE_HEIGHT - 320, INK);

  const ruleWidth = 90;
  page.drawLine({
    start: { x: (PAGE_WIDTH - ruleWidth) / 2, y: PAGE_HEIGHT - 350 },
    end: { x: (PAGE_WIDTH + ruleWidth) / 2, y: PAGE_HEIGHT - 350 },
    thickness: 0.75,
    color: TERRACOTTA,
  });

  centeredText(page, eventDateLabel, helvetica, 13, PAGE_HEIGHT - 380, INK);

  centeredText(page, "einladi", timesItalic, 12, MARGIN + 40, TERRACOTTA);
}

async function embedPhoto(pdfDoc: PDFDocument, photo: PhotobookPhoto) {
  if (!isEmbeddableMimeType(photo.mimeType)) return null;
  try {
    const bytes = await readObject(photo.url);
    return photo.mimeType === "image/png" ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  } catch {
    // Einzelnes fehlerhaftes/nicht ladbares Foto darf das gesamte Fotobuch
    // nicht scheitern lassen — wird einfach uebersprungen.
    return null;
  }
}

// Bis zu zwei Fotos je Seite, jeweils in einem eigenen, dezent umrandeten
// Rahmen zentriert und seitenverhaeltnis-treu eingepasst (kein Zuschneiden).
function drawPhotoInSlot(page: PDFPage, image: Awaited<ReturnType<PDFDocument["embedJpg"]>>, slotX: number, slotY: number, slotWidth: number, slotHeight: number) {
  const scale = Math.min(slotWidth / image.width, slotHeight / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = slotX + (slotWidth - drawWidth) / 2;
  const y = slotY + (slotHeight - drawHeight) / 2;

  page.drawRectangle({ x: slotX, y: slotY, width: slotWidth, height: slotHeight, borderColor: LINE, borderWidth: 1 });
  page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
}

async function drawPhotoPage(pdfDoc: PDFDocument, pagePhotos: PhotobookPhoto[]) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: IVORY });

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const contentHeight = PAGE_HEIGHT - MARGIN * 2;
  const gap = 24;
  const slotHeight = pagePhotos.length === 2 ? (contentHeight - gap) / 2 : contentHeight;

  for (let i = 0; i < pagePhotos.length; i++) {
    const image = await embedPhoto(pdfDoc, pagePhotos[i]);
    if (!image) continue;
    const slotY = PAGE_HEIGHT - MARGIN - slotHeight - i * (slotHeight + gap);
    drawPhotoInSlot(page, image, MARGIN, slotY, contentWidth, slotHeight);
  }
}

export async function generatePhotobookPdf(params: {
  coupleNames: string;
  eventDateLabel: string;
  photos: PhotobookPhoto[];
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${params.coupleNames} — Erinnerungs-Fotobuch`);
  pdfDoc.setProducer("einladi");

  await drawCoverPage(pdfDoc, params.coupleNames, params.eventDateLabel);

  for (let i = 0; i < params.photos.length; i += 2) {
    await drawPhotoPage(pdfDoc, params.photos.slice(i, i + 2));
  }

  return pdfDoc.save();
}
