import { Atkinson_Hyperlegible_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

const atkinsonMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-atkinson-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PM Platform",
  description: "Org-scoped project management with GitHub activity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${atkinsonMono.variable} h-full`}>
      <body className="min-h-full flex flex-col font-mono antialiased">
        <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
