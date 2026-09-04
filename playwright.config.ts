import { defineConfig } from "@playwright/test";

// Nicht Teil der Deploy-Pipeline — dient aktuell dem gezielten Messen von
// UX-Kennzahlen (z. B. Beruehrungen vom QR-Scan bis zum hochgeladenen
// Foto, siehe tests/gallery-upload.spec.ts), nicht einer vollen
// End-to-End-Testsuite. Braucht einen laufenden `npx next dev` auf
// localhost:3000 und eine erreichbare DATABASE_URL (siehe .env).
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  reporter: "list",
  workers: 1,
});
