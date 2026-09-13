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
  ]),
]);

export default eslintConfig;
