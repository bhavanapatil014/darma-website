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

import { Shell } from "@/components/layout/shell";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Venkata Derma - Premium Skincare & Dermatology",
  description: "Experience the science of beautiful skin with Venkata Derma's premium dermatology products.",
  other: {
    "version": "3.56.30", // Trigger Deploy
    "Cache-Control": "no-cache, no-store, must-revalidate"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (/Loading chunk [\\d]+ failed/.test(e.message) || /Failed to load chunk/.test(e.message)) {
                  window.location.reload();
                }
              });
            `,
          }}
        />
        <Providers>
          <Shell>
            {children}
          </Shell>
          <Toaster position="top-center" richColors />
        </Providers>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </body>
    </html>
  );
}
