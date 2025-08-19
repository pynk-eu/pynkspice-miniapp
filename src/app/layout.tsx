import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { LangProvider } from "@/contexts/LangContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TelegramThemeSync from "@/components/TelegramThemeSync";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The PynkSpice",
  description: "Authentic Indian Vegetarian Cuisine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LangProvider>
          <CartProvider>
            <TelegramThemeSync />
            <Header />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </LangProvider>
      </body>
    </html>
  );
}
