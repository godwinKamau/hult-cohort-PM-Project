"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  OrganizationSwitcher,
  UserButton,
} from "@clerk/nextjs";
import { Terminal, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { organizationSwitcherAppearance } from "@/lib/clerk-appearance";
import { InboxDropdown } from "@/components/banner/InboxDropdown";

const organizationSwitcherProps = {
  hidePersonal: true,
  afterSelectOrganizationUrl: "/dashboard",
  afterCreateOrganizationUrl: "/dashboard",
  organizationProfileProps: {
    appearance: {
      elements: {
        userPreviewSecondaryIdentifier: {
          display: "none",
        },
      },
    },
  },
} as const;

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "all projects" },
    { href: "/avatar", label: "avatar" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black-deep/80 backdrop-blur-sm border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 min-w-0">
            <Terminal className="w-5 h-5 text-primary shrink-0" />
            <Link
              href="/"
              className="font-mono text-primary shrink-0 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              PM_Project
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={
                  pathname === item.href ||
                  (item.href === "/dashboard" &&
                    pathname.startsWith("/dashboard/"))
                    ? "default"
                    : "ghost"
                }
                size="sm"
                asChild
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:block">
              <InboxDropdown />
            </div>
            <div className="hidden md:flex items-center">
              <OrganizationSwitcher
                {...organizationSwitcherProps}
                appearance={organizationSwitcherAppearance}
              />
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 border border-primary/30",
                },
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav
            id="mobile-nav-menu"
            className="md:hidden mt-3 py-3 border-t border-primary/20 space-y-3"
          >
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={
                  pathname === item.href ||
                  (item.href === "/dashboard" &&
                    pathname.startsWith("/dashboard/"))
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-start"
                asChild
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="font-mono text-xs text-muted-foreground">
                inbox
              </span>
              <InboxDropdown />
            </div>
            <div className="pt-1">
              <OrganizationSwitcher
                {...organizationSwitcherProps}
                appearance={organizationSwitcherAppearance}
              />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
