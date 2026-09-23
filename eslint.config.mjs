import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Lizenziertes Envato-Template, eigenes unabhaengiges Next.js-Projekt
    // (eigene @/-Pfade) — nur interne Design-/Technik-Referenz, siehe
    // .gitignore.
    "Dixor v1.4/**",
    // Weitere gekaufte Referenzvorlagen (reines HTML/JS, keine eigene App)
    // — ohne diese Ignore-Eintraege meldet `npm run lint` zehntausende
    // Falschmeldungen aus fremdem, unminifiziertem/minifiziertem Vorlagen-
    // Code statt des eigentlichen Projekt-Codes unter src/.
    "Envato-Referenzen/**",
    "Wedding Templates Gestalten/**",
    "Einladi Hochzeit Karten/**",
    "QR CARD/**",
  ]),
]);

export default eslintConfig;
