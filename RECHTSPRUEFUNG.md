# Rechtliche Sammelprüfung — offene Textentwürfe

Interne Referenz, nicht Teil des Produktivcodes. Ursprünglich erstellt per
Repo-weiter Recherche (grep über Code-Kommentare, Datenschutzseite, Consent-Texte,
Hinweistexte) plus Live-Abgleich der öffentlich erreichbaren Datenschutzerklärung.

**Update (Branch `feature/ai-consent-datenschutz-fix`):** Zwei der damals gefundenen
Punkte wurden inzwischen bearbeitet — der fehlende Datenschutz-Abschnitt wurde als
Entwurf ergänzt, die Gesichtserkennungs-Checkbox vorerst entfernt. Beides unten bei
Fund 1a bzw. Fund 2 als „Update" markiert, ursprünglicher Rechercheteil bleibt
unverändert stehen.

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

### 1a. Abschnitt "KI-Funktionen (optional)" — `page.tsx:86–132`

**Update:** Der bislang fehlende Unterabschnitt "KI-Verarbeitung von Gästefotos und
-videos" wurde ergänzt (`page.tsx:104–128`), als TODO-markierter Entwurf (Code-
Kommentar `page.tsx:94–103`), nicht als sichtbarer Hinweis auf der Seite selbst —
identisches Muster wie der TODO-Kommentar bei Fund 3. Der Abschnitt schließt genau
die zuvor gefundene Lücke: die automatische Hintergrund-Moderation von Gästefotos
ist jetzt benannt.

> Wenn ihr aktiv eine KI-Funktion nutzt — Text-Assistent, Gästebuch-Übersetzung,
> Sitzplan-Vorschlag, Foto-Kuration oder KI-Hochzeitsporträt — wird der dafür nötige
> Text bzw. das Bild zur Verarbeitung an OpenAI (USA) übermittelt. Beim
> KI-Hochzeitsporträt ist das ein von euch selbst hochgeladenes eigenes Foto, kein
> Gästefoto. Das passiert ausschließlich, wenn ihr diese Funktionen selbst auslöst,
> nicht automatisch im Hintergrund.
>
> **KI-Verarbeitung von Gästefotos und -videos**
>
> Wenn Gäste Fotos oder Videos zur Foto-/Videogalerie eines Events hochladen, können
> sie beim Hochladen freiwillig zustimmen, dass ihr Foto/Video zusätzlich durch
> automatisierte KI-Systeme verarbeitet wird. Diese Einwilligung ist optional und hat
> keinen Einfluss darauf, ob das Foto/Video hochgeladen werden kann.
>
> Mit der „Allgemeinen KI-Verarbeitung" dürfen hochgeladene Fotos/Videos
> automatisiert auf unangemessene Inhalte geprüft werden (Inhalts-Moderation).
> Rechtsgrundlage: Einwilligung, Art. 6 Abs. 1 lit. a DSGVO. Die Verarbeitung erfolgt
> durch **[KI-Anbieter einfügen]**, mit Servern in **[Standort einfügen]**.
>
> Die Einwilligung kann jederzeit über den Widerruf-Link, der direkt nach dem
> Hochladen angezeigt wird, zurückgezogen werden.

**Kontext:** Betrifft primär das Brautpaar (Event-Ersteller) als Nutzer der zuerst
genannten KI-Funktionen; beim KI-Hochzeitsporträt explizit ein selbst hochgeladenes
Foto des Paares, kein Gästefoto — das ist auch der hier gesondert angeforderte Satz
zum KI-Hochzeitsporträt. Der neue zweite Absatz betrifft ausschließlich Gäste
(Uploader von Fotos/Videos zur Event-Galerie).

**Offene Punkte:**
- **[KI-Anbieter einfügen]** und **[Standort einfügen]** sind echte, unausgefüllte
  Platzhalter — tatsächlich ist das OpenAI (USA, `omni-moderation-latest`-Endpunkt,
  siehe `src/lib/ai-moderation.ts`), noch nicht final benannt, wie im Auftrag
  gewünscht. **Vor jedem Deploy zwingend ausfüllen** — der Text ist sonst auf einer
  Live-Seite so nicht tragbar (siehe Code-Kommentar `page.tsx:94–103`, der genau
  davor warnt).
- Der Absatz zur Gesichtserkennung/biometrischen Verarbeitung ist bewusst nicht
  enthalten (Entscheidung des Nutzers) — konsistent mit Fund 2 unten, wo die
  zugehörige Checkbox ebenfalls entfernt wurde. Bei Feature-Launch der
  Gesichtserkennung muss hier ein neuer Absatz ergänzt werden.
- Der ältere Satz "Das passiert ausschließlich, wenn ihr diese Funktionen selbst
  auslöst, nicht automatisch im Hintergrund" (erster Absatz, unverändert) bezieht
  sich weiterhin nur auf die dort genannten, aktiv ausgelösten Funktionen — durch den
  neuen zweiten Absatz jetzt aber weniger missverständlich, da die automatische
  Hintergrundverarbeitung direkt danach eigens beschrieben wird.

### 1b. Weitere Abschnitte derselben Seite (zur Vollständigkeit, geringeres Risiko)
Verantwortlicher (`page.tsx:40–51`), Hosting (`53–60`), Konto & Anmeldung
(`62–68`), Transaktions-E-Mails (`70–76`), Zahlungen (`78–84`), Google Maps
(`96–102`), Von euch bereitgestellte Event-Inhalte (`104–111`), Cookies
(`113–119`), Eure Rechte (`121–127`) — beschreiben ebenfalls Nutzerdaten-
Verarbeitung (Gäste wie Brautpaar), wirken aber wie Standard-Boilerplate ohne
erkennbare Sonderrisiken. Der Vollständigkeit halber mit aufgeführt, da auch hierzu
kein Nachweis einer rechtlichen Prüfung vorliegt.

---

## 2. Eine Einwilligungs-Checkbox beim Gäste-Foto-/Video-Upload (vorher zwei)

**Update:** Die zweite Checkbox (Gesichtserkennung/biometrisch) wurde aus dem
Upload-Formular entfernt (`page.tsx:1102–1123`, siehe Code-Kommentar dort) — sie
sammelte Einwilligung für eine Funktion, die es technisch noch nicht gibt (siehe
vorheriger Fund unten). Die zugrundeliegende Infrastruktur (`aiConsentFace`-Feld in
Prisma-Schema und DB, `ai-consent.ts`, `e/[slug]/actions.ts`) ist **unverändert im
Code geblieben** — reine UI-Änderung, keine Datenmodell-Änderung. `AI_CONSENT_FACE_TEXT`
bleibt als Export in `ai-consent.ts` bestehen, nur ungenutzt, bis die Checkbox bei
tatsächlichem Feature-Launch wieder eingeführt wird.

**Fundort (Textquelle, verbleibende Checkbox):** `src/lib/ai-consent.ts:22–23`
(`AI_CONSENT_GENERAL_TEXT`)
**Fundort (Rendering):** `src/app/e/[slug]/page.tsx:1119–1131`
**Deploy-Status:** Auf `main` (nach Merge dieses Branches), damit vermutlich live
deployt — aber aktuell **von keinem echten Gast erreichbar**, da alle 6 echten
Events auf `DRAFT` stehen (siehe Methodik-Hinweis oben). Wird sofort sichtbar,
sobald der Betreiber ein Event veröffentlicht.

**Wortlaut der verbleibenden Checkbox:**
> Ich bin damit einverstanden, dass mein Foto/Video automatisiert durch KI-Systeme
> geprüft und für eine automatische Zusammenfassung (Video-Highlight) verwendet
> werden darf.

**Begleittext darunter** (`page.tsx:1124–1130`):
> Der Upload funktioniert auch ohne Häkchen. Mehr zur Datenverarbeitung in unserer
> Datenschutzerklärung.

**Kontext:** Betrifft ausschließlich Gäste (Uploader von Fotos/Videos), nicht das
Brautpaar. Standardmäßig nicht angehakt, der Upload selbst funktioniert immer
(Koppelungsverbot Art. 7 Abs. 4 DSGVO, siehe Code-Kommentar `page.tsx:1102–1118`).

**Wichtiger Fund zum tatsächlichen Datenfluss (weiterhin gültig):**
Die verbleibende Checkbox ("allgemeine KI-Verarbeitung") ist bereits mit einer
echten, aktiven Funktion verknüpft: `src/lib/ai-moderation.ts` schickt bei erteilter
Einwilligung (`aiConsentGeneral`, geprüft in `src/app/e/[slug]/actions.ts:105–144`)
automatisch jedes hochgeladene Foto an OpenAIs Moderations-Endpunkt
(`omni-moderation-latest`, USA) — als Hintergrundprozess, ohne dass der Gast danach
noch etwas tut. Das ist jetzt in der Datenschutzerklärung als eigener Punkt genannt
(siehe Fund 1a, Update) — die Platzhalter dort müssen aber noch ausgefüllt werden.

**Live-verifiziert (echter Browser-Test, Wegwerf-Event):** Checkbox angehakt → Upload
→ `aiConsentGeneral: true`, `moderationCheckStatus: "clean"` (Moderation lief
tatsächlich durch) und `aiConsentFace: false` (Feld bleibt korrekt inaktiv, da
Checkbox nicht mehr im Formular).

**Offene Punkte:**
- Kein Versionsnachweis-Mechanismus-Problem (ist sauber gebaut:
  `AI_CONSENT_TEXT_VERSION` in `ai-consent.ts:20` protokolliert, welchem genauen
  Wortlaut ein Gast zugestimmt hat), aber der **Wortlaut selbst** ist ungeprüft.
- Ob die Formulierung "automatische Zusammenfassung (Video-Highlight)" weiterhin
  passend ist, obwohl aktuell nur Foto-Moderation läuft (kein Video-Highlight-
  Feature existiert), sollte mitgeprüft werden — der Text verspricht mehr, als der
  Code aktuell einlöst.
- Gesichtserkennung ist vorerst zurückgestellt (Checkbox + Datenschutz-Absatz beide
  entfernt/nie geschrieben) — bei tatsächlichem Feature-Launch müssen beide
  gemeinsam neu eingeführt werden, nicht einzeln.

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

## Vormals gefundene Lücke — jetzt behoben

Ursprünglich im Auftrag genannt und in der ersten Fassung dieses Dokuments als
fehlend gemeldet: *"Der Datenschutz-Abschnitt 'KI-Verarbeitung von Gästefotos und
-videos' (inkl. der Platzhalter für KI-Anbieter/Serverstandort)"*. Dieser Abschnitt
existierte zum Zeitpunkt der ersten Recherche nachweislich nirgends im Repo (main
oder einer der anderen lokalen/Remote-Branches).

**Status jetzt:** Als Entwurfstext auf Branch `feature/ai-consent-datenschutz-fix`
ergänzt, siehe Fund 1a oben — inklusive der bewusst unausgefüllten
`[KI-Anbieter einfügen]`/`[Standort einfügen]`-Platzhalter, die vor einem Deploy
zwingend auszufüllen sind.

---

## Zusammenfassung nach Dringlichkeit

| # | Text | Öffentlich erreichbar? | TODO-Markierung im Code? |
|---|---|---|---|
| 1a | Datenschutz — KI-Funktionen (optional), inkl. neuem Gästefoto-Absatz | **Ja, sofort** (`/datenschutz`) | Ja, neuer Absatz explizit; älterer Teil ohne Sign-off-Vermerk |
| 1b | Datenschutz — übrige Abschnitte | **Ja, sofort** (`/datenschutz`) | Nein |
| 2 | Eine KI-Einwilligungs-Checkbox (Gesichtserkennung vorerst entfernt) | Code live, aber hinter unveröffentlichten Events verborgen | Nein, aber Live-getestet |
| 3 | Fotobuch-Upload-Hinweistext | Code live, aber hinter unveröffentlichten Events verborgen | **Ja, explizit** |

**Sofortiger Handlungsbedarf:** Punkt 1a — der neue Gästefoto-Absatz enthält echte,
unausgefüllte Platzhalter (`[KI-Anbieter einfügen]`, `[Standort einfügen]`) und darf
in dieser Form **nicht live gehen**, bevor die Platzhalter ausgefüllt UND der ganze
Absatz rechtlich geprüft ist. Punkte 2 und 3 werden für Gäste real relevant, sobald
der Betreiber das erste Event auf `PUBLISHED` stellt — sollte also vor dem ersten
echten Event-Launch abgeschlossen sein, nicht erst danach.
