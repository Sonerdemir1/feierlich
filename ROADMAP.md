# KI-Feature-Roadmap (einladi.de)

Aktive Backlog-Liste, von oben nach unten abgearbeitet, nach den Grundsätzen aus CLAUDE.md. Jeder Punkt: eigener Branch, Bestandsaufnahme, Umsetzung, Live-Verifikation, Vorher/Nachher-Nachweis, `npm run build`/`tsc`/`eslint` fehlerfrei, kein Merge/Deploy ohne Rückfrage. Abhaken erst nach Fertigstellung + Verifikation.

- [ ] 1. Video-Moderation nachrüsten
- [ ] 2. Hochzeitsporträt — Pay-per-Download für hochauflösende Version
- [ ] 3. KI-Hashtag-Generator
- [x] 4. KI-Audiobegrüßung (Text-to-Speech)
- [ ] 5. "Wie wir uns kennengelernt haben"-Textgenerator
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

**Status (2026-09-10): fertig.** Branch `feature/ki-audiobegruessung-tts`.
Modell-Entscheidung (vor Umsetzung gemeldet, bestätigt): OpenAI TTS
(`gpt-4o-mini-tts`, Stimme „marin", MP3) — derselbe `OPENAI_API_KEY` wie
alle anderen KI-Features, kein neuer Anbieter, ~0,005–0,01 $ pro
Begrüßung. **Gating-Klärung nötig geworden**: „audio-invitation" war
bisher nur in VIP enthalten, nicht Premium Plus — nach Rückfrage
entschieden, `audio-invitation` zu `PREMIUM_PLUS.features` hinzuzufügen
(`prisma/seed.ts` + Live-DB aktualisiert; Premium-Plus-Kunden bekommen
dadurch jetzt sowohl den bestehenden eigenen Audio-Upload als auch den
neuen KI-Button). `FEATURE_TIER` im anonymen Gestalten-Customizer
(`DesignStudio.tsx`) entsprechend von „VIP" auf „Premium Plus"
nachgezogen, für Konsistenz zwischen Marketing-Vorschau und echtem
Paket-Inhalt (CLAUDE.md Punkt 6). Neue Datei `ai-audio-tts.ts`, neue
Aktion `generateAudioInvitationSpeech()` (liest `Event.description` vor,
schreibt ins bestehende `audioInvitationId`-Feld — Player/Modul-Schalter
unverändert). Verifiziert: echter OpenAI-Aufruf liefert gültige MP3
(128 kbps, ~9 Sek. für einen Beispielsatz), Gating-Logik korrekt
(Premium Plus = Zugriff, Basic = kein Zugriff, geprüft per
`eventHasFeature()` direkt gegen echte Testevents), voller
Schreibpfad (Datei speichern + Media-Zeile + `audioInvitationId` setzen)
für den berechtigten Fall erfolgreich durchlaufen. Gleiche Lücke wie bei
den vorherigen Punkten: der reale Klick auf den Button im Editor-Panel
(Login nötig) nicht per Browser nachgestellt.

## 5. "Wie wir uns kennengelernt haben"-Textgenerator
Paar beantwortet 3-4 kurze Fragen (Formular, ähnlich dem bestehenden
Text-Assistenten), KI schreibt daraus eine kleine Liebesgeschichte für
die Karte — als weiteres editierbares Textelement, gleiches Muster wie
der Beschreibungstext.

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
