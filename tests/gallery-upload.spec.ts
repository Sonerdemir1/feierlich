import { test, expect } from "@playwright/test";
import path from "node:path";

// Misst die Anzahl Beruehrungen vom Landen auf der Tisch-QR-Ziel-URL bis
// zum erfolgreich hochgeladenen Foto — Ziel aus docs/BENCHMARK.md /
// Umbau-Auftrag: maximal drei, ohne Konto, ohne Pflicht-Namenseingabe.
//
// Braucht EVENT_SLUG und TABLE_ID als Umgebungsvariablen (siehe
// scripts/measure-gallery-upload.sh, das Testdaten anlegt, den Test
// startet und danach wieder aufraeumt) — kein direkter Prisma-Import
// hier, der generierte Prisma-7-Client ist reines ESM und liess sich
// nicht zuverlaessig durch Playwrights eigenen Test-Transform laden.

const slug = process.env.EVENT_SLUG;
const tableId = process.env.TABLE_ID;

test("Gast-Upload: maximal drei Beruehrungen, kein Konto, kein Pflicht-Name", async ({ page }) => {
  if (!slug || !tableId) throw new Error("EVENT_SLUG/TABLE_ID fehlen — ueber scripts/measure-gallery-upload.sh starten.");

  let touches = 0;

  // Beruehrung 1: QR-Ziel-Seite oeffnen entspricht dem physischen Scan,
  // zaehlt nicht als Seiten-Interaktion — Messung beginnt bei der ersten
  // echten Interaktion auf der Seite selbst.
  await page.goto(`/e/${slug}?tisch=${tableId}#galerie`);

  const gallerySection = page.locator("#galerie");
  const fileButton = gallerySection.getByRole("button", { name: "Foto oder Video auswählen" });
  await expect(fileButton).toBeVisible();
  await fileButton.click(); // Beruehrung: Datei-Auswahl oeffnen
  touches += 1;

  const fileInput = gallerySection.locator('input[type="file"][name="file"]');
  await fileInput.setInputFiles(path.join(__dirname, "..", "public", "images", "marketing", "toast.jpg"));
  touches += 1; // Beruehrung: Datei im nativen Dialog bestaetigen (autoSubmit loest danach selbststaendig aus)

  // Kein dritter Tap auf einen separaten "Hochladen"-Button noetig —
  // FileField mit autoSubmit reicht die Datei direkt beim Auswaehlen ein.
  await page.waitForURL(/gallery=success/, { timeout: 10_000 });

  expect(touches).toBeLessThanOrEqual(3);
  console.log(`GAST-UPLOAD BERUEHRUNGEN: ${touches}`);

  // Kein Konto: Test lief nie eingeloggt (kein page.context() mit Session-Cookie).
  // Kein Pflicht-Name: die Namenseingabe kam erst NACH dem Erfolg, wurde hier nicht ausgefuellt.
  const nameField = page.getByPlaceholder("Wie heißt ihr? (optional)");
  await expect(nameField).toBeVisible();
  await expect(page.getByText("Danke! Euer Foto/Video wird nach kurzer Prüfung sichtbar.")).toBeVisible();
});
