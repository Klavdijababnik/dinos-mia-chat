import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "DINOS DROE — Pomočnik",
  description:
    "Slovenski klepet za vprašanja o odpadni embalaži in skladnosti DROE DINOS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl">
      <body className={sourceSans.variable}>{children}</body>
    </html>
  );
}
