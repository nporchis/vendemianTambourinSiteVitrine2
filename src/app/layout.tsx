// Layout racine (T012) : HTML sémantique, polices auto-hébergées (next/font), lien
// d'évitement clavier, pied de page commun. Chaque page rend son propre <Header> (pour
// signaler la page courante et choisir la variante) suivi de <main id="contenu">.
import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import "@/styles/globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const SITE_NAME = "Vendémian Tambourin";
const DESCRIPTION =
  "Club de tambourin de Vendémian (Hérault) depuis 1923 : le sport, le club, le calendrier des matchs, la galerie photo et les partenaires.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${SITE_NAME} — Club de tambourin depuis 1923`, template: `%s — ${SITE_NAME}` },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    description: DESCRIPTION,
    images: [{ url: "/brand/logo-vendemian-tambourin.png", width: 449, height: 405 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1b18",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#contenu" className="vt-skip-link">
          Aller au contenu
        </a>
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
