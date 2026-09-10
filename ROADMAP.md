# KI-Feature-Roadmap (einladi.de)

Aktive Backlog-Liste, von oben nach unten abgearbeitet, nach den Grundsätzen aus CLAUDE.md. Jeder Punkt: eigener Branch, Bestandsaufnahme, Umsetzung, Live-Verifikation, Vorher/Nachher-Nachweis, `npm run build`/`tsc`/`eslint` fehlerfrei, kein Merge/Deploy ohne Rückfrage. Abhaken erst nach Fertigstellung + Verifikation.

- [ ] 1. Video-Moderation nachrüsten
- [ ] 2. Hochzeitsporträt — Pay-per-Download für hochauflösende Version
- [ ] 3. KI-Hashtag-Generator
- [ ] 4. KI-Audiobegrüßung (Text-to-Speech)
- [ ] 5. "Wie wir uns kennengelernt haben"-Textgenerator
- [x] 6. KI-kuratierte Dankeskarte

## 1. Video-Moderation nachrüsten
Aktuell laufen Videos ungeprüft durch (nur Foto-Moderation existiert).
Recherchiere einen sicheren Ansatz für Frame-Extraktion (kein
ffmpeg-Binär mit Postinstall-Download-Sicherheitswarnung, siehe
frühere Entscheidung) — z. B. eine gehostete Video-Moderation-API ohne
lokale Binärabhängigkeit. Melde deine Wahl kurz, bevor du sie einbaust,
falls sie neue laufende Kosten verursacht. Sonst: gleiches Muster wie
Foto-Moderation (hasAiConsent-Check, HIDDEN bei Treffer, Gastgeber
gibt frei/löscht).

**Status (2026-09-10): zurückgestellt.** Anbieter-Wahl: Sightengine
(sightengine.com) — reine REST-API, Video-Upload per multipart/form-data
mit rohen Bytes (passt zum bestehenden `readObject()`-Muster, kein
öffentliches URL nötig), synchroner `check-sync`-Endpoint für Videos
bis 60s, Modelle `nudity-2.1`/`gore-2.0`/`offensive` decken dieselben
3 Kategorien wie die Foto-Moderation ab. Account existiert
(`SIGHTENGINE_API_USER`/`SIGHTENGINE_API_SECRET` in `.env`/`.env.example`
hinterlegt), aber per echtem Testaufruf bestätigt: Video-Analyse ist
NICHT im kostenlosen Tarif enthalten (Fehler `usage_limit`/3701) —
erfordert mindestens den Starter-Tarif für 29 $/Monat, unabhängig vom
Nutzungsvolumen. Nutzer hat entschieden: vorerst zurückstellen, mit
Punkt 2 weitermachen. Wieder aufnehmen, sobald der Nutzer den
Sightengine-Tarif upgraded oder eine Alternative ohne Monats-Minimum
gewünscht wird (AWS Rekognition Video / Google Cloud Video Intelligence
als Alternativen genannt, brauchen aber Cloud-Account-Setup statt nur
einem API-Key).

## 2. Hochzeitsporträt — Pay-per-Download für hochauflösende Version
Aktuell nur Wasserzeichen-Vorschau, kein Bezahlpfad für die
hochauflösende Version. `rawUrl` wird laut Code-Kommentar bereits dafür
vorgehalten. Baue einen einfachen Einzelkauf (Stripe, falls das Projekt
das schon für andere Zusatzkäufe nutzt — recherchiere das bestehende
Zahlungsmuster im Projekt, kein neues erfinden). Preis: 4,99€ pro
hochauflösendem Download (vorläufig, kann später angepasst werden).

## 3. KI-Hashtag-Generator
Aus Brautpaar-Namen witzige/elegante Hochzeits-Hashtag-Vorschläge
generieren, direkt in die bestehende Social-Media-Sektion integriert
(Text-Editier-Panel, "Vorschlag"-Button wie beim Einladungstext).
Kostenlos, kein Kontingent nötig (minimale Kosten wie Textvorschlag).

## 4. KI-Audiobegrüßung (Text-to-Speech)
Der eingegebene Einladungstext/Beschreibungstext wird von einer
KI-Stimme vorgelesen, als Ergänzung zur bestehenden Audio-Einladung
(Alternative zum eigenen Aufnehmen). Recherchiere eine geeignete,
kosteneffiziente TTS-API, melde Modell + Kosten vor der Umsetzung.
Gating: ab Premium Plus (wie die anderen Kernfunktionen — nutze
eventHasFeature()).

## 5. "Wie wir uns kennengelernt haben"-Textgenerator
Paar beantwortet 3-4 kurze Fragen (Formular, ähnlich dem bestehenden
Text-Assistenten), KI schreibt daraus eine kleine Liebesgeschichte für
die Karte — als weiteres editierbares Textelement, gleiches Muster wie
der Beschreibungstext.

## 6. KI-kuratierte Dankeskarte
Nach der Hochzeit: automatisch die besten Fotos aus der freigegebenen
Gästegalerie auswählen (baut auf Moderations-Status auf) und daraus
einen Vorschlag für die Dankeskarten-Vorlage generieren.

**Status (2026-09-10): fertig.** Branch `feature/ki-dankeskarte-kuratierung`.
Bestandsaufnahme: Die bestehende Dankeskarte (Modul `thank-you-card`) war
bislang reiner Text (Überschrift + Nachricht, letztere im
`EventModule.config`-JSON). Neuer Button „🎉 Dankeskarte vorschlagen (KI)"
in der Gästebuch-&-Galerie-Seite (`memories/page.tsx`, dort lebt bereits
die Foto-Kuration) — neue Aktion `suggestThankYouCard()` wählt bis zu
6 freigegebene Fotos mit `aiVerdict === "empfehlung"` (bestehende
Foto-Kuration aus `ai-photo-curation.ts`/`analyzeGalleryPhotos()`
wiederverwendet, keine neue Bewertung erfunden), mit Fallback auf
neueste freigegebene Fotos falls zu wenige „empfehlung"-Treffer, und
generiert per KI einen kurzen Dankestext. Neues Feld
`Event.thankYouPhotoIds` (JSON-Array, gleiches Muster wie
`photobookMediaIds`), Text landet an der bestehenden Stelle
(`EventModule.config.message`) — keine zweite Quelle der Wahrheit.
Gating: `eventHasFeature(eventId, "gallery")`, gleiche Voraussetzung wie
die Galerie selbst. Verifiziert: echter Testlauf mit 3 Gäste-Fotos
(2× `aiVerdict: "empfehlung"`, 1× ohne) wählte korrekt beide
Empfehlungen zuerst + eine Fallback-Ergänzung, echter OpenAI-Aufruf
lieferte einen passenden, namentlich korrekten Dankestext, Dashboard-
Seite und die echte (kurz veröffentlichte Test-)Gast-Seite zeigen Text
und alle 3 Fotos korrekt an. Gleiche Lücke wie bei den vorherigen
Punkten: der reale Button-Klick im Dashboard (Login nötig) nicht per
Browser nachgestellt, nur per direktem Nachbau der Auswahl-/
Generierungs-Logik + Seiten-Fetch verifiziert.

---
Bei JEDEM Punkt: Bestandsaufnahme, Umsetzung, Live-Verifikation,
Vorher/Nachher-Nachweis, npm run build/tsc/eslint fehlerfrei, eigener
Branch pro Punkt, KEIN Merge/Deploy ohne Rückfrage — wie in allen
bisherigen Schritten. Melde dich nach JEDEM abgeschlossenen Punkt kurz
zusammenfassend, bevor du zum nächsten übergehst — nicht erst am Ende
von allem.
