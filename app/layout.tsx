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
    colorText: "#f5f5f5",
    colorTextSecondary: "#d4d4d4",
    colorNeutral: "#e5e5e5",
    colorPrimary: "#00ff41",
    colorInputBackground: "#111111",
    colorInputText: "#f5f5f5",
    borderRadius: "0.25rem",
  },
  elements: {
    card: "bg-black-light border border-primary/20",
    formButtonPrimary: "bg-primary text-black hover:bg-primary/90",
    userButtonPopoverCard: "bg-black-light border border-primary/20",
    userButtonPopoverMain: "text-white",
    userPreview: "text-white",
    userPreviewTextContainer: "text-white",
    userPreviewMainIdentifier: "text-white",
    userPreviewMainIdentifierText: "text-white",
    userPreviewSecondaryIdentifier: "text-neutral-300",
    userButtonPopoverActionButton: "text-white hover:bg-primary/10",
    userButtonPopoverActionButtonText: "text-white",
    userButtonPopoverFooter: "text-neutral-400",
    organizationSwitcherPopoverCard: "bg-black-light border border-primary/20",
    organizationSwitcherPopoverMain: "text-white",
    organizationSwitcherPopoverActions: "text-white",
    organizationPreview: "text-white",
    organizationPreviewTextContainer: "text-white",
    organizationPreviewMainIdentifier: "text-white",
    organizationPreviewMainIdentifierText: "text-white",
    organizationPreviewSecondaryIdentifier: "text-neutral-300",
    organizationSwitcherTriggerIcon: "text-primary",
    organizationSwitcherPopoverActionButton: "text-white hover:bg-primary/10",
    organizationSwitcherPopoverActionButtonText: "text-white",
    organizationListPreviewButton: "text-white hover:bg-primary/10",
    organizationListPreviewTextContainer: "text-white",
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
