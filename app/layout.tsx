import { JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PM Platform",
  description: "Org-scoped project management with GitHub activity",
};

const clerkAppearance = {
  variables: {
    colorBackground: "#0a0a0a",
    colorText: "#00ff41",
    colorPrimary: "#00ff41",
    colorInputBackground: "#111111",
    colorInputText: "#00ff41",
    borderRadius: "0.25rem",
  },
  elements: {
    card: "bg-black-light border border-primary/20",
    formButtonPrimary: "bg-primary text-black hover:bg-primary/90",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col font-mono antialiased">
        <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
