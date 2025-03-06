import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rando Explorer | Trouvez votre prochaine aventure",
  description: "Découvrez les plus belles randonnées adaptées à vos envies grâce à notre recherche intelligente",
  keywords: "randonnée, hiking, Cévennes, nature, outdoor, montagne, sentiers",
  authors: [{ name: "Rando Explorer Team" }],
  openGraph: {
    title: "Rando Explorer | Trouvez votre prochaine aventure",
    description: "Découvrez les plus belles randonnées adaptées à vos envies grâce à notre recherche intelligente",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 100% 0%, rgba(74, 222, 128, 0.08) 0%, transparent 25%),
            radial-gradient(circle at 0% 80%, rgba(74, 222, 128, 0.05) 0%, transparent 25%),
            linear-gradient(to bottom, #f8fafc, #f1f5f9)
          `,
          backgroundAttachment: "fixed",
        }}
      >
        {children}
      </body>
    </html>
  );
}
