import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import ClientProviders from "@/components/ClientProviders";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "HealthFollow | Care lifecycle, connected",
  description: "Appointments, AI-assisted visit preparation, and follow-up care.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientProviders>
            <div className="min-h-screen bg-[#f8f9ff]">
              <header className="sticky top-0 z-50 border-b border-[#dce9ff] bg-[#f8f9ff]/95 backdrop-blur">
                <Navbar />
              </header>
              <main className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-10 md:py-10">{children}</main>
            </div>
        </ClientProviders>
      </body>
    </html>
  );
}
