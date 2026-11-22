import type { Metadata } from "next";
import { Caveat, DM_Sans, Fraunces } from "next/font/google";
import { site } from "@/data/site";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PaintDefs from "@/components/garden/PaintDefs";
import { NIGHT_BOOT } from "@/components/night/night-boot";
import { LOCALE_BOOT } from "@/i18n/boot";
import LocaleSync from "@/i18n/LocaleSync";
import SkipLink from "@/i18n/SkipLink";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

// Handwritten labels on the Work garden.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

// 中文: Chinese characters use "Garden Hei", a self-hosted subset of Noto Sans SC declared in globals.css for
// Chinese code points only, so the English faces above are never replaced (scripts/subset-zh-font.py).

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  // The favicon: a tiny oil painting of a cottage in the garden (scripts/paint-favicon.py writes these to public/).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: site.title,
    description: site.description,
    type: "website",
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* restore a remembered night before the first paint */}
        <script dangerouslySetInnerHTML={{ __html: NIGHT_BOOT }} />
        {/* …and a remembered 中文, so the English never flashes first */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT }} />
      </head>
      <body className={`${fraunces.variable} ${dmSans.variable} ${caveat.variable} antialiased`}>
        <LocaleSync />
        <SkipLink />
        <PaintDefs />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
