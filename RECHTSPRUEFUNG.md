# Rechtliche Sammelprüfung — offene Textentwürfe

Interne Referenz, nicht Teil des Produktivcodes. Erstellt per Repo-weiter Recherche
(grep über Code-Kommentare, Datenschutzseite, Consent-Texte, Hinweistexte) plus
Live-Abgleich der öffentlich erreichbaren Datenschutzerklärung. Reine
Bestandsaufnahme — nichts hieran wurde inhaltlich verändert.

**Methodik-Hinweis zur Sortierung:** Die Sortierung nach Dringlichkeit berücksichtigt
zwei unabhängige Achsen, die im Ergebnis unten getrennt ausgewiesen sind:

1. **Code-Deploy-Status** — main wird (soweit anhand des Live-Abgleichs unten
   feststellbar) automatisch deployt, ein Push nach main landet also zeitnah live.
2. **Tatsächliche öffentliche Erreichbarkeit** — die Guest-Facing-Seite `/e/[slug]`
   liefert für jeden Nicht-Eigentümer `404`, solange `Event.status !== "PUBLISHED"`
   (`src/app/e/[slug]/page.tsx:112`). **Alle 6 echten Events in der Datenbank stehen
   aktuell auf `DRAFT`** (per Stichtags-Abfrage geprüft) — kein einziger echter Gast
   hat die unten gelisteten Gäste-Texte also je zu Gesicht bekommen, obwohl der Code
   dafür bereits live ist. Das `/datenschutz`-Impressum-artige Seiten sind davon
   unabhängig immer öffentlich erreichbar.

---

## 1. Datenschutzerklärung (öffentlich, jederzeit erreichbar — höchste Dringlichkeit)

**Fundort:** `src/app/datenschutz/page.tsx` — Live-Abgleich unter
`https://www.einladi.de/datenschutz` durchgeführt, Inhalt ist **identisch** mit dem
lokalen Code auf `main`. Diese Seite ist somit **nachweislich live und öffentlich
ohne jede Voraussetzung erreichbar** (kein Event nötig).

Kein Datum eines rechtlichen Sign-offs vermerkt — nur `Stand: September 2026`
(`page.tsx:38`), kein Hinweis, dass ein Anwalt/Datenschutzbeauftragter den Text
bereits geprüft hat. Die gesamte Seite ist damit als ungeprüfter Entwurf zu werten,
mit folgenden Abschnitten im Einzelnen:

### 1a. Abschnitt "KI-Funktionen (optional)" — `page.tsx:86–94`

> Wenn ihr aktiv eine KI-Funktion nutzt — Text-Assistent, Gästebuch-Übersetzung,
> Sitzplan-Vorschlag, Foto-Kuration oder KI-Hochzeitsporträt — wird der dafür nötige
> Text bzw. das Bild zur Verarbeitung an OpenAI (USA) übermittelt. Beim
> KI-Hochzeitsporträt ist das ein von euch selbst hochgeladenes eigenes Foto, kein
> Gästefoto. Das passiert ausschließlich, wenn ihr diese Funktionen selbst auslöst,
> nicht automatisch im Hintergrund.

**Kontext:** Betrifft primär das Brautpaar (Event-Ersteller) als Nutzer der
genannten KI-Funktionen; beim KI-Hochzeitsporträt explizit ein selbst hochgeladenes
Foto des Paares, kein Gästefoto — das ist auch der hier gesondert angeforderte Satz
zum KI-Hochzeitsporträt.

**Offene Punkte / Widerspruch zum tatsächlichen Code-Verhalten (siehe Fund unten):**
- Der Satz "Das passiert ausschließlich, wenn ihr diese Funktionen selbst auslöst,
  nicht automatisch im Hintergrund" ist **nicht mehr korrekt** für Gästefotos: Es
  existiert eine automatische Hintergrund-Moderation von Gästefotos über OpenAI
  (`omni-moderation-latest`-Endpunkt), die **ohne aktives Zutun des Gastes im
  Hintergrund** läuft, sobald der Gast der allgemeinen KI-Verarbeitung zugestimmt
  hat (siehe Fund 2 unten). Dieser Fall ist im Abschnitt oben nicht abgebildet.
- Kein eigener Absatz zur automatischen Gästefoto-Moderation (wer verarbeitet,
  welcher Anbieter, welcher Serverstandort) — aktuell nur implizit über den
  allgemeinen "OpenAI (USA)"-Satz mitgemeint, der sich textlich aber nur auf die
  vier/fünf oben genannten, aktiv ausgelösten Funktionen bezieht.
- Kein Hinweis auf die biometrische Gesichtserkennungs-Option (Checkbox 2, siehe
  Fund 2) — nicht erwähnt, obwohl dafür bereits eine eigene Einwilligung eingeholt
  wird.

### 1b. Weitere Abschnitte derselben Seite (zur Vollständigkeit, geringeres Risiko)
Verantwortlicher (`page.tsx:40–51`), Hosting (`53–60`), Konto & Anmeldung
(`62–68`), Transaktions-E-Mails (`70–76`), Zahlungen (`78–84`), Google Maps
(`96–102`), Von euch bereitgestellte Event-Inhalte (`104–111`), Cookies
(`113–119`), Eure Rechte (`121–127`) — beschreiben ebenfalls Nutzerdaten-
Verarbeitung (Gäste wie Brautpaar), wirken aber wie Standard-Boilerplate ohne
erkennbare Sonderrisiken. Der Vollständigkeit halber mit aufgeführt, da auch hierzu
kein Nachweis einer rechtlichen Prüfung vorliegt.

---

## 2. Zwei Einwilligungs-Checkboxen beim Gäste-Foto-/Video-Upload

**Fundort (Textquelle):** `src/lib/ai-consent.ts:22–26`
**Fundort (Rendering):** `src/app/e/[slug]/page.tsx:1113–1129`
**Deploy-Status:** Auf `main`, damit vermutlich live deployt — aber aktuell **von
keinem echten Gast erreichbar**, da alle 6 echten Events auf `DRAFT` stehen (siehe
Methodik-Hinweis oben). Wird sofort sichtbar, sobald der Betreiber ein Event
veröffentlicht.

**Wortlaut Checkbox 1 (allgemein):**
> Ich bin damit einverstanden, dass mein Foto/Video automatisiert durch KI-Systeme
> geprüft und für eine automatische Zusammenfassung (Video-Highlight) verwendet
> werden darf.

**Wortlaut Checkbox 2 (biometrisch):**
> Ich bin zusätzlich damit einverstanden, dass Gesichter auf meinem Foto/Video durch
> KI erkannt und zur Gruppierung mit anderen Fotos derselben Person verwendet
> werden dürfen (biometrische Verarbeitung).

**Begleittext unter beiden Checkboxen** (`page.tsx:1122–1128`):
> Der Upload funktioniert auch ohne Häkchen. Mehr zur Datenverarbeitung in unserer
> Datenschutzerklärung.

**Kontext:** Betrifft ausschließlich Gäste (Uploader von Fotos/Videos), nicht das
Brautpaar. Beide Häkchen sind standardmäßig nicht angehakt, unabhängig voneinander
ankreuzbar, der Upload selbst funktioniert immer (Koppelungsverbot Art. 7 Abs. 4
DSGVO, siehe Code-Kommentar `page.tsx:1102–1112`). Checkbox 2 bewusst getrennt, da
sie laut Code-Kommentar Art. 9 DSGVO (biometrische Daten) betrifft.

**Wichtiger Fund zum tatsächlichen Datenfluss:**
- **Checkbox 1 ("allgemeine KI-Verarbeitung") ist bereits mit einer echten, aktiven
  Funktion verknüpft:** `src/lib/ai-moderation.ts` schickt bei erteilter Einwilligung
  (`aiConsentGeneral`, geprüft in `src/app/e/[slug]/actions.ts:105–144`) automatisch
  jedes hochgeladene Foto an OpenAIs Moderations-Endpunkt (`omni-moderation-latest`,
  USA) — als Hintergrundprozess, ohne dass der Gast danach noch etwas tut. Das ist in
  der Datenschutzerklärung (Fund 1a) nicht als eigener Punkt genannt.
- **Checkbox 2 ("biometrisch/Gesichtserkennung") hat aktuell KEINE zugehörige
  Funktion** — per Repo-weiter Suche verifiziert: `aiConsentFace` wird nur
  gespeichert, nirgends von einer tatsächlichen Gesichtserkennungs-/Gruppierungs-
  Funktion gelesen oder verwendet. Es wird also bereits jetzt eine Einwilligung für
  eine Verarbeitung eingeholt, die es technisch noch gar nicht gibt (`ai-consent.ts`
  selbst kommentiert das als bewussten Vorgriff: "Die eigentlichen KI-Funktionen
  existieren noch nicht; dieser Schritt legt nur die Einwilligung … an", Zeile 6–8 —
  dieser Kommentar ist für Checkbox 1 inzwischen veraltet, für Checkbox 2 weiterhin
  zutreffend).

**Offene Punkte:**
- Kein Versionsnachweis-Mechanismus-Problem (ist sauber gebaut:
  `AI_CONSENT_TEXT_VERSION` in `ai-consent.ts:20` protokolliert, welchem genauen
  Wortlaut ein Gast zugestimmt hat), aber der **Wortlaut selbst** ist ungeprüft.
- Ob die Formulierung "automatische Zusammenfassung (Video-Highlight)" weiterhin
  passend ist, obwohl aktuell nur Foto-Moderation läuft (kein Video-Highlight-
  Feature existiert), sollte mitgeprüft werden — der Text verspricht mehr, als der
  Code aktuell einlöst.

---

## 3. Hinweistext beim Foto-Upload zum Gästefotobuch

**Fundort:** `src/app/e/[slug]/page.tsx:1041–1044`, mit explizitem
Code-Kommentar-TODO direkt darüber (`page.tsx:1036–1040`):
> TODO: von Anwalt/Datenschutzbeauftragten pruefen lassen — Entwurf zur Transparenz
> ueber die Fotobuch-Funktion (siehe Gaeste-Fotobuch-Schritt), bewusst als reiner
> Hinweis statt einer weiteren Checkbox, unabhaengig von den KI-Einwilligungs-
> Haekchen unten sichtbar.

**Wortlaut des Hinweises selbst:**
> Hinweis: Freigegebene Fotos können vom Gastgeber zu einem privaten
> Erinnerungs-Fotobuch zum eigenen Download zusammengestellt werden.

**Kontext:** Betrifft Gäste (deren Fotos) und informiert sie darüber, dass das
Brautpaar (Gastgeber) freigegebene Gästefotos zu einem PDF-Fotobuch für den eigenen
Download zusammenstellen kann (`src/app/dashboard/events/[id]/photobook/`,
Premium-Plus-Feature). Bewusst als reiner Hinweistext statt einer weiteren Checkbox
gestaltet — diese Design-Entscheidung selbst (Hinweis statt Einwilligung) sollte Teil
der rechtlichen Prüfung sein, nicht nur der Wortlaut.

**Deploy-Status:** Wie Fund 2 — auf `main`, vermutlich live deployt, aber aktuell
nicht von echten Gästen erreichbar (kein Event `PUBLISHED`).

**Offene Punkte:**
- Ob ein reiner Hinweis (ohne Checkbox/Widerspruchsmöglichkeit) für diese
  Verarbeitung ausreicht, ist explizit die im TODO-Kommentar selbst aufgeworfene
  Frage — noch nicht beantwortet.
- Kein Link zur Datenschutzerklärung an dieser Stelle (im Gegensatz zu den
  KI-Einwilligungs-Checkboxen direkt darunter, die auf `/datenschutz` verlinken).

---

## Gefundene Lücke (kein Text vorhanden, aber vom Auftrag erwartet)

Im Auftrag explizit genannt: *"Der Datenschutz-Abschnitt 'KI-Verarbeitung von
Gästefotos und -videos' (inkl. der Platzhalter für KI-Anbieter/Serverstandort)"*.

**Ergebnis der Suche: Dieser Abschnitt existiert nicht** — weder unter diesem noch
einem erkennbar ähnlichen Titel, weder auf `main` noch auf einem der anderen lokalen
oder Remote-Branches (`feature/ai-phase1`, `feature/editor-konsistenz`,
`feature/ki-video-moderation`, `feature/photo-tagging`,
`feature/wysiwyg-editor-umbau` geprüft), weder in `docs/` noch sonst im Repo. Auch
kein "KI-Anbieter noch nicht final benannt"-Platzhalter o. Ä. gefunden.

Am nächsten kommt dem beschriebenen Abschnitt der bestehende Absatz 1a
("KI-Funktionen (optional)") — der deckt aber, wie oben ausgeführt, die tatsächliche
automatische Gästefoto-Moderation nicht namentlich ab. Zwei Möglichkeiten:
1. Der beschriebene Abschnitt wurde an anderer Stelle (außerhalb dieses Repos,
   z. B. in einer separaten Notiz) skizziert und noch nie eingecheckt.
2. Er ist noch gar nicht geschrieben und müsste im Zuge dieser Prüfung neu verfasst
   werden — dann eher ein "fehlender Text" als ein "zu prüfender Entwurf".

Bitte kurz bestätigen, welcher der beiden Fälle zutrifft, dann kann ich bei Bedarf
einen Entwurf für diesen fehlenden Abschnitt vorbereiten (auf Wunsch, nicht Teil
dieses reinen Recherche-Schritts).

---

## Zusammenfassung nach Dringlichkeit

| # | Text | Öffentlich erreichbar? | TODO-Markierung im Code? |
|---|---|---|---|
| 1a | Datenschutz — KI-Funktionen (optional) | **Ja, sofort** (`/datenschutz`) | Nein, aber kein Sign-off-Vermerk |
| 1b | Datenschutz — übrige Abschnitte | **Ja, sofort** (`/datenschutz`) | Nein |
| 2 | Zwei KI-Einwilligungs-Checkboxen | Code live, aber hinter unveröffentlichten Events verborgen | Nein (aber „existiert noch nicht"-Kommentar für Checkbox 1 veraltet) |
| 3 | Fotobuch-Upload-Hinweistext | Code live, aber hinter unveröffentlichten Events verborgen | **Ja, explizit** |
| — | "KI-Verarbeitung von Gästefotos"-Abschnitt | Existiert nicht | — |

**Sofortiger Handlungsbedarf:** Punkt 1a, da einzig wirklich ohne jede Voraussetzung
öffentlich erreichbar. Punkte 2 und 3 werden für Gäste real relevant, sobald der
Betreiber das erste Event auf `PUBLISHED` stellt — sollte also vor dem ersten echten
Event-Launch abgeschlossen sein, nicht erst danach.
