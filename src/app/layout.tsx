import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "@/lib/darkmode";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const BASE_URL = "https://tablemate-beta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TableMate — Professional Wedding Seating Chart Planner",
    template: "%s | TableMate",
  },
  description:
    "Plan your perfect wedding seating chart. Drag-and-drop tables, manage 500+ guests, collect RSVPs, track meal preferences, and export beautiful printable charts — all in one place.",
  keywords: [
    "wedding seating chart",
    "wedding seating chart",
    "wedding seating chart maker",
    "wedding table planner",
    "wedding RSVP",
    "online wedding RSVP",
    "wedding guest list manager",
    "seating chart for wedding reception",
    "drag and drop seating chart",
    "wedding planner software",
    "wedding seating chart app",
  ],
  authors: [{ name: "TableMate" }],
  creator: "TableMate",
  publisher: "TableMate",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "TableMate — Professional Wedding Seating Chart Planner",
    description:
      "Drag-and-drop tables, manage 500+ guests, collect RSVPs, and export beautiful printable charts.",
    url: BASE_URL,
    siteName: "TableMate",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "TableMate — Professional Wedding Seating Chart Planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TableMate — Professional Wedding Seating Chart Planner",
    description:
      "Drag-and-drop wedding seating charts. Manage guests, collect RSVPs, export beautiful charts.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@tablemateapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}
