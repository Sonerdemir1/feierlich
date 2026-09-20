# Einladi – Design- & Motion-Spezifikation

**Gültig für:** Alle Marketing-/Verkaufsseiten von einladi.de (Startseite, Preise, Vorlagen-Galerie-Übersicht, Kontakt, Impressum, Datenschutz) **sowie die Gestalten-Vorschau** (`/gestalten/[templateId]`) **und die veröffentlichten Einladungsseiten der Brautpaare** (`/e/[slug]`, siehe §2a). Beide nutzen dieselbe geteilte `CameraSection`-Komponente — Konsistenz zwischen Gestalten und echter Gäste-Seite (CLAUDE.md Regel 6).
**Ablage:** `docs/MOTION.md`. In `CLAUDE.md` verlinken mit dem Satz: *"Vor jeder Arbeit an Startseite oder Galerie diese Datei vollständig lesen und einhalten."*

> **Versionshinweis:** Diese Fassung ersetzt §0–§2 der vorherigen "Tinte & Kerzenlicht"-Richtung durch die neue "Editoriale Erlebniswelt" (Zera-Studio-artiger Kapitel-Aufbau, Branch `feature/homepage-zerasoftware`). §3–§7 (Galerie-Konzept, Ton-Regeln, Barrierefreiheits-/Performance-Grenzen, Envato-Asset-Regeln, Abnahme-Checkliste) gelten unverändert weiter — sie betreffen entweder die Vorlagen-Galerie speziell (bleibt in ihrer bestehenden Kartenoptik) oder sind produktweit gültige Grenzen, unabhängig vom visuellen Stil der Marketingseiten.
>
> **Nachtrag (Gestalten-Vorschau):** Die bisherige komplette Ausnahme für `/gestalten/[templateId]` ist aufgehoben — Nutzer-Entscheidung, damit die Einladungs-Vorschau beim Scrollen dasselbe "Cinematic Scroll"-Homepage-Gefühl bekommt wie die Startseite. Übertragen wurde ausschließlich **Technik 1** (Kamerafahrt scale/opacity, §2) auf Abschnittsebene der bestehenden Belle-Struktur (`src/components/invitation-sections/*`, `.iv-section`) — siehe §2a. Die übrigen Zera-Elemente (Kapitel-Kopf mit Nummer/Label, Paginierung, Vollbild-`min-height:100vh`-Kapitel, die anderen vier Bewegungstechniken) sind NICHT übertragen — die Belle-Struktur/-Optik selbst bleibt unverändert, nur die Scroll-Bewegung kommt hinzu.

---

## 0. Was das Produkt ist

Einladi verkauft digitale Einladungskarten für Hochzeit, Verlobung, Kına, Düğün, Sünnet, Geburtstag, Babyshower und Firmenevents – deutsch und türkisch. Die Kunden sind Brautpaare und Familien, die einen einmaligen Moment im Leben planen. Sie öffnen die Seite zu 85 % auf dem Handy, oft abends, oft zu zweit auf einem Bildschirm.

Die Konkurrenz sieht aus wie ein Druckerei-Katalog. Die einladi-Marketingseiten sollen sich anfühlen wie das Durchblättern eines edlen Editorial-Magazins — jede Sektion ein eigenes, in sich abgeschlossenes "Kapitel", nicht ein endloses Scrollen durch gleichförmige Blöcke.

**Der Leitsatz für alles Folgende:** Die Startseite ist keine Seite *über* Einladungen, die beiläufig gescrollt wird. Sie ist eine kuratierte Abfolge von Kapiteln, jedes mit eigener Nummer, eigenem Thema, eigenem Bild.

**Sprache (vorerst):** Die Marketingseiten in diesem neuen Stil werden ausschließlich auf Deutsch gestaltet und getextet. Das türkische Produkt selbst — Vorlagenkategorien, KI-Textvorschläge, veröffentlichte Einladungsseiten — bleibt davon komplett unberührt; das wird hier nicht angetastet. Sollte die türkische Marketingseite später nachgezogen werden, ist das eine eigene, separate Entscheidung.

---

## 1. Gestalterische Richtung: "Editoriale Erlebniswelt"

Kein klassischer Nav-Header-Content-Aufbau. Die Seite ist eine Abfolge vollbildfüllender, nummerierter Kapitel im Stil von zerasoftwarestudio.com — jedes Kapitel füllt bewusst den gesamten Bildschirm (`min-height: 100vh`), trägt eine sichtbare Nummer/Kennzeichnung ("(01) — Thema") und endet in einer durchgehenden Paginierung mit "Weiter"-CTA am unteren Rand.

### Farben

```
--zc-bg:     #F2EEE6   /* Grundfläche jedes Kapitels */
--zc-ink:    #1A1A1A   /* Haupttext, nahezu Schwarz */
--zc-muted:  #8A8478   /* Sekundärtext, Kapitel-Nummern, Eyebrow-Labels */
--zc-accent: #B89968   /* gedämpftes Gold/Taupe — Akzentwörter, Trennlinien, Fortschrittsbalken */
```

Diese Palette gilt für die Marketingseiten. Sie ersetzt die vorherige "Tinte & Kerzenlicht"-Palette (`--porcelain`/`--ink`/`--gold`/`--henna`/`--sage`) dort vollständig. Die Vorlagen-Galerie behält ihre eigene, bestehende Kategorie-Akzentfarblogik (siehe §3) unverändert bei — die Zera-Farben umschließen die Galerie nur als Kapitel-Rahmen, greifen aber nicht in ihre eigene Kartenoptik ein.

### Typografie

- **Display: Fraunces**, in Großbuchstaben, für Kapitel-Überschriften. Große Grade (`clamp(38px, 6vw, 84px)`), Schriftschnitt 500.
- **Akzentwörter innerhalb der Überschrift**: ausdrücklich erlaubt und gewünscht — dieselbe Serife, **kursiv**, in `--zc-accent`, dabei bewusst *nicht* in Großbuchstaben (Kleinschreibung setzt den Kontrast zum Rest der Zeile).
- **Kleine Labels** (Kapitel-Nummer, Eyebrow, Paginierung): **Karla**, Großbuchstaben, Schriftschnitt 700, Buchstabenabstand `0.22em`–`0.24em`.
- **Fließtext**: Karla, normale Groß-/Kleinschreibung.

*Damit sind die bisherigen Verbote aus der Vorversion ("kein farbiges/kursives Wort in der Überschrift", "keine Versal-Labels über Abschnitten") für die Marketingseiten aufgehoben — sie waren Teil der alten Tinte-&-Kerzenlicht-Richtung, nicht mehr gültig.*

**Türkisch-Zeichenprüfung** (produktweit weiter gültig, siehe auch §3): Jede Schrift, die irgendwo im Produkt türkischsprachigen Text darstellen muss — insbesondere die Vorlagen-Galerie und die veröffentlichten Einladungsseiten —, muss `ğ Ğ ş Ş ı İ ç Ç ö Ö ü Ü` vollständig und korrekt enthalten (dotless ı und İ mit Punkt sind der häufigste Fehler bei Display-Schriften). Da die Marketingseiten in diesem Stil vorerst rein deutsch sind, gilt die Prüfpflicht hier nicht für Fraunces/Karla — wird aber fällig, sobald/falls eine türkische Fassung der neuen Marketingseiten entsteht.

### Material

- Papier-Textur, Gold-Prägungs-Loop und Vignette/Grain-Verbot aus der Vorversion entfallen — die neue Richtung arbeitet mit klaren Flächen, echter (gestagter) Fotografie und Schatten statt Textur-Overlays.
- Gestagte Bilder ("wie auf einem Sockel platziert"): weicher, warmer Schlagschatten (`0 40px 70px -30px rgba(26,26,26,.35)`, `0 10px 24px -12px rgba(26,26,26,.22)`) plus ein dezenter Goldverlauf hinter dem Bild (`radial-gradient` mit `--zc-accent`, niedrige Deckkraft) statt eines physischen Sockel-Elements.

---

## 2. Struktur & Bewegung der Marketingseiten

**Betroffene Seiten:** Startseite, Preise, Vorlagen-Galerie-Übersicht, Kontakt, Impressum, Datenschutz — jede als eigene Abfolge nummerierter Kapitel, mit fortlaufender Kapitelnummer pro Seite.

### Aufbau pro Kapitel

- `min-height: 100vh`, Kapitel-Kopf oben links (Nummer + Thema-Label), Inhalt vertikal zentriert/verteilt, Paginierung + "Weiter"-Link unten.
- Zweispaltiges Grundmuster (Text/CTA eine Seite, gestagtes Bild die andere), alternierend links/rechts von Kapitel zu Kapitel für Rhythmus. Kapitel mit eigener Komponente (z. B. die Vorlagen-Galerie-Kacheln, siehe §3) dürfen davon abweichen und die volle Breite nutzen.
- Letztes Element jeder Seite: ein normaler, nicht nummerierter Footer-Streifen (Kontakt/Rechtliches/Tagline) — kein weiteres Kapitel.

### Scroll-Animationen

**Motion** (`motion/react`, siehe auch CLAUDE.md "Design- & Motion-Standards").

> **Korrektur einer früheren Fassung dieses Abschnitts:** Hier stand, die in
> der Vor-Zera-Version beschriebene GSAP-ScrollTrigger-Kamerafahrt
> (`scale 1.08→1` + `opacity`, an die Scroll-Position gekoppelt) sei "nie
> umgesetzt" worden — das war falsch. Sie lief produktiv in
> `MotionScrollCamera.tsx` auf der echten Startseite, bis diese Datei beim
> Zera-Umbau ersetzt wurde. Lenis (künstliches Scroll-Smoothing) wurde
> dagegen tatsächlich nie eingesetzt — bewusst, siehe unten.

**Verbindliche Regel, dauerhaft und unabhängig von Farbpalette/Stilrichtung:**
Niemals reines `whileInView`-Fade-Slide (`opacity 0→1` plus `y: 28px→0`,
einmalig durch Sichtbarkeit ausgelöst) auf Abschnittsebene als **einzige**
Bewegungstechnik verwenden — das ist der generische Standard, den
zehntausende Template-Websites nutzen, und macht eine Seite austauschbar,
unabhängig davon, wie gut Farben/Typografie sonst sind. Ein Abgleich gegen
diese Regel gehört in die Checkliste in §7.

- Inhalte, die beim Laden bereits im sichtbaren Bereich stehen (z. B. das erste Kapitel einer Seite): `initial`/`animate` bzw. unanimiert — dafür gibt es nichts "hineinzuscrollen", die Kamerafahrt betrifft per Definition den Übergang zwischen Abschnitten.
- **Übergänge zwischen Kapiteln:** scroll-gekoppelte Kamerafahrt statt Sichtbarkeits-Trigger — das ganze Kapitel (Kopf + Inhalt als Einheit, wie im ursprünglichen GSAP-Setup) skaliert kontinuierlich von `scale 1.08 → 1` und blendet von `opacity 0 → 1`, direkt an den tatsächlichen Scroll-Fortschritt gekoppelt. Es soll wirken, als bewege sich die Kamera nach vorn, nicht als schiebe sich der Inhalt nach oben. Kein `y`-Versatz in dieser Technik — nur `scale` und `opacity`, beide ausschließlich transform-/opacity-basiert (siehe §5).
- Technisch: Motions `useScroll`/`useTransform` (`target` = Kapitel-`<section>`, `offset: ["start end", "start start"]`), **nicht** `whileInView`. Deckt den scrub-Charakter von GSAP ScrollTrigger technisch gleichwertig ab — CLAUDE.md legt Motion als feste Bibliothek für dieses Projekt fest, GSAP ist inzwischen keine Dependency mehr im Projekt.
- Bewusst **ohne** Lenis: künstliches Über-Zeit-Glätten jedes Scroll-Impulses machte die Seite in einem früheren Test spürbar träge ("extrem langsam" laut Nutzer-Feedback) — native Scroll-Performance ist die validierte Entscheidung, nur die scale/opacity-Kamerafahrt selbst wird eingesetzt.

---

## 2a. Gestalten-Vorschau (`/gestalten/[templateId]`) & Gäste-Seite (`/e/[slug]`)

Weder die Einladungs-Vorschau in `DesignStudio.tsx` noch die echte
Gäste-Seite in `e/[slug]/page.tsx` sind ein Kapitel-Layout wie die
Startseite — beide bleiben die bestehende, durchgehend scrollende Belle-
Struktur (`src/components/invitation-sections/*`, `.iv-page`/`.iv-section`).
Übernommen wird ausschließlich die scroll-gekoppelte Kamerafahrt
(**Technik 1** aus §2), pro Abschnitt statt pro Vollbild-Kapitel — auf
beiden Seiten identisch, über dieselbe geteilte Komponente:

- Geteilte Komponente: `src/components/invitation-sections/CameraSection.tsx`
  — kapselt exakt dieselbe `useScroll`/`useTransform`-Logik wie
  `useCameraProgress()` in `HomeChapters.tsx` (`scale [1.08,1]`,
  `opacity [0,1]`, `offset: ["start end", "start start"]`), zusätzlich mit
  `useReducedMotion()`-Prüfung (siehe unten) — korrekt hydration-sicher
  (siehe Bericht: zwei echte Bugs beim Gestalten-Einsatz gefunden und
  behoben, `useSyncExternalStore`-Muster statt `setState`-im-Effect, sowie
  konstante Wertebereiche statt Prop-Typwechsel).
- Eingesetzt um (Gestalten, `DesignStudio.tsx`): Paar-Vorstellung,
  Kennenlerngeschichte, sowie jeden Abschnitt aus `draft.sectionOrder`
  (Ablaufplan, Countdown, Galerie, Zusagen, Gästebuch, Wunschliste,
  Musikwünsche, Dresscode, Social Media, Menü, Dankeskarte, Audio-/Video-
  Einladung, Sitzplan-Suche).
- Eingesetzt um (Gäste-Seite, `e/[slug]/page.tsx`): "Der große Tag"-
  Countdown-Band (in `EventHero.tsx`), Beschreibung, Kennenlerngeschichte,
  Ort, Ablaufplan, Wetter, Check-in, Zusagen, Sitzplan-Suche, Menü,
  Galerie, Gästebuch, Musikwünsche, Wunschliste, Dresscode, Social Media,
  Audio-/Video-Einladung, Dankeskarte, Footer.
- **Nicht** animiert (beide Seiten identisch): der Hero-Kopf (Titel/Namen/
  Familienzeile/Beschreibung bzw. Anlass-Label) — der steht beim Laden
  bereits im sichtbaren Bereich (siehe §2, "nichts hineinzuscrollen"),
  plus die Google-Maps-/Kalender-Aktionsleiste direkt darunter (UI-Chrome,
  kein inhaltlicher Abschnitt).
- `prefers-reduced-motion: reduce`: `CameraSection` prüft `useReducedMotion()`
  und lässt `scale`/`opacity` in diesem Fall komplett weg (kein `style`-
  Override) — Abschnitte erscheinen direkt in Endposition, keine
  Bewegungssequenz. `useCameraProgress()` in `HomeChapters.tsx` (Startseite)
  nutzt jetzt dieselbe Technik (Wertebereich kollabiert auf `[1,1]` statt
  die `style`-Prop-Form zu wechseln, erst nach dem Mount aktiv) — mit
  Playwright + `emulateMedia({reducedMotion:"reduce"})` verifiziert: alle
  Kapitel stehen sofort in Endposition (`opacity:1`, `transform:none`),
  keine Hydration-Warnung. Die anderen vier Bewegungstechniken auf der
  Startseite (Text-Fuell, Wort-Stagger, horizontaler Einschub, Pinning)
  wurden dabei NICHT geprüft/angepasst — offen, ob sie dieselbe Lücke haben.
- Bewusst NICHT mit übernommen: Kapitel-Nummerierung/-Label, Paginierung,
  `min-height: 100vh`-Vollbild-Zwang, Pinning/Text-Fill/Stagger/Horizontal-
  Einschub (Techniken 2–5) — beide Seiten bleiben ein normal scrollender,
  editierbarer bzw. funktionaler Baukasten, kein Marketing-Kapitel-Erlebnis.

---

## 3. Galerie

Die Galerie ist der Ort, an dem heute der Eindruck kippt. Sie darf kein Raster gleich großer, gleich runder Kacheln sein.

### Konzept: Karten als physische Objekte

- Jede Vorlage liegt leicht gedreht (`rotate` zwischen `-1.8deg` und `1.8deg`, aus der Template-ID deterministisch abgeleitet, nicht zufällig pro Render – sonst springt es beim Re-Render).
- Zwei Schattenebenen, warm statt schwarz (siehe §1 Material): `0 2px 4px rgba(60,40,20,.10)` und `0 30px 60px rgba(60,40,20,.06)`.
- Unterschiedliche Höhen je nach Kartenformat (Hochkant, Quadrat, Panorama). Ein Masonry-Layout, kein starres Grid.
- Ecken: die Karte hat den Radius ihres eigenen Papierformats (2–4 px), nicht den Radius des UI. Unterschiedliche Radien für unterschiedliche Dinge ist gewollt.

### Vorschau statt Hover-Effekt

Beim Antippen (mobil) bzw. bei `hover` mit 120 ms Verzögerung (Desktop) hebt sich die Karte an – `translateY -8px`, `scale 1.02`, 400 ms – und **spielt ihre eigene 3-Sekunden-Mikro-Animation ab**: Umschlag öffnet sich einen Spalt, Ornament zeichnet an, Namen erscheinen. Das ist das Verkaufsargument. Eine statische Vorschau verkauft eine animierte Karte nicht.

Technisch: vorgerendertes, stummes `<video>` in WebM/AV1, maximal 400 KB, `preload="none"`, erst laden, wenn die Karte im Viewport ist. Poster-Bild als WebP.

Beim Öffnen einer Vorlage: View Transitions API, die Karte wächst aus ihrer Position in die Detailansicht. Fallback für Browser ohne Unterstützung: `motion` Layout-Animation über `layoutId`.

### Kategorie-Navigation

Die Struktur laut Projektstand: türkischer Zweig (Düğün, Kına, Sünnet, Nişan) und deutscher Zweig (Hochzeit, Verlobung, Babyshower, Geburtstag, Firmenevents).

Die Umschaltung zwischen den beiden Zweigen ändert die Akzentfarbe der gesamten Galerie – `--henna` für den türkischen, `--sage` für den deutschen Zweig – über eine 600-ms-Überblendung der CSS-Variablen. Das ist ein Systemwechsel, kein Filter-Klick, und soll sich auch so anfühlen. Diese beiden Farben leben ausschließlich innerhalb der Galerie-Kacheln, unabhängig von der Zera-Palette aus §1, die den Rest der Marketingseiten umgibt.

Filterwechsel: die ausscheidenden Karten fallen mit 30 ms Stagger heraus (`opacity → 0`, `scale → 0.96`), die neuen kommen mit 40 ms Stagger herein. FLIP-Technik, damit die bleibenden Karten an ihre neue Position gleiten statt zu springen.

**Türkisch-Zeichenprüfung:** Da die Galerie türkische Vorlagennamen/-kategorien zeigt und unverändert bestehen bleibt, gilt hier weiterhin verbindlich: jede eingesetzte Schrift muss `ğ Ğ ş Ş ı İ ç Ç ö Ö ü Ü` vollständig und korrekt rendern (dotless ı, İ mit Punkt), vor jedem Schriftwechsel im Screenshot geprüft.

---

## 4. Ton

Auf den Marketingseiten läuft nie automatisch Ton. Browser blocken das ohnehin, und Kunden schauen abends neben schlafenden Kindern.

- Hero-Hintergrundvideo, falls verwendet: `muted`, `playsinline`, `loop`.
- Der Tap auf das Siegel ist die gültige User-Geste. Danach – und nur danach – darf Musik starten, und zwar leise eingeblendet über 1200 ms.
- Ton-Schalter dauerhaft sichtbar, unten rechts, Zustand in `localStorage` merken.
- In der Kartenvorschau in der Galerie: immer stumm. Ton erst in der Detailansicht.

---

## 5. Grenzen (verbindlich)

- `prefers-reduced-motion: reduce` → alle Sequenzen entfallen, es bleiben Überblendungen unter 200 ms. Die Seite muss in diesem Zustand vollständig funktionieren, nicht nur "auch gehen".
- Animiert wird ausschließlich über `transform` und `opacity`. Kein `top`, `left`, `width`, `height`, `margin` in Keyframes.
- Ziel: 60 fps auf einem Android-Mittelklassegerät. Prüfen mit CPU-Drosselung 4× in den DevTools.
- LCP unter 2,5 s auf 4G. Das Hero-Poster ist das LCP-Element, nicht das Video.
- Sichtbarer Tastatur-Fokus auf allen interaktiven Elementen. Die Hero-Sequenz muss per Enter/Space auslösbar sein.
- Kein Layout-Sprung beim Nachladen der Schriften: `font-display: swap` plus `size-adjust`-Fallback.

---

## 6. Grafik-Assets aus Envato

Genutzt werden ausschließlich Ornamente, Muster, Texturen und Schriften – kein fremder Code, keine ganzen Templates.

```
/public/assets/
  ornaments/turkish/     Bordüren, Arabesken, Tuğra-artige Formen
  ornaments/botanical/   Zweige, Kränze, Blüten
  textures/              Papierfaser, Leinen, Grain
  fonts/                 nur mit geprüfter Türkisch-Abdeckung
/docs/asset-register.md  Herkunft und Lizenz jedes Assets
```

Regeln:

- SVG statt PNG, wo immer möglich. Ornamente müssen als Pfade animierbar sein (`stroke-dasharray`), das geht mit Rasterbildern nicht.
- Jedes SVG durch SVGO, `fill` auf `currentColor` umstellen, damit es die Kategoriefarbe erbt.
- `asset-register.md` wird bei jedem neuen Asset gepflegt: Dateiname, Envato-Item-Link, Datum, wofür verwendet. Envato verlangt eine Registrierung pro Projekt und Item – ohne diese Liste ist das später nicht mehr nachvollziehbar.
- Schriften: Lizenz für Web-Einbettung prüfen, bevor sie ins Repo kommen. Bei Zweifel eine Google-Font mit gleichem Charakter nehmen.

---

## 7. Vor jedem "fertig"

Kein Abschnitt gilt als erledigt, bevor folgendes gelaufen ist:

1. Dev-Server starten, mit Playwright bei 390 × 844 px (iPhone-Format) und bei 1440 px Screenshots erstellen.
2. Von jedem neuen Kapitel Screenshots im Ruhezustand (voll eingeblendet) — nicht mitten in der Animation.
3. Diese Bilder selbst ansehen und gegen diese Datei prüfen.
4. Drei Punkte benennen, an denen es noch nach Standard-Template aussieht, und sie beheben, bevor du meldest, dass es fertig ist.
5. Einen Durchlauf mit `prefers-reduced-motion: reduce` screenshotten.
