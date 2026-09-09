// Prueft, ob ein echtes (bezahltes) Event Zugriff auf ein bestimmtes,
// paketgebundenes Feature hat — z.B. "photobook" ab Premium Plus.
//
// Bewusst NEU: die bestehende Tier-Logik (FEATURE_TIER/isIncludedInDefaultTier
// in DesignStudio.tsx) lebt ausschliesslich im ANONYMEN Marketing-Customizer
// (Vorschau vor dem Kauf) und hat bislang KEINE Entsprechung fuer echte,
// bereits bezahlte Events — keines der bestehenden "Premium"-Dashboard-
// Features (Sitzplan, Hochzeitsportraet, Gaestebuch/Galerie) prueft beim
// Zugriff tatsaechlich das gebuchte Paket. Diese Funktion ist der erste
// echte Laufzeit-Check dieser Art im Projekt (siehe Bestandsaufnahme zum
// Gaeste-Fotobuch-Schritt) — bewusst generisch gehalten (featureKey statt
// hartkodiertem "photobook"), damit sie spaeter auch fuer die oben
// genannten, bislang ungegateten Features nachgeruestet werden KOENNTE.
// Das Nachruesten selbst ist nicht Teil dieses Auftrags.
//
// Vergleichsbasis ist Package.features (JSON-Array von Modul-Keys, siehe
// prisma/seed.ts) — dieselbe Quelle, aus der auch die Homepage-Preiskarten
// und /preise/[key] ihre Funktionslisten bauen, statt einer eigenen,
// unabhaengig gepflegten Tier-Zuordnung.
export function eventHasFeature(
  event: { order: { status: string; package: { features: string } } | null },
  featureKey: string
): boolean {
  if (!event.order || event.order.status !== "PAID") return false;
  const features: string[] = JSON.parse(event.order.package.features || "[]");
  return features.includes(featureKey);
}
