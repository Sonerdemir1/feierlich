# KI-Feature-Roadmap (einladi.de)

Aktive Backlog-Liste, von oben nach unten abgearbeitet, nach den Grundsätzen aus CLAUDE.md. Jeder Punkt: eigener Branch, Bestandsaufnahme, Umsetzung, Live-Verifikation, Vorher/Nachher-Nachweis, `npm run build`/`tsc`/`eslint` fehlerfrei, kein Merge/Deploy ohne Rückfrage. Abhaken erst nach Fertigstellung + Verifikation.

- [ ] 1. Video-Moderation nachrüsten
- [ ] 2. Hochzeitsporträt — Pay-per-Download für hochauflösende Version
- [ ] 3. KI-Hashtag-Generator
- [ ] 4. KI-Audiobegrüßung (Text-to-Speech)
- [x] 5. "Wie wir uns kennengelernt haben"-Textgenerator
- [ ] 6. KI-kuratierte Dankeskarte

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

**Status (2026-09-10): fertig.** Branch `feature/ki-kennenlerngeschichte`.
Neue eigene Seite `love-story/page.tsx` + `actions.ts` (4 Fragen-Formular,
1:1 nach dem Vorbild von `text/page.tsx`/`text/actions.ts` — eigenes
Kontingent `LOVE_STORY_ATTEMPT_QUOTA` unabhängig vom Text-Assistenten,
eigenes Aufzeichnungsmodell `LoveStoryAttempt`). Neues Feld
`Event.loveStoryText` — editierbar exakt wie `description` (neue
`EditableLoveStory.tsx`, Klick-Auswahl im Dashboard-Editor-Panel inkl.
Link zum Formular, `inline-text/route.ts`-Freischaltung), eigener
Abschnitt „Wie wir uns kennengelernt haben" auf der Gast-Seite direkt
nach der Beschreibung. Kein Gating (wie `description` selbst auch nicht
gegated ist). Verifiziert: echter OpenAI-Aufruf liefert eine stimmige,
zusammenhängende Geschichte aus den vier Test-Antworten, Kontingent-
Anzeige korrekt (4 von 5 nach einem Versuch), „Übernehmen" schreibt
korrekt in `Event.loveStoryText`, neuer Abschnitt erscheint auf der
echten (kurz veröffentlichten Test-)Gast-Seite mit Überschrift und Text.
**Zwischenfall während der Verifikation**: der laufende Dev-Server hatte
noch den alten Prisma-Client geladen (`prisma.loveStoryAttempt` war
`undefined`, 500-Fehler) — durch Neustart (`.next` gelöscht, Server neu
gestartet) behoben, kein Code-Fehler. Gleiche Lücke wie bei den
vorherigen Punkten: der reale Formular-Absenden-Klick im Dashboard
(Login nötig) nicht per Browser nachgestellt, nur per direktem
Funktionsaufruf + Seiten-Fetch verifiziert.

## 6. KI-kuratierte Dankeskarte
Nach der Hochzeit: automatisch die besten Fotos aus der freigegebenen
Gästegalerie auswählen (baut auf Moderations-Status auf) und daraus
einen Vorschlag für die Dankeskarten-Vorlage generieren.

---
Bei JEDEM Punkt: Bestandsaufnahme, Umsetzung, Live-Verifikation,
Vorher/Nachher-Nachweis, npm run build/tsc/eslint fehlerfrei, eigener
Branch pro Punkt, KEIN Merge/Deploy ohne Rückfrage — wie in allen
bisherigen Schritten. Melde dich nach JEDEM abgeschlossenen Punkt kurz
zusammenfassend, bevor du zum nächsten übergehst — nicht erst am Ende
von allem.
