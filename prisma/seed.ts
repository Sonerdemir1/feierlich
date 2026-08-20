import { prisma } from '../src/lib/prisma';

// Eventtypen: datengetrieben, damit neue Typen spaeter ueber das
// Admin-Dashboard ergaenzt werden koennen, ohne Code-Aenderung.
const eventTypes = [
  // Hochzeit & Liebe
  { key: 'hochzeit', name: 'Hochzeit', category: 'Hochzeit & Liebe' },
  { key: 'verlobung', name: 'Verlobung', category: 'Hochzeit & Liebe' },
  { key: 'hennaabend', name: 'Hennaabend', category: 'Hochzeit & Liebe' },
  { key: 'jubilaeum', name: 'Jubiläum', category: 'Hochzeit & Liebe' },
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
  { key: 'countdown', name: 'Countdown', category: 'Basis' },
  { key: 'location', name: 'Location & Google Maps', category: 'Basis' },
  { key: 'agenda', name: 'Ablauf', category: 'Basis' },
  { key: 'dresscode', name: 'Dresscode', category: 'Basis' },
  { key: 'social-media', name: 'Social Media', category: 'Basis' },
  { key: 'rsvp', name: 'RSVP', category: 'Gäste' },
  { key: 'guest-list', name: 'Gästeliste', category: 'Gäste' },
  { key: 'seating', name: 'Sitzplan', category: 'Gäste' },
  { key: 'menu', name: 'Digitale Menükarte', category: 'Gäste' },
  { key: 'wishlist', name: 'Wunschliste', category: 'Gäste' },
  { key: 'gallery', name: 'Foto- & Videogalerie', category: 'Gäste' },
  { key: 'guestbook', name: 'Gästebuch', category: 'Gäste' },
  { key: 'music-requests', name: 'Musikwünsche', category: 'Gäste' },
  { key: 'thank-you-card', name: 'Digitale Dankeskarte', category: 'Premium' },
  { key: 'audio-invitation', name: 'Audio-Einladung', category: 'Premium', isPremium: true },
  { key: 'video-invitation', name: 'Video-Einladung', category: 'Premium', isPremium: true },
  { key: 'check-in', name: 'Event Check-in', category: 'Business', isPremium: true },
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
    features: ['countdown', 'location', 'agenda', 'rsvp'],
  },
  {
    key: 'PREMIUM_PLUS', name: 'Premium Plus', priceCents: 14900,
    description: 'Eventseite, RSVP, Gästeliste, Sitzplan, QR-Codes, Gästebuch, Galerie',
    features: ['countdown', 'location', 'agenda', 'rsvp', 'guest-list', 'seating', 'guestbook', 'gallery'],
  },
  {
    key: 'VIP', name: 'VIP', priceCents: 29900,
    description: 'Alle Funktionen, individuelles Design, Video- & Audio-Einladung, persönlicher Support',
    features: [
      'countdown', 'location', 'agenda', 'dresscode', 'social-media', 'rsvp', 'guest-list',
      'seating', 'menu', 'wishlist', 'gallery', 'guestbook', 'music-requests',
      'thank-you-card', 'audio-invitation', 'video-invitation',
    ],
  },
  {
    key: 'BUSINESS', name: 'Business', priceCents: 49900,
    description: 'Individuelle Business-Event-Funktionen inkl. Check-in',
    features: ['countdown', 'location', 'agenda', 'guest-list', 'social-media', 'check-in'],
  },
];

// Templates: die zwoelf im Chat entworfenen "Feierlich"-Designs als
// echte Datensaetze. `layoutKey` referenziert die spaetere React-
// Template-Komponente.
const templates = [
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
];

async function main() {
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
      update: { name: m.name, category: m.category, isPremium: m.isPremium ?? false, sortOrder: i },
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

  for (const [i, t] of templates.entries()) {
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name, category: t.category, layoutKey: t.layoutKey,
        colors: JSON.stringify(t.colors), fonts: JSON.stringify(t.fonts),
        status: 'ACTIVE', sortOrder: i,
      },
      create: {
        slug: t.slug, name: t.name, category: t.category, layoutKey: t.layoutKey,
        colors: JSON.stringify(t.colors), fonts: JSON.stringify(t.fonts),
        status: 'ACTIVE', sortOrder: i,
      },
    });
  }
  console.log(`Templates: ${templates.length} geseedet`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
