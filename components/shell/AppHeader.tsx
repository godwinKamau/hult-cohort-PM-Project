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
import { useHeaderPathProjectSlug } from "./HeaderPathContext";
import { cn } from "@/lib/cn";

type BreadcrumbSegment =
  | { type: "text"; label: string }
  | { type: "link"; label: string; href: string }
  | { type: "current"; label: string };

function buildBreadcrumb(
  pathname: string,
  projectSlug: string | null
): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "invites") {
    if (segments.length > 1) {
      return [
        { type: "text", label: "~/invites" },
        { type: "current", label: segments[1] },
      ];
    }
    return [{ type: "current", label: "~/invites" }];
  }

  if (segments[0] === "projects" && projectSlug) {
    return [
      { type: "link", label: "~/projects", href: "/dashboard" },
      { type: "current", label: projectSlug },
    ];
  }

  if (segments[0] === "projects" || segments[0] === "dashboard") {
    return [{ type: "current", label: "~/projects" }];
  }

  if (segments[0] === "avatar") {
    return [{ type: "current", label: "~/avatar" }];
  }

  return [{ type: "current", label: "~" }];
}

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

function HeaderBreadcrumb({
  segments,
}: {
  segments: BreadcrumbSegment[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="min-w-0 font-mono text-primary"
    >
      <ol className="flex min-w-0 items-center truncate">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <li key={`${segment.label}-${index}`} className="flex min-w-0 items-center">
              {index > 0 && (
                <span className="mx-0.5 text-primary/60" aria-hidden="true">
                  /
                </span>
              )}
              {segment.type === "link" ? (
                <Link
                  href={segment.href}
                  className="shrink-0 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {segment.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate",
                    isLast && "terminal-cursor",
                    segment.type === "current" && index > 0 && "text-primary/90"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {segment.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const projectSlug = useHeaderPathProjectSlug();
  const breadcrumb = buildBreadcrumb(pathname, projectSlug);

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
            <HeaderBreadcrumb segments={breadcrumb} />
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
            <div className="hidden md:flex items-center gap-1.5">
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                org:
              </span>
              <OrganizationSwitcher
                {...organizationSwitcherProps}
                appearance={{
                  elements: {
                    rootBox: "flex",
                    organizationSwitcherTrigger:
                      "font-mono text-sm text-primary border border-primary/20 bg-black-light/50 px-2 py-1 rounded hover:bg-primary/10",
                  },
                }}
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
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                org:
              </span>
              <OrganizationSwitcher {...organizationSwitcherProps} />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
