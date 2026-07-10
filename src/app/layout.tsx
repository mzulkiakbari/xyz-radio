import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthWrapper } from "@/components/AuthWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XYZ Radio Panel",
  description: "Alternative AzuraCast Web Panel",
};

import { ThemeProvider } from "@/components/ThemeContext";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">
        <ThemeProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </ThemeProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
