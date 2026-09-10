# KI-Feature-Roadmap (einladi.de)

Aktive Backlog-Liste, von oben nach unten abgearbeitet, nach den Grundsätzen aus CLAUDE.md. Jeder Punkt: eigener Branch, Bestandsaufnahme, Umsetzung, Live-Verifikation, Vorher/Nachher-Nachweis, `npm run build`/`tsc`/`eslint` fehlerfrei, kein Merge/Deploy ohne Rückfrage. Abhaken erst nach Fertigstellung + Verifikation.

- [ ] 1. Video-Moderation nachrüsten
- [x] 2. Hochzeitsporträt — Pay-per-Download für hochauflösende Version
- [x] 3. KI-Hashtag-Generator
- [x] 4. KI-Audiobegrüßung (Text-to-Speech)
- [x] 5. "Wie wir uns kennengelernt haben"-Textgenerator
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

**Status (2026-09-10): fertig.** Branch `feature/ki-hochzeitsportraet-download`.
Bestehendes Muster wiederverwendet (wie `startAddOnCheckout`/`startCheckout`
in `billing/actions.ts`: Stripe Checkout Session, `metadata.kind` steuert den
gemeinsamen Webhook-/Success-Seiten-Dispatcher, ADMIN-Testkonten bekommen
den Bypass ohne echten Stripe-Aufruf). Neues Modell
`WeddingPortraitDownload` (1:1 zu `WeddingPortraitAttempt`, PENDING/PAID
über `OrderStatus`, analog zu `EventAddOn` aber pro Portraet-Versuch statt
pro Event, da mehrere Stile einzeln kaufbar sein sollen). Neue Route
`wedding-portrait/download/[attemptId]` liefert `rawUrl` (ohne Wasserzeichen)
nur bei `status === "PAID"` aus. Verifiziert: Seite zeigt „Kaufen — 4,99 €"
bzw. nach Bezahlung „Herunterladen" korrekt an (Premium-Plus-unabhängiges
Wegwerf-Testkonto, curl+Session-Cookie), Download-Route sperrt 401 (nicht
angemeldet)/404 (fremdes Event)/403 (nicht bezahlt) und liefert nach
Bezahlung 200 mit den echten Bilddaten, Fulfillment-Funktion idempotent
(zweiter Aufruf überschreibt nichts). Einzige Lücke: der eigentliche
Stripe-Checkout-Redirect selbst (Server Action, nicht per curl nachstellbar,
identisches Problem wie bei Punkt Tier-Gating) wurde nicht per echtem
Klick getestet, nur per Code-Abgleich mit dem bereits produktiven
`startAddOnCheckout`-Muster.

## 3. KI-Hashtag-Generator
Aus Brautpaar-Namen witzige/elegante Hochzeits-Hashtag-Vorschläge
generieren, direkt in die bestehende Social-Media-Sektion integriert
(Text-Editier-Panel, "Vorschlag"-Button wie beim Einladungstext).
Kostenlos, kein Kontingent nötig (minimale Kosten wie Textvorschlag).

**Status (2026-09-10): fertig.** Branch `feature/ki-hashtag-generator`.
Bestandsaufnahme ergab: der "Vorschlag"-Button beim Einladungstext lebt
NICHT auf der separaten Text-Assistent-Seite, sondern direkt im
Kontext-Panel des Dashboard-Editors (`DesignEditor.tsx`, Klick auf die
Beschreibung in der Live-Vorschau öffnet ein Panel mit „✨ KI-Vorschlag"-
Button, siehe `suggest-description/route.ts`) — der Hashtag-Text
(`Event.socialMediaText`, Feld-Label bereits „Hashtag-Text") ist über
denselben Klick-Auswahl-Mechanismus (`EditableSectionText`) schon lange
auswählbar, bekam nur noch keinen eigenen Button. Neue Route
`text/suggest-hashtags` (gleiches Muster wie `suggest-description`, aber
bewusst OHNE Kontingent/`AiTextAttempt`-Eintrag laut Auftrag) schreibt
5 KI-generierte Hashtags direkt in `socialMediaText`. Neue Funktion
`generateHashtagSuggestions()` in `ai-text.ts`, neue Kostenschätzung
`HASHTAG_SUGGESTION_COST_ESTIMATE_USD` (gleicher Modell wie Textvorschlag,
gpt-5.4-mini). Verifiziert: echter OpenAI-Aufruf über die Route liefert
5 plausible deutsche Hashtags (z. B. „#AnnaLukas2026 #TeamAnnaUndLukas
#JaZuAnnaUndLukas2026..."), in der DB korrekt gespeichert, Route sperrt
401 ohne Login. Der eigentliche Klick auf das Hashtag-Textfeld im
Editor-Panel (Browser-Login nötig) wurde aus denselben technischen
Gründen wie bei Punkt 2 nicht per echtem Klick nachgestellt, nur per
Code-Abgleich mit dem bereits produktiven Beschreibungstext-Button.

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
Begrüßung. **Gating-Klärung, dann korrigiert**: „audio-invitation" war
bisher nur in VIP enthalten, nicht Premium Plus — zunächst (nach
Rückfrage) zu `PREMIUM_PLUS.features` hinzugefügt, dann vom Nutzer als
Fehlentscheidung markiert und wieder zurückgesetzt (`prisma/seed.ts` +
Live-DB: `audio-invitation` wieder NUR in `VIP.features`, `FEATURE_TIER`
in `DesignStudio.tsx` wieder auf „VIP"). Damit gilt weiterhin: die
Audio-Einladung (eigener Upload UND der neue KI-Button) ist
VIP-exklusiv, Premium Plus hat keinen Zugriff — unverändert gegenüber
dem Stand vor diesem Roadmap-Punkt. Neue Datei `ai-audio-tts.ts`, neue
Aktion `generateAudioInvitationSpeech()` (liest `Event.description` vor,
schreibt ins bestehende `audioInvitationId`-Feld — Player/Modul-Schalter
unverändert) — der TTS-Code selbst war von der Gating-Korrektur nicht
betroffen, er nutzt automatisch dasselbe `eventHasFeature("audio-invitation")`
wie die bestehende Audio-Einladung. Verifiziert: echter OpenAI-Aufruf
liefert gültige MP3 (128 kbps, ~9 Sek. für einen Beispielsatz),
Gating-Logik nach der Korrektur erneut per `eventHasFeature()` gegen
echte Test-Events geprüft (Premium Plus = kein Zugriff, VIP = Zugriff),
voller Schreibpfad (Datei speichern + Media-Zeile + `audioInvitationId`
setzen) für den berechtigten Fall erfolgreich durchlaufen. Gleiche
Lücke wie bei den vorherigen Punkten: der reale Klick auf den Button im
Editor-Panel (Login nötig) nicht per Browser nachgestellt.

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
