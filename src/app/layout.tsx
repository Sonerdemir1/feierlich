import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Playfair_Display, Cinzel, Great_Vibes, Poppins, Fraunces, Karla } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

// App-Chrom (Nav, Dashboard, Buttons) — moderne, geometrische Grotesk statt
// der bisherigen Serife, passend zur neuen SaaS-Design-Sprache.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Kuratierte Zusatz-Schriften fuer die Design-Anpassung (Vorlagen-Editor
// ohne Anmeldung) — bewusst eine kleine, kuratierte Auswahl statt eines
// vollen Font-Pickers, damit jede Kombination gut aussieht.
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["500", "700"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "700"] });
const greatVibes = Great_Vibes({ variable: "--font-script", subsets: ["latin"], weight: ["400"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600"] });

// Nur fuer die Startseite/Galerie (siehe docs/MOTION.md) — eigene Variablen
// statt --font-display/--font-body zu ersetzen, die App-weit (Dashboard,
// echte Einladungsseiten) auf der bisherigen warmen Schrift bleiben.
// subsets bewusst inkl. "latin-ext": Fraunces/Karla brauchen das fuer
// vollstaendige tuerkische Zeichen (ğ ş ı İ ç ö ü, siehe MOTION.md §1).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  style: ["normal", "italic"],
});
const karla = Karla({ variable: "--font-karla", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });

const title = "einladi – Digital Event Studio";
const description =
  "Fotos, Videos & Gästebuch digital sammeln — plus digitale Einladungen und Event-Webseiten für Hochzeiten, Geburtstage, Familienfeiern und Business-Events.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title,
  description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "einladi",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "einladi",
    title,
    description,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#211C19",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${jakarta.variable} ${inter.variable} ${playfair.variable} ${cinzel.variable} ${greatVibes.variable} ${poppins.variable} ${fraunces.variable} ${karla.variable}`}
    >
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
