import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Ervis Seferi | Finance, Business & Technologie",
    template: "%s | Ervis Seferi",
  },
  description:
    "Comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance. Un regard pratique pour dirigeants, indépendants et petites structures.",
  keywords: [
    "Ervis Seferi",
    "conseil finance",
    "trésorerie",
    "comptabilité",
    "analyse financière",
    "IA finance",
    "automatisation",
    "France",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Ervis Seferi",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
