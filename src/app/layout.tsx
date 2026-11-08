import type { Metadata } from "next";
import { Caveat, DM_Sans, Fraunces, Noto_Sans_SC } from "next/font/google";
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

// 中文: ONE clean geometric sans for every Chinese page (headings, body, notes, navigation alike), in two weights
// only — regular and semibold — after Zhinuo's type reference. Google serves it in small unicode-range slices, so a
// page downloads only the characters it shows, and English visitors download none.
const notoSansSC = Noto_Sans_SC({
  variable: "--font-zh-sans",
  weight: ["400", "600"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
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
      <body className={`${fraunces.variable} ${dmSans.variable} ${caveat.variable} ${notoSansSC.variable} antialiased`}>
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
