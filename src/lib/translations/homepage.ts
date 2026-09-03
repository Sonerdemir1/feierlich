import type { Locale } from "@/lib/i18n";

// Nur statische Marketing-Texte der Homepage — Datenbank-Inhalte
// (Vorlagen-/Paket-/Modul-Namen) bleiben bewusst Deutsch (siehe Plan).
// Tuerkische Texte sind frei/natuerlich formuliert, keine Wort-fuer-Wort-
// Uebersetzung, passend zum bestehenden warmen/opulenten Marken-Ton.
export const homepageCopy = {
  de: {
    nav: { gallery: "Fotos & Gästebuch", templates: "Vorlagen", pricing: "Preise", login: "Anmelden", cta: "Fotos & Videos sammeln" },
    hero: {
      eyebrow: "Fotos, Videos & Gästebuch — digital gesammelt",
      title: "Eure Erinnerungen. Nicht verstreut auf fremden Handys.",
      sub: "Jedes Gästefoto, jedes Video, jede Nachricht landet an einem Ort — sofort sichtbar, für immer gesichert. Dazu, wenn ihr wollt: eine passende digitale Einladung im selben Design.",
      ctaPrimary: "Fotos & Videos sammeln",
      ctaSecondary: "Auch Einladung gestalten",
      chipBilingual: "🇩🇪 Deutsch & 🇹🇷 Türkçe",
      chipAi: "✨ KI-Textvorschläge",
    },
    catNav: { heading: "Wählt euren Anlass" },
    stats: [
      { label: "Designs zur Auswahl" },
      { num: "0€", label: "Zum Ausprobieren, ohne Konto" },
      { num: "5 Min.", label: "Bis eure Seite live ist" },
      { num: "1", label: "Link für Einladung, QR-Code & Tischkarte" },
    ],
    how: {
      eyebrow: "Drei Schritte",
      heading: "So funktioniert's",
      steps: [
        { title: "Eventtyp & Vorlage wählen", desc: "Ob Hochzeit, Geburtstag oder Firmenevent – passende Designs in mehreren Stimmungen." },
        { title: "Personalisieren", desc: "Daten, Farben, Module an- oder ausschalten: alles mit Live-Vorschau, in wenigen Minuten fertig." },
        { title: "Veröffentlichen & teilen", desc: "Ein Link für eure Gäste, ein passender QR-Code für den Tisch – im selben Design." },
      ],
    },
    erinnerungen: {
      eyebrow: "Fotos, Videos & Gästebuch",
      heading: "Alles, was eure Gäste festhalten — an einem Ort",
      desc: "Gästefotos laufen automatisch in einer gemeinsamen Wand zusammen, dazu ein Video-Gästebuch für persönliche Botschaften. Ihr entscheidet vor der Veröffentlichung, was sichtbar wird.",
      points: [
        "Foto- & Videowand ohne App-Zwang, direkt über den Browser",
        "Video-Gästebuch, bis 60 Sekunden",
        "Eigener QR-Code je Tisch — Uploads direkt vom Platz",
        "Personen-Tagging, damit jeder seine eigenen Fotos wiederfindet",
      ],
    },
    vorlagen: { heading: "Für jede Stimmung die richtige", desc: "Bewusst kuratiert statt endlos – in Kategorien, damit ihr schnell findet, was zu euch passt." },
    editor: {
      eyebrow: "Editor",
      heading: "Gestalten in Echtzeit",
      desc: "Daten, Farbe, Schrift, Foto – alles mit sofortiger Vorschau. Probiert die Akzentfarbe links direkt aus.",
      points: ["Live-Vorschau reagiert direkt auf Eingaben", "Module pro Event einzeln an- oder ausschalten", "Passend für jeden Eventtyp, nicht nur Hochzeiten"],
    },
    eventpage: {
      eyebrow: "Event-Webseite",
      heading: "Eine eigene Seite für euer Event",
      desc: "Aus der Einladung wird eine eigene Event-Webseite: Countdown, Anfahrt, Ablauf und Zusage in einem Fluss.",
      points: ["Anfahrt inklusive Kartenvorschau", "Zeitstrahl mit allen Programmpunkten", "RSVP direkt mit Menüwahl"],
    },
    share: {
      eyebrow: "Teilen & Drucken",
      heading: "Vom Scan zum Tisch",
      desc: "Der Link teilt sich wie gewohnt – die Tischkarte ist der eigentliche Clou: automatisch im gewählten Design erzeugt, druckfertig, mit eigenem QR-Code je Tisch.",
      points: ["Teilen per WhatsApp oder Link", "Tischkarte im selben Design wie die Einladung"],
    },
    pricing: {
      eyebrow: "Preise",
      heading: "Nur Erinnerungen sammeln — oder die ganze Einladung",
      addOnBadge: "EIGENSTÄNDIG BUCHBAR",
      addOnTag: "Ganz ohne Einladung buchbar — nur Fotos, Videos & Gästebuch",
      addOnFeatures: ["Unbegrenzte Foto- & Video-Uploads", "Video-Gästebuch inklusive", "Personen-Tagging", "Unabhängig vom gewählten Paket, auch ohne Einladung"],
      eyebrow2: "Oder: die ganze Einladung",
      heading2: "Für jeden Anlass die passende Stufe",
      popularBadge: "BELIEBTESTE WAHL",
    },
    // Nur belegbare Fakten — bewusst keine erfundenen Nutzerzahlen/
    // Bewertungen (siehe Kommentar bei .hero-chip), passend zur restlichen
    // ehrlichen Datengrundlage der Seite.
    trust: {
      items: [
        { icon: "shield", label: "Sichere Zahlung", desc: "Verschlüsselt über Stripe." },
        { icon: "eu", label: "DSGVO-konform", desc: "Eure Daten liegen auf Servern in der EU." },
        { icon: "receipt", label: "Kein Abo", desc: "Einmalzahlung pro Paket, keine versteckten Kosten." },
        { icon: "mail", label: "Persönlicher Support", desc: "Fragen gehen direkt an uns — keine Warteschleife." },
      ],
    },
    footer: {
      tagline:
        "Fotos, Videos & Gästebuch digital sammeln — plus digitale Einladungen und Event-Webseiten für Hochzeiten, Geburtstage, Familienfeiern und Business-Events.",
    },
  },
  tr: {
    nav: { gallery: "Fotoğraf & Anı Defteri", templates: "Şablonlar", pricing: "Fiyatlar", login: "Giriş Yap", cta: "Fotoğraf & Video Toplayın" },
    hero: {
      eyebrow: "Fotoğraflar, Videolar & Anı Defteri — dijital olarak bir arada",
      title: "Anılarınız. Başkalarının telefonlarında kaybolmadan.",
      sub: "Her misafir fotoğrafı, her video, her mesaj tek bir yerde toplanır — anında görünür, sonsuza dek güvende. İsterseniz aynı tasarımda dijital bir davetiye de ekleyin.",
      ctaPrimary: "Fotoğraf & Video Toplayın",
      ctaSecondary: "Davetiye de Tasarlayın",
      chipBilingual: "🇩🇪 Almanca & 🇹🇷 Türkçe",
      chipAi: "✨ Yapay zekâ öneri metni",
    },
    catNav: { heading: "Etkinlik türünüzü seçin" },
    stats: [
      { label: "Seçebileceğiniz Tasarım" },
      { num: "0€", label: "Üyeliksiz, ücretsiz denemek için" },
      { num: "5 Dk.", label: "Sayfanız yayında olana kadar" },
      { num: "1", label: "Davetiye, QR kod & masa kartı için tek link" },
    ],
    how: {
      eyebrow: "Üç Adım",
      heading: "Nasıl Çalışır?",
      steps: [
        { title: "Etkinlik türü & şablon seçin", desc: "İster düğün, ister doğum günü, ister kurumsal etkinlik — farklı ruh hallerine uygun tasarımlar." },
        { title: "Kişiselleştirin", desc: "Bilgiler, renkler, modülleri açıp kapatma: her şey anlık önizlemeyle, birkaç dakikada hazır." },
        { title: "Yayınlayın & paylaşın", desc: "Misafirleriniz için bir link, masaya uygun bir QR kod — aynı tasarımda." },
      ],
    },
    erinnerungen: {
      eyebrow: "Fotoğraflar, Videolar & Anı Defteri",
      heading: "Misafirlerinizin yakaladığı her an — tek bir yerde",
      desc: "Misafir fotoğrafları otomatik olarak ortak bir duvarda birleşir, üstüne kişisel mesajlar için bir video anı defteri eklenir. Yayınlamadan önce nelerin görüneceğine siz karar verirsiniz.",
      points: [
        "Uygulama zorunluluğu olmadan, doğrudan tarayıcıdan fotoğraf & video duvarı",
        "60 saniyeye kadar video anı defteri",
        "Her masaya özel QR kod — yerinden anında yükleme",
        "Kişi etiketleme, herkes kendi fotoğraflarını kolayca bulsun",
      ],
    },
    vorlagen: { heading: "Her ruh haline uygun bir tasarım", desc: "Sonsuz seçenek yerine özenle seçilmiş — kategoriler halinde, size uygun olanı hızlıca bulun." },
    editor: {
      eyebrow: "Editör",
      heading: "Gerçek zamanlı tasarım",
      desc: "Bilgiler, renk, yazı tipi, fotoğraf — hepsi anlık önizlemeyle. Soldaki vurgu rengini hemen deneyin.",
      points: ["Anlık önizleme girdilerinize hemen tepki verir", "Modülleri her etkinlik için ayrı ayrı açıp kapatın", "Sadece düğünler için değil, her etkinlik türüne uygun"],
    },
    eventpage: {
      eyebrow: "Etkinlik Web Sayfası",
      heading: "Etkinliğiniz için kendi sayfanız",
      desc: "Davetiyeniz kendi etkinlik web sayfanıza dönüşür: geri sayım, yol tarifi, program akışı ve katılım onayı tek bir akışta.",
      points: ["Harita önizlemesiyle birlikte yol tarifi", "Tüm program noktalarıyla zaman çizelgesi", "Menü seçimiyle birlikte doğrudan katılım onayı"],
    },
    share: {
      eyebrow: "Paylaşın & Yazdırın",
      heading: "Taramadan masaya",
      desc: "Link her zamanki gibi paylaşılır — asıl fark masa kartında: seçtiğiniz tasarımda otomatik oluşturulur, baskıya hazır, her masaya özel QR koduyla.",
      points: ["WhatsApp veya link ile paylaşın", "Davetiyeyle aynı tasarımda masa kartı"],
    },
    pricing: {
      eyebrow: "Fiyatlar",
      heading: "Sadece anıları toplayın — ya da tüm davetiyeyi",
      addOnBadge: "TEK BAŞINA SATIN ALINABİLİR",
      addOnTag: "Davetiye olmadan da satın alınabilir — sadece fotoğraf, video & anı defteri",
      addOnFeatures: ["Sınırsız fotoğraf & video yükleme", "Video anı defteri dahil", "Kişi etiketleme", "Seçtiğiniz paketten bağımsız, davetiyesiz de"],
      eyebrow2: "Ya da: tüm davetiye",
      heading2: "Her etkinlik için doğru seviye",
      popularBadge: "EN ÇOK TERCİH EDİLEN",
    },
    trust: {
      items: [
        { icon: "shield", label: "Güvenli Ödeme", desc: "Stripe üzerinden şifreli." },
        { icon: "eu", label: "GDPR Uyumlu", desc: "Verileriniz AB sunucularında saklanır." },
        { icon: "receipt", label: "Abonelik Yok", desc: "Pakete göre tek seferlik ödeme, gizli ücret yok." },
        { icon: "mail", label: "Kişisel Destek", desc: "Sorularınız doğrudan bize ulaşır — bekleme yok." },
      ],
    },
    footer: {
      tagline:
        "Fotoğraf, video & anı defterini dijital olarak toplayın — düğünler, doğum günleri, aile kutlamaları ve kurumsal etkinlikler için dijital davetiyeler ve etkinlik web siteleriyle birlikte.",
    },
  },
} satisfies Record<Locale, unknown>;

export type HomepageCopy = (typeof homepageCopy)["de"];
