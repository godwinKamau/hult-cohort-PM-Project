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
import { InboxDropdown } from "@/components/banner/InboxDropdown";

interface AppHeaderProps {
  orgSlug?: string;
}

export function AppHeader({ orgSlug = "workspace" }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "projects" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black-deep/80 backdrop-blur-sm border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 min-w-0">
            <Terminal className="w-5 h-5 text-primary shrink-0" />
            <span className="font-mono text-primary terminal-cursor truncate">
              root@{orgSlug}
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname.startsWith(item.href) ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={item.href}>./{item.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <InboxDropdown />
            <div className="hidden sm:block">
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "flex",
                    organizationSwitcherTrigger:
                      "font-mono text-sm text-primary border border-primary/20 bg-black-light/50 px-2 py-1 rounded hover:bg-primary/10",
                  },
                }}
                organizationProfileProps={{
                  appearance: {
                    elements: {
                      userPreviewSecondaryIdentifier: {
                        display: "none",
                      },
                    },
                  },
                }}
                hidePersonal
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden mt-3 py-3 border-t border-primary/20 space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname.startsWith(item.href) ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                asChild
                onClick={() => setIsMenuOpen(false)}
              >
                <Link href={item.href}>./{item.label}</Link>
              </Button>
            ))}
            <div className="pt-2">
              <OrganizationSwitcher
                hidePersonal
                organizationProfileProps={{
                  appearance: {
                    elements: {
                      userPreviewSecondaryIdentifier: {
                        display: "none",
                      },
                    },
                  },
                }}
              />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
