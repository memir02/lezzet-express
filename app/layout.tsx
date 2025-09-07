'use client';

import { Teko, Sigmar } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { SessionProvider } from "next-auth/react";

const sigmar = Sigmar({ subsets: ["latin"], weight: "400" });
const teko = Teko({ subsets: ["latin"], weight: "400" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={`${sigmar.className} ${teko.className} antialiased`}>
        <SessionProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}