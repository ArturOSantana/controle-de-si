import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Controle de Si - Domine Vícios, Hábitos e Produtividade",
  description: "Transforme sua vida: combata vícios, crie hábitos, estude melhor e organize seu dia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Controle de Si"
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-title" content="Controle de Si" />
      </head>
      <body className={`${inter.className} antialiased bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen`}>
        <Navbar />
        <main className="lg:pl-20 pb-20 lg:pb-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

// Made with Bob
