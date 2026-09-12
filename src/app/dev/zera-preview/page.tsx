// Scratch-Vorschau, NICHT Teil des Produkts — kompletter Zera-Studio-
// artiger Kapitel-Aufbau der Startseite (Auftrag "Schritt 2" + Folgeauftrag
// "restliche Kapitel"). Server-Wrapper nur zum Laden der Vorlagen-Galerie-
// Daten fuers Kapitel "Vorlagen" — die eigentlichen Kapitel/Animationen
// leben in ./Chapters.tsx (Client-Komponente). Ruehrt die echte Startseite
// (src/app/page.tsx) noch nicht an.
import { getGalleryCategories } from "@/lib/gallery-templates-data";
import { Chapters } from "./Chapters";

export default async function ZeraPreviewPage() {
  const categories = await getGalleryCategories();
  return <Chapters categories={categories} />;
}
