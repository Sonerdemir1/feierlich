# Konzept: Gemeinsamer Ablaufplan für Brautpaar + Gewerke ("Crew")

Reines Konzeptdokument — kein Code, keine Migration. Bewertungsgrundlage für eine Entscheidung, ob und wie wir das bauen.

## Ausgangspunkt

Recherchiert: tmlnapp.com, ayedu.ai, timelinegenius.com, wedtrack.app (vollständige Einzelbefunde in `docs/BENCHMARK.md`, Abschnitt 4). Kernbefund: **alle vier sind isolierte Einzelprodukte** — keins davon ist mit einer echten Gäste-Einladungsseite verbunden. tmlnapp.com trifft das Problem am schärfsten ("Wedding days are chaotic. Coordinating vendors doesn't have to be."), wedtrack.app hat mit seinem Jetzt/Als-Nächstes-Ablauf-UI (farbcodierte Kategorien, Live-Countdown) das beste Tages-selbst-Erlebnis, timelinegenius.com zeigt, wie eine gefilterte Zeitleiste pro Beteiligtem aussehen kann. Übernommen: klare Kategorie-Farbcodierung pro Gewerk-Typ, ein sichtbarer "Jetzt"-Zeiger statt einer reinen Liste, radikale Reduktion auf das, was der jeweilige Betrachter braucht.

## Datenmodell (konzeptionell — noch keine Migration)

Fünf neue Tabellen, angelehnt an bestehende Muster im Projekt:

- **`ScheduleItem`** — ein Punkt im Ablauf. `eventId`, `title` (Freitext: "Kına Gecesi", "Saaleinlass", "Erster Tanz" …), `startAt`, `durationMinutes`, `locationName`, `locationAddress`, `sortOrder`, `precedesId` (Selbstbezug auf den nächsten Punkt in der Kette — siehe Verschieben unten), `status` (geplant/bestätigt/erledigt).
- **`EventVendor`** — ein gebuchtes Gewerk für dieses Event. `eventId`, `name`, `category` (DJ/Fotograf/Kameramann/Weddingplaner/Saalbetreiber/Trauzeuge/Sonstiges), `contactName`, `contactPhone` (optional, fürs Team selbst, nicht öffentlich). **Bewusst ein neues Modell, nicht das bestehende `Partner`** — `Partner` ist unser eigenes White-Label-Partnernetzwerk (Locations/DJs/Fotografen, die einladi selbst weiterverkaufen), `EventVendor` ist ein für ein einzelnes Event gebuchter Dienstleister, unabhängig davon ob der überhaupt einladi kennt. Zwei verschiedene Konzepte, die zufällig ähnlich heißen.
- **`ScheduleAssignment`** — verknüpft `ScheduleItem` mit `EventVendor` (m:n), plus `canEdit` (Boolean — sieht nur / darf verschieben).
- **`VendorAccess`** — Konto-loser Zugang. `vendorId`, `accessToken` (langer Link-Teil, wie `Guest.inviteToken` heute schon für persönliche Gäste-Links funktioniert), `pin` (4-6-stellig, zusätzliche Hürde falls der Link weitergereicht wird), `expiresAt`.
- **`ScheduleComment`** — Chat pro Ablaufpunkt statt einem großen Gruppenchat. `scheduleItemId`, `authorName` (Freitext, kein Konto), `message`, `createdAt`.

Kapazität für die mehrtägige/mehrörtliche Struktur (Söz, Nişan, Kına, Düğün, Brautabholung, Trauung, Fotoshooting, Saaleinlass, Einzug, Anschneiden, erster Tanz, Ende) ergibt sich einfach daraus, dass `ScheduleItem` schon Datum+Ort pro Punkt trägt — kein separates "Tag"-Modell nötig, ein Tag ist einfach eine Gruppe von Punkten mit demselben Kalendertag.

## Gefilterte Sicht pro Gewerk

Ein Vendor-Link zeigt nur `ScheduleItem`s, für die eine `ScheduleAssignment`-Zeile existiert — der DJ sieht nur Musikpunkte, der Fotograf nur Bildmomente. Für den Fotografen zusätzlich: eine einfache Namensliste pro Punkt (wer soll auf dem Foto sein) — das ist inhaltlich nichts Neues, sondern derselbe `Guest`-Bezug, den wir für Sitzplan/Gästeliste schon haben, hier nur an `ScheduleItem` statt an `Table` gehängt.

## Verschieben mit Kettenreaktion

Bewusst **keine volle Abhängigkeits-Graph-Logik** (zu komplex, zu fehleranfällig für Laien, die den Plan selbst pflegen) — stattdessen eine einfache lineare Kette über `precedesId`: verschiebt sich Punkt A um 20 Minuten, verschieben sich alle Punkte, die (direkt oder über die Kette) auf A folgen, automatisch um dieselben 20 Minuten. Entspricht dem Leitsatz "keine Erklärung nötig" — für das Brautpaar fühlt es sich an wie "ich verschiebe die Trauung, der Rest rutscht mit", nicht wie ein Projektmanagement-Tool.

Benachrichtigung: bestehende `sendEmail()` (`src/lib/email.ts`) an alle `EventVendor`s, deren zugeordnete Punkte sich verschoben haben. Kein SMS/Push in Stufe 1 (siehe unten).

## Rollen & Rechte

- Brautpaar (Event-Owner) und ggf. ein zugeordneter Weddingplaner: volle Bearbeitung.
- Alle anderen Vendors: standardmäßig nur Lesen ihrer gefilterten Sicht; `canEdit` pro `ScheduleAssignment` kann einzelnen Vendors (typischerweise dem Planer) Schreibrechte auf bestimmte Punkte geben.
- Kein granulares Rollensystem mit vielen Stufen — genau zwei Zustände (lesen / verschieben dürfen) reichen für den Anwendungsfall und bleiben erklärbar.

## Der Tag selbst ohne Netz im Saal

Der ehrlichste Teil dieses Konzepts: **echte Offline-Synchronisierung (Änderungen offline machen, die später zusammengeführt werden) ist ein großes, fehleranfälliges Teilgebiet für sich** (Konfliktauflösung, Sync-Warteschlangen) — das für ein Hochzeits-Ablaufplan-Tool zu bauen wäre unverhältnismäßig. Stattdessen zwei einfache, robuste Bausteine:

1. **Druck-/Export-Ansicht** pro Gewerk, eine Woche vorher generierbar — eine reine, netzunabhängige PDF-Fassung der eigenen gefilterten Zeitleiste. Das ist die eigentliche Antwort auf "kein Netz im Saal": niemand ist auf Live-Netz angewiesen, um zu wissen, wann sein Punkt dran ist.
2. Für alle, die doch Netz haben: die zuletzt geladene Ansicht bleibt im Browser sichtbar (kein aktiver Sync-Zwang), sie sehen einfach den Stand vom letzten erfolgreichen Laden.

Echte Offline-Bearbeitung (z. B. der Saalbetreiber trägt offline eine Verzögerung ein, die später synct) explizit **nicht** Teil von Stufe 1 — siehe unten.

## Echtzeit-Technik

Heute existiert im Projekt **keine** Echtzeit-Infrastruktur (alles läuft über Server Actions + `revalidatePath`, kein WebSocket/SSE, kein Pub-Sub). Für "verschiebt der Planer einen Punkt, sieht der Fotograf es ohne eigenes Neuladen" gibt es zwei Stufen:

- **V1 (empfohlen): einfaches Neu-Abfragen alle 30-60 Sekunden** auf der offenen Vendor-Seite. Kein neuer Server, keine neue Abhängigkeit, kein zusätzlicher Monatspreis — für einen Hochzeitsablauf reicht "spätestens eine Minute später aktuell" völlig, niemand braucht Millisekunden-Synchronität.
- **V2 (nur falls sich V1 in der Praxis als zu träge erweist): echtes Push** über WebSocket/SSE oder einen Drittanbieter (z. B. Pusher/Ably) — eigene Betriebskosten und eigene Fehlerquelle, deshalb bewusst nicht in Stufe 1.

## Ehrliche Größeneinschätzung

- **Neue Datenbanktabellen**: 5 (`ScheduleItem`, `EventVendor`, `ScheduleAssignment`, `VendorAccess`, `ScheduleComment`) plus eine kleine m:n-Erweiterung für die Fotografen-Namensliste (wiederverwendet `Guest`, keine neue Tabelle).
- **Echtzeit-Technik**: keine neue Infrastruktur nötig für Stufe 1 (Polling reicht) — erst bei einem möglichen V2 kommt eine echte neue Abhängigkeit dazu.
- **Größenordnung insgesamt**: vergleichbar mit den vier größten bisherigen Ausbaustufen dieser Sitzung (Menü/Wunschliste/Musikwünsche/Check-in) zusammengenommen, eher etwas größer wegen der Konto-losen Zugriffslogik (neues Muster) und der Verschiebe-Kettenreaktion (neue Logik, kein Copy-Paste eines bestehenden Musters).

## Vorschlag für die Zerlegung in Stufen

1. **Datenmodell + Planer-Ansicht**: `ScheduleItem`/`EventVendor`/`ScheduleAssignment` im Dashboard anlegen/bearbeiten können, noch ohne Vendor-Zugang — beweist, dass das Ketten-Verschieben (`precedesId`) funktioniert und sich richtig anfühlt, bevor irgendwer außerhalb des Dashboards etwas sieht.
2. **Vendor-Zugang**: `VendorAccess` (Link + PIN), gefilterte Nur-Lese-Ansicht pro Kategorie.
3. **Verschieben + Benachrichtigung**: Kettenreaktion beim Ändern eines Zeitpunkts, E-Mail an betroffene Vendors.
4. **Kommentare pro Punkt**.
5. **Druck-/Export-Ansicht** (die eigentliche Antwort auf "kein Netz im Saal") + einfaches Polling für die Online-Ansicht am Tag selbst.

Bewusst **nicht** in dieser ersten Zerlegung enthalten, nur bei Bedarf später: echte Offline-Bearbeitung mit Sync, SMS/Push-Benachrichtigungen, echtes WebSocket-Push, ein eigenes Rollensystem mit mehr als zwei Stufen.
