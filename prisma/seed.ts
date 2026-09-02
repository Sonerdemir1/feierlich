import { prisma } from '../src/lib/prisma';

// Eventtypen: datengetrieben, damit neue Typen spaeter ueber das
// Admin-Dashboard ergaenzt werden koennen, ohne Code-Aenderung.
const eventTypes = [
  // Hochzeit & Liebe
  { key: 'hochzeit', name: 'Hochzeit', category: 'Hochzeit & Liebe' },
  { key: 'verlobung', name: 'Verlobung', category: 'Hochzeit & Liebe' },
  { key: 'jubilaeum', name: 'Jubiläum', category: 'Hochzeit & Liebe' },
  // Türkische Feste & Bräuche
  { key: 'kiz-isteme', name: 'Kız İsteme', category: 'Türkische Feste & Bräuche' },
  { key: 'nisan-turkisch', name: 'Nişan', category: 'Türkische Feste & Bräuche' },
  { key: 'hennaabend', name: 'Kına Gecesi', category: 'Türkische Feste & Bräuche' },
  { key: 'gelin-alma', name: 'Gelin Alma', category: 'Türkische Feste & Bräuche' },
  { key: 'suennet', name: 'Sünnet', category: 'Türkische Feste & Bräuche' },
  // Geburtstag
  { key: 'geburtstag', name: 'Geburtstag', category: 'Geburtstag' },
  { key: 'geburtstag-18', name: '18. Geburtstag', category: 'Geburtstag' },
  { key: 'geburtstag-30', name: '30. Geburtstag', category: 'Geburtstag' },
  { key: 'geburtstag-40', name: '40. Geburtstag', category: 'Geburtstag' },
  { key: 'geburtstag-50', name: '50. Geburtstag', category: 'Geburtstag' },
  { key: 'geburtstag-60', name: '60. Geburtstag', category: 'Geburtstag' },
  // Familie & Kinder
  { key: 'baby-shower', name: 'Baby Shower', category: 'Familie & Kinder' },
  { key: 'gender-reveal', name: 'Gender Reveal', category: 'Familie & Kinder' },
  { key: 'geburt', name: 'Geburt', category: 'Familie & Kinder' },
  { key: 'taufe', name: 'Taufe', category: 'Familie & Kinder' },
  { key: 'kommunion', name: 'Kommunion', category: 'Familie & Kinder' },
  { key: 'konfirmation', name: 'Konfirmation', category: 'Familie & Kinder' },
  { key: 'einschulung', name: 'Einschulung', category: 'Familie & Kinder' },
  { key: 'abschlussfeier', name: 'Abschlussfeier', category: 'Familie & Kinder' },
  { key: 'familienfeier', name: 'Familienfeier', category: 'Familie & Kinder' },
  // Feiern & Anlaesse
  { key: 'gartenparty', name: 'Gartenparty', category: 'Feiern & Anlässe' },
  { key: 'dinner', name: 'Dinner', category: 'Feiern & Anlässe' },
  { key: 'ueberraschungsparty', name: 'Überraschungsparty', category: 'Feiern & Anlässe' },
  { key: 'weihnachtsfeier', name: 'Weihnachtsfeier', category: 'Feiern & Anlässe' },
  { key: 'silvester', name: 'Silvester', category: 'Feiern & Anlässe' },
  // Business
  { key: 'firmenevent', name: 'Firmenevent', category: 'Business' },
  { key: 'sommerfest', name: 'Sommerfest', category: 'Business' },
  { key: 'weihnachtsfeier-unternehmen', name: 'Weihnachtsfeier (Unternehmen)', category: 'Business' },
  { key: 'neueroeffnung', name: 'Neueröffnung', category: 'Business' },
  { key: 'produktpraesentation', name: 'Produktpräsentation', category: 'Business' },
  { key: 'messe', name: 'Messe', category: 'Business' },
  { key: 'networking-event', name: 'Networking Event', category: 'Business' },
  { key: 'gala', name: 'Gala', category: 'Business' },
  { key: 'vip-event', name: 'VIP Event', category: 'Business' },
];

// Modul-Katalog: neue Module-TYPEN brauchen weiterhin eine UI-Komponente
// im Code, aber welche Module ein Event nutzt ist vollstaendig
// datengetrieben (siehe EventModule).
const modules = [
  { key: 'countdown', name: 'Countdown', category: 'Basis', description: 'Countdown-Timer bis zum Event auf der Einladungsseite.' },
  { key: 'location', name: 'Location & Google Maps', category: 'Basis', description: 'Adresse mit Karte und Wegbeschreibung für die Gäste.' },
  { key: 'weather', name: 'Wettervorhersage', category: 'Basis', description: 'Zeigt die Wettervorhersage für den Eventtag, sobald sie verfügbar ist (ca. 14 Tage vorher) — braucht eine hinterlegte Location.' },
  { key: 'agenda', name: 'Ablauf', category: 'Basis', description: 'Zeitlicher Ablaufplan des Events (z. B. Sektempfang, Trauung, Feier).' },
  { key: 'dresscode', name: 'Dresscode', category: 'Basis', description: 'Hinweis zum gewünschten Dresscode für die Gäste.' },
  { key: 'social-media', name: 'Social Media', category: 'Basis', description: 'Hashtag-/Social-Media-Hinweis für Gäste-Posts.' },
  { key: 'background-music', name: 'Hintergrundmusik', category: 'Basis', description: 'Ein hochgeladener Musiktitel, den Gäste auf der Einladungsseite per Schalter abspielen können (kein Autoplay).' },
  { key: 'rsvp', name: 'RSVP', category: 'Gäste', description: 'Gäste sagen online direkt zu oder ab — inklusive Personenanzahl und Nachricht an euch. Antworten seht ihr gesammelt in der Gästeliste.' },
  { key: 'guest-list', name: 'Gästeliste', category: 'Gäste', description: 'Übersicht aller eingeladenen Gäste und ihres Zusage-Status.' },
  { key: 'seating', name: 'Sitzplan', category: 'Gäste', description: 'Tische anlegen und Gäste zuordnen — inklusive Sitzplatz-Suche für Gäste.' },
  { key: 'menu', name: 'Digitale Menükarte', category: 'Gäste', description: 'Menüauswahl, die Gäste direkt bei der Zusage mit angeben.' },
  { key: 'wishlist', name: 'Wunschliste', category: 'Gäste', description: 'Geschenkewunschliste für die Gäste.' },
  { key: 'gallery', name: 'Foto- & Videogalerie', category: 'Gäste', description: 'Gäste laden eigene Fotos/Videos hoch, die in einer gemeinsamen Galerie erscheinen.' },
  { key: 'guestbook', name: 'Gästebuch', category: 'Gäste', description: 'Gäste hinterlassen Text- oder Videonachrichten für euch.' },
  { key: 'music-requests', name: 'Musikwünsche', category: 'Gäste', description: 'Gäste können Musikwünsche für die Feier einreichen.' },
  { key: 'thank-you-card', name: 'Digitale Dankeskarte', category: 'Premium', description: 'Digitale Dankeskarte, die ihr nach dem Event an eure Gäste verschicken könnt.' },
  { key: 'audio-invitation', name: 'Audio-Einladung', category: 'Premium', isPremium: true, description: 'Sprachnachricht als persönliche Einladung.' },
  { key: 'video-invitation', name: 'Video-Einladung', category: 'Premium', isPremium: true, description: 'Videobotschaft als persönliche Einladung.' },
  { key: 'check-in', name: 'Event Check-in', category: 'Business', isPremium: true, description: 'Gäste beim Eintreffen per QR-Code einchecken.' },
];

// Preis-Pakete: Startwerte, spaeter ueber das Admin-Dashboard aenderbar
// (nicht im Anwendungscode verdrahtet).
const packages = [
  {
    key: 'BASIC', name: 'Basic', priceCents: 4900,
    description: 'Digitale Einladung',
    features: ['countdown'],
  },
  {
    key: 'PREMIUM', name: 'Premium', priceCents: 9900,
    description: 'Digitale Einladung, Eventseite, RSVP, QR-Code',
    features: ['countdown', 'location', 'weather', 'agenda', 'rsvp'],
  },
  {
    key: 'PREMIUM_PLUS', name: 'Premium Plus', priceCents: 14900,
    description: 'Eventseite, RSVP, Gästeliste, Sitzplan, QR-Codes, Gästebuch, Galerie',
    features: ['countdown', 'location', 'weather', 'agenda', 'rsvp', 'guest-list', 'seating', 'guestbook', 'gallery'],
  },
  {
    key: 'VIP', name: 'VIP', priceCents: 29900,
    description: 'Alle Funktionen, individuelles Design, Video- & Audio-Einladung, persönlicher Support',
    features: [
      'countdown', 'location', 'weather', 'agenda', 'dresscode', 'social-media', 'rsvp', 'guest-list',
      'seating', 'menu', 'wishlist', 'gallery', 'guestbook', 'music-requests',
      'thank-you-card', 'audio-invitation', 'video-invitation',
    ],
  },
  {
    key: 'BUSINESS', name: 'Business', priceCents: 49900,
    description: 'Individuelle Business-Event-Funktionen inkl. Check-in',
    features: ['countdown', 'location', 'weather', 'agenda', 'guest-list', 'social-media', 'check-in'],
  },
];

// Eigenstaendig kaufbare Zusatzprodukte, unabhaengig vom Einladungs-Package
// (siehe EventAddOn in schema.prisma). Preis an vier deutschen Wettbewerbern
// (WeddySnap, qrFotos, FridaySnap, MyMillionSnaps — alle 20-50€ Einmal-
// zahlung fuer unbegrenzte Foto/Video-Sammlung) orientiert; leicht darueber,
// weil wir zusaetzlich manuelles Personen-Tagging bieten, das keiner davon
// hat.
const addOns = [
  {
    key: 'photo-video-collection', name: 'Foto & Video Sammlung', priceCents: 4900,
    description: 'Unbegrenzte Foto- & Video-Uploads von Gästen, inkl. Personen-Tagging — unabhängig vom gewählten Einladungs-Paket dazubuchbar.',
    moduleKeys: ['gallery'],
  },
  // PLATZHALTER-Preis, anders als beim Foto/Video-Add-on NICHT aus
  // Wettbewerber-Recherche abgeleitet (kein direktes Pendant gefunden),
  // sondern grob auf Basis geschaetzter OpenAI-Kosten (GPT Image 2,
  // ca. $0.05-0.25/Generierung je nach Qualitaet) fuer 10 Versuche plus
  // Marge kalkuliert. Vor dem Live-Gang mit echten Nutzungsdaten pruefen.
  {
    key: 'ai-design', name: 'KI-Design', priceCents: 1490,
    description: 'Titelbild per KI-Prompt anpassen (z.B. Hintergrund, Lichtstimmung) — 10 Versuche inklusive.',
    moduleKeys: [],
  },
];

// Templates: die zwoelf im Chat entworfenen "einladi"-Designs als
// echte Datensaetze. `layoutKey` referenziert die spaetere React-
// Template-Komponente.
const templates: Array<{
  slug: string;
  name: string;
  category: string;
  layoutKey: string;
  colors: { primary: string; accent: string; background: string };
  fonts: { display: string; body: string };
  envelopeSequenceUrls?: string[];
  // Vollflaechiges Karten-Design (echtes Foto/Kartenmotiv statt CSS-
  // Nachbau) — wenn gesetzt, zeigen Vorschau-Kachel UND echte Event-Seite
  // (/e/[slug]) das Bild als Rahmen mit Text in der freien Mitte, statt
  // der generischen Farbflaeche.
  previewUrl?: string;
}> = [
  // Türkische Vorlagen stehen bewusst zuerst: Hauptzielgruppe ist Werbung
  // in tuerkischen Hochzeitssaelen. Nach Anlass unterkategorisiert (Düğün,
  // Kına Gecesi, Nişan, Sünnet), jeweils eine opulente ("kitschig", dicht
  // ornamentiert) und eine zurueckhaltendere ("elegant") Variante — beides
  // muss zur Wahl stehen, nicht nur eine Richtung. Keine religiösen
  // Symbole; Muenzen/Granatapfel/Ornamentik/Kronen als saekulare,
  // dekorative Motive.
  // Echte Karten-Designs (kein CSS-Nachbau) — 15 fertige "Blanko"-
  // Einladungskarten (Kunde hat die Bilddateien bereitgestellt), decken die
  // Bandbreite von opulent-gold bis zart-Aquarell ab. Ersetzen die
  // vorherigen 4 CSS-Naeherungen (Altın Sedef, Safir Davet, Ottoman Line,
  // Zümrüt) als "das sieht nach nichts aus"-Platzhalter.
  { slug: 'dugun-01', name: 'Fildişi Saray', category: 'Düğün', layoutKey: 'dugun-01',
    colors: { primary: '#3A2E22', accent: '#C9A227', background: '#FAF3E4' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-01.jpg' },
  { slug: 'dugun-02', name: 'Altın Kemer', category: 'Düğün', layoutKey: 'dugun-02',
    colors: { primary: '#3A2E22', accent: '#C9A227', background: '#FBF4E8' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-02.jpg' },
  { slug: 'dugun-04', name: 'Yeşil Taç', category: 'Düğün', layoutKey: 'dugun-04',
    colors: { primary: '#FAF3E0', accent: '#D4AF6A', background: '#0B2A1E' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-04.jpg' },
  { slug: 'dugun-05', name: 'Bordo Çerçeve', category: 'Düğün', layoutKey: 'dugun-05',
    colors: { primary: '#5C1420', accent: '#C08A2E', background: '#F6ECD9' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-05.jpg' },
  { slug: 'dugun-06', name: 'Lacivert Kemer', category: 'Düğün', layoutKey: 'dugun-06',
    colors: { primary: '#16213E', accent: '#C9A24A', background: '#F5EDDC' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-06.jpg' },
  { slug: 'dugun-07', name: 'Gül Kemeri', category: 'Düğün', layoutKey: 'dugun-07',
    colors: { primary: '#3A2E22', accent: '#C9A227', background: '#FBF3E6' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-07.jpg' },
  { slug: 'dugun-08', name: 'Zümrüt Gül', category: 'Düğün', layoutKey: 'dugun-08',
    colors: { primary: '#FAF3E0', accent: '#D4AF6A', background: '#0B2A1E' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-08.jpg' },
  { slug: 'dugun-09', name: 'Lacivert Nakış', category: 'Düğün', layoutKey: 'dugun-09',
    colors: { primary: '#FAF3E0', accent: '#CBA135', background: '#101B36' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-09.jpg' },
  { slug: 'dugun-11', name: 'Altın Yaprak', category: 'Düğün', layoutKey: 'dugun-11',
    colors: { primary: '#3A2E22', accent: '#C9A227', background: '#FBF4E6' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-11.jpg' },
  { slug: 'dugun-12', name: 'İnce Altın', category: 'Düğün', layoutKey: 'dugun-12',
    colors: { primary: '#3A2E22', accent: '#BFA045', background: '#FCF6EC' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-12.jpg' },
  { slug: 'dugun-14', name: 'Mavi Bahar', category: 'Düğün', layoutKey: 'dugun-14',
    colors: { primary: '#3A362E', accent: '#7C8F86', background: '#FAF4E9' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-14.jpg' },
  { slug: 'dugun-15', name: 'Pembe Bahar', category: 'Düğün', layoutKey: 'dugun-15',
    colors: { primary: '#3A2E2E', accent: '#C98E92', background: '#FBF3EC' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    previewUrl: '/images/templates/dugun-blanko/dugun-15.jpg' },
  // Erstes Template mit der EnvelopeReveal-Umschlag-Animation (siehe
  // src/components/marketing/EnvelopeReveal.tsx) — live sowohl in der
  // Galerie/Vorlagenauswahl (TemplatePreview.tsx) als auch auf der
  // echten Event-Seite (/e/[slug]).
  { slug: 'hochzeit-elegant-gold', name: 'Hochzeit Elegant Gold', category: 'Düğün', layoutKey: 'hochzeit-elegant-gold',
    colors: { primary: '#211C19', accent: '#B9975B', background: '#FAF6EF' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' },
    envelopeSequenceUrls: [
      '/images/templates/hochzeit-elegant-gold/01-envelope-closed.png',
      '/images/templates/hochzeit-elegant-gold/02-seal-opened.png',
      '/images/templates/hochzeit-elegant-gold/03-envelope-open.png',
      '/images/templates/hochzeit-elegant-gold/04-card-emerging.png',
      '/images/templates/hochzeit-elegant-gold/05-card-revealed.png',
    ] },
  { slug: 'kina-kirmizi', name: 'Kına Kırmızı', category: 'Kına Gecesi', layoutKey: 'kina-kirmizi',
    colors: { primary: '#FAF6EF', accent: '#D4AF37', background: '#7A1428' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'oya-lace', name: 'Oya Lace', category: 'Kına Gecesi', layoutKey: 'oya-lace',
    colors: { primary: '#7A2E3A', accent: '#B2543A', background: '#FAF6EF' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'nar-cicegi', name: 'Nar Çiçeği', category: 'Kına Gecesi', layoutKey: 'nar-cicegi',
    colors: { primary: '#7A2E3A', accent: '#C9605C', background: '#F7E3D9' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'kraliyet-moru', name: 'Kraliyet Moru', category: 'Nişan', layoutKey: 'kraliyet-moru',
    colors: { primary: '#F4EEE4', accent: '#D4AF37', background: '#2E1A47' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'soz-guemuesue', name: 'Söz Gümüşü', category: 'Nişan', layoutKey: 'soz-guemuesue',
    colors: { primary: '#5C1A2E', accent: '#D4A574', background: '#FBEAEE' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'gul-bahcesi', name: 'Gül Bahçesi', category: 'Nişan', layoutKey: 'gul-bahcesi',
    colors: { primary: '#6B2737', accent: '#E8A6B0', background: '#FBEFEA' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'sehzade-mavisi', name: 'Şehzade Mavisi', category: 'Sünnet', layoutKey: 'sehzade-mavisi',
    colors: { primary: '#FAF6EF', accent: '#D4AF37', background: '#0E2F5A' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'masmavi', name: 'Masmavi', category: 'Sünnet', layoutKey: 'masmavi',
    colors: { primary: '#1B3A5C', accent: '#8FA8C9', background: '#EAF1F8' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'minimal-ivory', name: 'Minimal Ivory', category: 'Zeitlos', layoutKey: 'minimal-ivory',
    colors: { primary: '#211C19', accent: '#B2543A', background: '#FAF6EF' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'mono-editorial', name: 'Mono Editorial', category: 'Zeitlos', layoutKey: 'mono-editorial',
    colors: { primary: '#211C19', accent: '#B2543A', background: '#FAF6EF' },
    fonts: { display: 'Work Sans', body: 'Work Sans' } },
  { slug: 'letterpress', name: 'Letterpress', category: 'Zeitlos', layoutKey: 'letterpress',
    colors: { primary: '#211C19', accent: '#211C19', background: '#FAF6EF' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'botanico', name: 'Botanico', category: 'Botanisch', layoutKey: 'botanico',
    colors: { primary: '#8F4029', accent: '#8F9B6E', background: '#F3ECDF' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'terracotta-bloom', name: 'Terracotta Bloom', category: 'Botanisch', layoutKey: 'terracotta-bloom',
    colors: { primary: '#FAF6EF', accent: '#F0D9CC', background: '#B2543A' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'olivenzweig', name: 'Olivenzweig', category: 'Botanisch', layoutKey: 'olivenzweig',
    colors: { primary: '#4E5A38', accent: '#7C8560', background: '#EDEFE1' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'roman-script', name: 'Roman Script', category: 'Romantisch', layoutKey: 'roman-script',
    colors: { primary: '#6B2F1A', accent: '#B2543A', background: '#F0D9CC' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'rosenquarz', name: 'Rosenquarz', category: 'Romantisch', layoutKey: 'rosenquarz',
    colors: { primary: '#8B4A45', accent: '#C98E88', background: '#F5E1DE' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'liebesbrief', name: 'Liebesbrief', category: 'Romantisch', layoutKey: 'liebesbrief',
    colors: { primary: '#6B4A32', accent: '#B2543A', background: '#F3ECDF' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'gold-line', name: 'Gold Line', category: 'Statement', layoutKey: 'gold-line',
    colors: { primary: '#FAF6EF', accent: '#B9975B', background: '#211C19' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'onyx', name: 'Onyx', category: 'Statement', layoutKey: 'onyx',
    colors: { primary: '#F4EEE4', accent: '#B9975B', background: '#16130F' },
    fonts: { display: 'Work Sans', body: 'Work Sans' } },
  { slug: 'kupferglanz', name: 'Kupferglanz', category: 'Statement', layoutKey: 'kupferglanz',
    colors: { primary: '#FAF6EF', accent: '#F0D9CC', background: '#A6512E' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  // Zwei weitere pro bestehender Stilrichtung
  { slug: 'papier-weiss', name: 'Papier Weiß', category: 'Zeitlos', layoutKey: 'papier-weiss',
    colors: { primary: '#211C19', accent: '#7C7267', background: '#FFFFFF' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'sandstein', name: 'Sandstein', category: 'Zeitlos', layoutKey: 'sandstein',
    colors: { primary: '#3A332C', accent: '#A6875B', background: '#EFE7D8' },
    fonts: { display: 'Work Sans', body: 'Work Sans' } },
  { slug: 'eukalyptus', name: 'Eukalyptus', category: 'Botanisch', layoutKey: 'eukalyptus',
    colors: { primary: '#2F4739', accent: '#6B8F71', background: '#EEF2E9' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'wildblume', name: 'Wildblume', category: 'Botanisch', layoutKey: 'wildblume',
    colors: { primary: '#5C3A21', accent: '#C97B4A', background: '#FBF1E4' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'pfingstrose', name: 'Pfingstrose', category: 'Romantisch', layoutKey: 'pfingstrose',
    colors: { primary: '#7A3B4A', accent: '#E4A0AE', background: '#FBEEF1' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'champagner', name: 'Champagner', category: 'Romantisch', layoutKey: 'champagner',
    colors: { primary: '#6B5842', accent: '#D9C8A8', background: '#FAF3E6' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'mitternacht', name: 'Mitternacht', category: 'Statement', layoutKey: 'mitternacht',
    colors: { primary: '#EDEFF5', accent: '#7C93C4', background: '#10131F' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'bordeaux', name: 'Bordeaux', category: 'Statement', layoutKey: 'bordeaux',
    colors: { primary: '#F4E9E6', accent: '#C9605C', background: '#2B1014' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  // Neue Stilrichtung: verspielt-bunt, fuer Kindergeburtstage, Baby Shower,
  // Gender Reveal, Einschulung.
  { slug: 'konfetti', name: 'Konfetti', category: 'Verspielt', layoutKey: 'konfetti',
    colors: { primary: '#3A2E4A', accent: '#F2A65A', background: '#FFF4E3' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'zuckerwatte', name: 'Zuckerwatte', category: 'Verspielt', layoutKey: 'zuckerwatte',
    colors: { primary: '#4A3350', accent: '#F2A6C9', background: '#FBEFF6' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  { slug: 'pastellwiese', name: 'Pastellwiese', category: 'Verspielt', layoutKey: 'pastellwiese',
    colors: { primary: '#33424A', accent: '#6FB98F', background: '#EAF6EE' },
    fonts: { display: 'Cormorant Garamond', body: 'Work Sans' } },
  // Neue Stilrichtung: klar-professionell, fuer Business-Events (bewusst
  // heller/zurueckhaltender als "Statement", das dunkel-luxurioes bleibt).
  { slug: 'klarblau', name: 'Klarblau', category: 'Business Modern', layoutKey: 'klarblau',
    colors: { primary: '#16233B', accent: '#2F6FED', background: '#F4F7FC' },
    fonts: { display: 'Work Sans', body: 'Work Sans' } },
  { slug: 'graphit', name: 'Graphit', category: 'Business Modern', layoutKey: 'graphit',
    colors: { primary: '#FFFFFF', accent: '#9AA5B1', background: '#1E2328' },
    fonts: { display: 'Work Sans', body: 'Work Sans' } },
  { slug: 'minz-corporate', name: 'Minz Corporate', category: 'Business Modern', layoutKey: 'minz-corporate',
    colors: { primary: '#1D2B28', accent: '#2E9E7B', background: '#F0F7F4' },
    fonts: { display: 'Work Sans', body: 'Work Sans' } },
];

async function main() {
  // Admin-Zugang: diese E-Mail bekommt beim ersten Login automatisch die
  // Admin-Rolle statt der normalen Kunden-Rolle.
  await prisma.user.upsert({
    where: { email: 'info@sonerdemir.de' },
    update: { role: 'ADMIN' },
    create: { email: 'info@sonerdemir.de', role: 'ADMIN' },
  });
  console.log('Admin-Nutzer: info@sonerdemir.de');

  for (const [i, et] of eventTypes.entries()) {
    await prisma.eventType.upsert({
      where: { key: et.key },
      update: { name: et.name, category: et.category, sortOrder: i },
      create: { ...et, sortOrder: i },
    });
  }
  console.log(`EventTypes: ${eventTypes.length} geseedet`);

  for (const [i, m] of modules.entries()) {
    await prisma.module.upsert({
      where: { key: m.key },
      update: { name: m.name, category: m.category, description: m.description, isPremium: m.isPremium ?? false, sortOrder: i },
      create: { ...m, isPremium: m.isPremium ?? false, sortOrder: i },
    });
  }
  console.log(`Module: ${modules.length} geseedet`);

  for (const [i, p] of packages.entries()) {
    await prisma.package.upsert({
      where: { key: p.key },
      update: {
        name: p.name, description: p.description, priceCents: p.priceCents,
        features: JSON.stringify(p.features), sortOrder: i,
      },
      create: {
        key: p.key, name: p.name, description: p.description, priceCents: p.priceCents,
        features: JSON.stringify(p.features), sortOrder: i,
      },
    });
  }
  console.log(`Pakete: ${packages.length} geseedet`);

  for (const [i, a] of addOns.entries()) {
    await prisma.addOn.upsert({
      where: { key: a.key },
      update: {
        name: a.name, description: a.description, priceCents: a.priceCents,
        moduleKeys: JSON.stringify(a.moduleKeys), sortOrder: i,
      },
      create: {
        key: a.key, name: a.name, description: a.description, priceCents: a.priceCents,
        moduleKeys: JSON.stringify(a.moduleKeys), sortOrder: i,
      },
    });
  }
  console.log(`Add-ons: ${addOns.length} geseedet`);

  for (const [i, t] of templates.entries()) {
    const envelopeSequenceUrls = t.envelopeSequenceUrls ? JSON.stringify(t.envelopeSequenceUrls) : undefined;
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name, category: t.category, layoutKey: t.layoutKey,
        colors: JSON.stringify(t.colors), fonts: JSON.stringify(t.fonts),
        envelopeSequenceUrls, previewUrl: t.previewUrl,
        status: 'ACTIVE', sortOrder: i,
      },
      create: {
        slug: t.slug, name: t.name, category: t.category, layoutKey: t.layoutKey,
        colors: JSON.stringify(t.colors), fonts: JSON.stringify(t.fonts),
        envelopeSequenceUrls, previewUrl: t.previewUrl,
        status: 'ACTIVE', sortOrder: i,
      },
    });
  }
  console.log(`Templates: ${templates.length} geseedet`);

  // Durch echte Kartendesigns ersetzte CSS-Naeherungen — nicht loeschen
  // (Fremdschluessel von bereits gewaehlten Events), nur aus der aktiven
  // Auswahl nehmen. dugun-03/16/17 waren zu aehnlich zu dugun-02/15 (Kunden-
  // Feedback) und wurden ebenfalls zurueckgezogen.
  const retiredSlugs = ['altin-sedef', 'safir-davet', 'ottoman-line', 'zuemruet', 'dugun-03', 'dugun-16', 'dugun-17'];
  const { count: retiredCount } = await prisma.template.updateMany({
    where: { slug: { in: retiredSlugs } },
    data: { status: 'ARCHIVED' },
  });
  if (retiredCount > 0) console.log(`Templates archiviert (durch echte Kartendesigns ersetzt): ${retiredCount}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
