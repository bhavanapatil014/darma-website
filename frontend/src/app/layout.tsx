import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { CartSidebar } from "@/components/ui/cart-sidebar";
import { ChatWidget } from "@/components/chat-widget";

export const metadata: Metadata = {
  title: "New Balaji Gandhi - Premium Skincare & Dermatology",
  description: "Experience the science of beautiful skin with New Balaji Gandhi's premium dermatology products.",
  other: {
    "version": "1.8.1-ForceUpdate",
    "Cache-Control": "no-cache, no-store, must-revalidate"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <Navbar />
          <CartSidebar />
          <main className="flex-1 pt-32">
            {children}
          </main>
          <Footer />
          <ChatWidget />
        </Providers>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </body>
    </html>
  );
}
