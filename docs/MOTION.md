# Einladi – Design- & Motion-Spezifikation

**Gültig für:** Startseite und Vorlagen-Galerie. Andere Bereiche später.
**Ablage:** `docs/MOTION.md`. In `CLAUDE.md` verlinken mit dem Satz: *"Vor jeder Arbeit an Startseite oder Galerie diese Datei vollständig lesen und einhalten."*

---

## 0. Was das Produkt ist

Einladi verkauft digitale Einladungskarten für Hochzeit, Verlobung, Kına, Düğün, Sünnet, Geburtstag, Babyshower und Firmenevents – deutsch und türkisch. Die Kunden sind Brautpaare und Familien, die einen einmaligen Moment im Leben planen. Sie öffnen die Seite zu 85 % auf dem Handy, oft abends, oft zu zweit auf einem Bildschirm.

Die Konkurrenz sieht aus wie ein Druckerei-Katalog. Einladi soll sich anfühlen wie der Moment, in dem man einen schweren Umschlag in der Hand hält.

**Der Leitsatz für alles Folgende:** Die Startseite ist keine Seite *über* Einladungen. Sie ist selbst eine.

---

## 1. Gestalterische Richtung: "Tinte & Kerzenlicht"

Kein Weiß-auf-Weiß-Katalog, kein Creme-Beige mit Terrakotta-Akzent, keine Karten-Kacheln mit gleichem Radius und grauem Schatten. Die Seite ist dunkel, warm und tief – wie ein Saal kurz vor dem ersten Tanz. Das Papier leuchtet, der Rest tritt zurück.

### Farben

```
--ink:        #14121C   /* Tiefe Tinte, fast schwarz mit Violettstich – Grundfläche */
--ink-deep:   #0C0A12   /* Vignette, Ränder, Schattenzonen */
--parchment:  #F2E9DA   /* Papier – nur dort, wo wirklich Karte ist */
--gold:       #C9A15C   /* Prägung, Linien, Siegel. Sparsam. */
--henna:      #8E2C3B   /* Akzent für türkische Kategorien */
--sage:       #6C7A63   /* Akzent für botanisch/deutsche Kategorien */
```

Gold wird nie als Fläche eingesetzt, nur als Linie, Kante oder Textfarbe. Wenn Gold mehr als 5 % der Bildfläche einnimmt, ist es zu viel.

### Typografie

Zwei Familien, klar unterschieden:

- **Display: Fraunces** (variabel, Achsen `opsz`, `wght`, `SOFT`, `WONK`). Für Namen, Überschriften, Kategorie-Titel. Große Grade in 300–400, `opsz` hochdrehen, `WONK` an – das gibt den kalligrafischen Zug ohne Skript-Schrift-Kitsch.
- **Text: Karla.** Für alles Funktionale: Navigation, Preise, Buttons, Formulare.

**Pflichtprüfung vor jedem Schriftwechsel:** Die Schrift muss `ğ Ğ ş Ş ı İ ç Ç ö Ö ü Ü` vollständig enthalten. Das dotless ı und das İ mit Punkt sind der häufigste Fehler bei Display-Schriften. Wird eine Envato-Schrift eingesetzt, zuerst diese acht Zeichen rendern und im Screenshot prüfen.

Verboten: ein einzelnes Wort in der Überschrift farbig oder kursiv hervorheben. Versal-Labels über Abschnitten. Ein `→` hinter Buttontexten.

### Material

Jede Fläche hat eine Materialität, keine flachen Farbblöcke:

- Papier: leichte Faser-Textur als `background-image`, dazu ein `box-shadow` mit zwei Ebenen (nah/hart, fern/weich), damit die Karte über der Fläche schwebt statt aufgeklebt zu sein.
- Grain-Overlay über der gesamten Seite: SVG `feTurbulence`, Opacity 0.035, `mix-blend-mode: overlay`, `pointer-events: none`.
- Vignette an den Rändern des Viewports, radialer Verlauf zu `--ink-deep`.
- Gold-Prägung: animierter Verlauf unter `background-clip: text`, 6 s Loop, sehr langsam. Nur auf einem Element pro Bildschirm.

---

## 2. Startseite

### Aufbau

```
┌─────────────────────────────────┐
│                                 │
│      [ geschlossener Umschlag ] │   Vollbild, 100dvh
│         mit Siegel              │   dunkel, Vignette
│                                 │
│   "Öffnen"  (kleiner Hinweis)   │
└─────────────────────────────────┘
        ↓ Tap / Scroll
┌─────────────────────────────────┐
│   Karte fährt heraus, Namen     │
│   schreiben sich, Ornament      │
│   zeichnet sich                 │
└─────────────────────────────────┘
        ↓ weiter scrollen
┌─────────────────────────────────┐
│   Was Einladi kann              │   drei Momente, nicht drei Kacheln
│   (RSVP · Fotowand · Tischkarten)│
└─────────────────────────────────┘
        ↓
┌─────────────────────────────────┐
│   Galerie-Einstieg              │
└─────────────────────────────────┘
```

### Die Hero-Sequenz (der einzige große Motion-Moment der Seite)

Ablauf beim ersten Tap bzw. beim ersten Scroll-Impuls:

| Phase | Dauer | Was passiert |
|---|---|---|
| 0 ms | – | Siegel pulsiert dezent: `scale 1 → 1.03 → 1`, 2400 ms, `ease-in-out`, endlos. Der einzige Loop auf der Seite. |
| Tap | 500 ms | Siegel: `scale 1 → 1.08 → 0`, `rotate -12deg`, `cubic-bezier(0.34, 1.56, 0.64, 1)`. Bruchstück-Partikel optional, maximal 6. |
| +200 ms | 1200 ms | Umschlagklappe: `rotateX 0 → -168deg`, `transform-origin: top center`, Elternelement `perspective: 1400px`, `cubic-bezier(0.22, 1, 0.36, 1)`. Der Schlagschatten unter der Klappe wandert synchron mit. |
| +600 ms | 900 ms | Karte gleitet heraus: `translateY 12% → -4%`, `filter: blur(6px) → blur(0)`, gleiche Kurve. |
| +1300 ms | – | Namen erscheinen buchstabenweise: 45 ms Stagger, `translateY 20px → 0`, `opacity 0 → 1`, `cubic-bezier(0.16, 1, 0.3, 1)`. |
| +1300 ms | 1600 ms | Ornament-SVG zeichnet sich per `stroke-dasharray`/`stroke-dashoffset`. |
| +1600 ms | – | Kamerafahrt: die Szene skaliert langsam `1 → 1.04` über 8 s und driftet 2 % nach oben. Das ist die "Kamera", nicht ein Effekt pro Element. |

Nach Abschluss ist der Ton-Schalter sichtbar (siehe §4).

### Kamerafahrten beim Scrollen

GSAP ScrollTrigger, `scrub: 1`, dazu Lenis für weiches Scrollen (`duration: 1.2`).

- Hintergrund-Textur läuft mit Faktor 0.3 mit (Parallax), Vordergrund mit 1.0.
- Übergang zwischen den Abschnitten: der nächste Abschnitt schiebt sich nicht ein, sondern wird durch eine Tiefenänderung erreicht – `scale 1.08 → 1` plus `opacity 0 → 1` über den Scroll-Verlauf. Es soll wirken, als bewege sich die Kamera nach vorn, nicht als bewege sich der Inhalt nach oben.
- **Kein** Fade-and-slide-up auf jedem Abschnitt. Das ist der generische Standard und genau das, was die Seite alt aussehen lässt.

---

## 3. Galerie

Die Galerie ist der Ort, an dem heute der Eindruck kippt. Sie darf kein Raster gleich großer, gleich runder Kacheln sein.

### Konzept: Karten als physische Objekte

- Jede Vorlage liegt leicht gedreht (`rotate` zwischen `-1.8deg` und `1.8deg`, aus der Template-ID deterministisch abgeleitet, nicht zufällig pro Render – sonst springt es beim Re-Render).
- Zwei Schattenebenen: `0 2px 4px rgba(0,0,0,.4)` und `0 30px 60px rgba(0,0,0,.5)`.
- Unterschiedliche Höhen je nach Kartenformat (Hochkant, Quadrat, Panorama). Ein Masonry-Layout, kein starres Grid.
- Ecken: die Karte hat den Radius ihres eigenen Papierformats (2–4 px), nicht den Radius des UI. Unterschiedliche Radien für unterschiedliche Dinge ist gewollt.

### Vorschau statt Hover-Effekt

Beim Antippen (mobil) bzw. bei `hover` mit 120 ms Verzögerung (Desktop) hebt sich die Karte an – `translateY -8px`, `scale 1.02`, 400 ms – und **spielt ihre eigene 3-Sekunden-Mikro-Animation ab**: Umschlag öffnet sich einen Spalt, Ornament zeichnet an, Namen erscheinen. Das ist das Verkaufsargument. Eine statische Vorschau verkauft eine animierte Karte nicht.

Technisch: vorgerendertes, stummes `<video>` in WebM/AV1, maximal 400 KB, `preload="none"`, erst laden, wenn die Karte im Viewport ist. Poster-Bild als WebP.

Beim Öffnen einer Vorlage: View Transitions API, die Karte wächst aus ihrer Position in die Detailansicht. Fallback für Browser ohne Unterstützung: `motion` Layout-Animation über `layoutId`.

### Kategorie-Navigation

Die Struktur laut Projektstand: türkischer Zweig (Düğün, Kına, Sünnet, Nişan) und deutscher Zweig (Hochzeit, Verlobung, Babyshower, Geburtstag, Firmenevents).

Die Umschaltung zwischen den beiden Zweigen ändert die Akzentfarbe der gesamten Galerie – `--henna` für den türkischen, `--sage` für den deutschen Zweig – über eine 600-ms-Überblendung der CSS-Variablen. Das ist ein Systemwechsel, kein Filter-Klick, und soll sich auch so anfühlen.

Filterwechsel: die ausscheidenden Karten fallen mit 30 ms Stagger heraus (`opacity → 0`, `scale → 0.96`), die neuen kommen mit 40 ms Stagger herein. FLIP-Technik, damit die bleibenden Karten an ihre neue Position gleiten statt zu springen.

---

## 4. Ton

Auf der Startseite läuft nie automatisch Ton. Browser blocken das ohnehin, und Kunden schauen abends neben schlafenden Kindern.

- Hero-Hintergrundvideo, falls verwendet: `muted`, `playsinline`, `loop`.
- Der Tap auf das Siegel ist die gültige User-Geste. Danach – und nur danach – darf Musik starten, und zwar leise eingeblendet über 1200 ms.
- Ton-Schalter dauerhaft sichtbar, unten rechts, Zustand in `localStorage` merken.
- In der Kartenvorschau in der Galerie: immer stumm. Ton erst in der Detailansicht.

---

## 5. Grenzen (verbindlich)

- `prefers-reduced-motion: reduce` → alle Sequenzen entfallen, es bleiben Überblendungen unter 200 ms. Der Umschlag ist dann direkt offen. Die Seite muss in diesem Zustand vollständig funktionieren, nicht nur "auch gehen".
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
2. Von der Hero-Sequenz Screenshots bei 0, 400, 900, 1500 und 3000 ms.
3. Diese Bilder selbst ansehen und gegen diese Datei prüfen.
4. Drei Punkte benennen, an denen es noch nach Standard-Template aussieht, und sie beheben, bevor du meldest, dass es fertig ist.
5. Einen Durchlauf mit `prefers-reduced-motion: reduce` screenshotten.
