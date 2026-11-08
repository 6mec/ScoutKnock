import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ptPT } from "@/i18n/pt-PT";
import { siteUrl } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Endereço base: as imagens de partilha (WhatsApp, redes) precisam de endereços completos.
  metadataBase: new URL(siteUrl()),
  title: ptPT.brand.name,
  description: ptPT.brand.tagline,
  appleWebApp: { capable: true, title: ptPT.brand.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#151613" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      lang="pt-PT"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
