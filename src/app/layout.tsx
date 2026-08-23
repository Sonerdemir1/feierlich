import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Work_Sans, Playfair_Display, Cinzel, Great_Vibes, Poppins } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const workSans = Work_Sans({
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

const title = "einladi – Digital Event Studio";
const description =
  "Digitale Einladungen und komplette Event-Webseiten für Hochzeiten, Geburtstage, Familienfeiern und Business-Events.";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${cormorant.variable} ${workSans.variable} ${playfair.variable} ${cinzel.variable} ${greatVibes.variable} ${poppins.variable}`}
    >
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
