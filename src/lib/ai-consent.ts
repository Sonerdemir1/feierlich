import { prisma } from "@/lib/prisma";

// DSGVO-Einwilligungs-Infrastruktur fuer Gaeste-Uploads (Fotos/Videos in der
// Foto-/Videogalerie, siehe uploadGalleryPhoto() in e/[slug]/actions.ts) —
// Grundlage, BEVOR irgendeine KI-Funktion (Inhalts-Moderation, Gesichts-
// erkennung/-gruppierung, automatisches Video-Highlight) auf Gaestefotos
// laufen darf. Die eigentlichen KI-Funktionen existieren noch nicht; dieser
// Schritt legt nur die Einwilligung + Pruef-/Widerrufs-Infrastruktur an.
//
// Zwei getrennte Zustimmungen statt einer gemeinsamen, weil Gesichts-
// erkennung biometrische Daten verarbeitet (Art. 9 DSGVO) und damit eine
// eigene, explizite Einwilligung braucht, waehrend Inhalts-Moderation und
// Video-Highlight als "allgemeine KI-Verarbeitung" zusammengefasst werden
// koennen (beides reine Bild-/Videoanalyse ohne biometrischen Bezug).

// Erhoehen, wenn sich einer der beiden Texte unten inhaltlich aendert —
// macht ueber Media.aiConsentTextVersion nachvollziehbar, welchem genauen
// Wortlaut ein Gast zugestimmt hat, auch wenn der Text spaeter angepasst
// wird (z.B. weil ein weiteres KI-Feature dazukommt).
export const AI_CONSENT_TEXT_VERSION = 1;

export const AI_CONSENT_GENERAL_TEXT =
  "Ich bin damit einverstanden, dass mein Foto/Video automatisiert durch KI-Systeme geprüft und für eine automatische Zusammenfassung (Video-Highlight) verwendet werden darf.";

export const AI_CONSENT_FACE_TEXT =
  "Ich bin zusätzlich damit einverstanden, dass Gesichter auf meinem Foto/Video durch KI erkannt und zur Gruppierung mit anderen Fotos derselben Person verwendet werden dürfen (biometrische Verarbeitung).";

export type AiConsentKind = "general" | "face";

// Zentrale Pruef-Funktion — JEDE kuenftige KI-Funktion, die ein
// hochgeladenes Foto/Video verarbeiten will (Moderation, Gesichtserkennung,
// Video-Highlight), MUSS dies zuerst hier abfragen, bevor sie das jeweilige
// Medium anfasst. Ohne entsprechendes Haekchen wird die KI-Funktion fuer
// dieses Medium einfach nicht ausgefuehrt — das Foto/Video selbst bleibt
// davon unberuehrt normal sichtbar.
export async function hasAiConsent(mediaId: string, kind: AiConsentKind): Promise<boolean> {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { aiConsentGeneral: true, aiConsentFace: true, aiConsentRevokedAt: true },
  });
  if (!media || media.aiConsentRevokedAt) return false;
  return kind === "general" ? media.aiConsentGeneral : media.aiConsentFace;
}

// Platzhalter fuer die noch nicht existierenden KI-Ergebnis-Tabellen
// (Gesichts-Gruppierung, Video-Highlight-Zuordnung o.ae.) — wird bereits
// jetzt von revokeAiConsent() aufgerufen, damit ein Widerruf spaeter
// automatisch auch bereits erzeugte KI-Ergebnisse mit entfernt, sobald
// diese Tabellen gebaut werden. Bewusst kein no-op-Kommentar allein: bei
// jeder neuen KI-Funktion, die Ergebnisse fuer ein Medium persistiert,
// MUSS hier ein zusaetzliches delete/deleteMany ergaenzt werden.
async function deletePlaceholderAiResults(mediaId: string): Promise<void> {
  // TODO: sobald Gesichts-Gruppierung/Video-Highlight existieren, hier z.B.
  // prisma.faceGroupMember.deleteMany({ where: { mediaId } }) ergaenzen.
  void mediaId;
}

// Widerruf — "so einfach wie die Erteilung" (Art. 7 Abs. 3 DSGVO): setzt
// beide Haekchen zurueck, haelt den Zeitpunkt fest UND raeumt bereits
// erzeugte KI-Ergebnisse fuer dieses Medium auf (Platzhalter oben). Der
// Aufruf selbst prueft NICHT auf Gast-Identitaet — das macht die aufrufende
// Server-Action (siehe revokeGalleryMediaConsent() in e/[slug]/actions.ts),
// da anonyme Gaeste kein Login haben und der Nachweis "eigenes Foto" dort
// ueber den Upload-Erfolgs-State der aktuellen Sitzung laeuft.
export async function revokeAiConsent(mediaId: string): Promise<void> {
  await prisma.media.update({
    where: { id: mediaId },
    data: { aiConsentGeneral: false, aiConsentFace: false, aiConsentRevokedAt: new Date() },
  });
  await deletePlaceholderAiResults(mediaId);
}
