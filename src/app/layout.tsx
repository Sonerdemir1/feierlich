import type { Metadata } from "next";
import { Cormorant_Garamond, Work_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Feierlich – Digital Event Studio",
  description:
    "Digitale Einladungen und komplette Event-Webseiten für Hochzeiten, Geburtstage, Familienfeiern und Business-Events.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${cormorant.variable} ${workSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
