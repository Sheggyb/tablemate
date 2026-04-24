import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "TableMate — Free Wedding Seating Planner",
  description: "Plan your perfect wedding seating chart. Drag-and-drop tables, manage guests, handle meal preferences, and export printable charts. Free to start.",
  keywords: ["wedding seating chart", "wedding planner", "seating plan", "table plan", "free wedding tools"],
  openGraph: {
    title: "TableMate — Free Wedding Seating Planner",
    description: "Plan your perfect wedding seating chart for free.",
    type: "website",
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
        {children}
      </body>
    </html>
  );
}
