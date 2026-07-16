import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  Show,
} from "@clerk/nextjs";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalPanel } from "@/components/states/TerminalPanel";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-primary/20 bg-black-deep/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-6 h-6 text-primary" />
            <span className="font-mono text-primary terminal-cursor">
              root@pm-platform
            </span>
          </div>
          <div className="flex gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  sign_in()
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">sign_up()</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button size="sm" asChild>
                <Link href="/dashboard">./dashboard</Link>
              </Button>
            </Show>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center matrix-bg">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <h1 className="font-mono text-3xl text-primary">
            PM_PLATFORM v1.0
          </h1>
          <p className="font-mono text-muted-foreground">
            Org-scoped workspaces. Kanban tickets. GitHub activity banner.
          </p>
          <TerminalPanel
            title="init.sh"
            lines={[
              "> loading_modules: auth, projects, tickets, github",
              "> status: ready",
              "> $ waiting_for_org…",
            ]}
          />
          <Show when="signed-out">
            <div className="flex gap-4 justify-center">
              <SignUpButton mode="modal">
                <Button size="lg">get_started()</Button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      </main>
    </div>
  );
}
