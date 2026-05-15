import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";

import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kniffel Online",
  description: "Digitaler Kniffelblock fuer schnelle, saubere Runden mit Freunden."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body className="min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}
