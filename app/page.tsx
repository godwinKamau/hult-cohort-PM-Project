import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  Show,
} from "@clerk/nextjs";
import {
  FolderGit2,
  GitBranch,
  KanbanSquare,
  Radio,
  Terminal,
  ThumbsUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalPanel } from "@/components/states/TerminalPanel";
import { TourLauncher } from "@/components/tour/TourLauncher";

const features = [
  {
    icon: Users,
    title: "org_scoped_workspaces()",
    description:
      "Clerk Organizations with GitHub sign-in. Each org gets its own projects and members.",
  },
  {
    icon: KanbanSquare,
    title: "kanban_board()",
    description:
      "Drag-and-drop tickets, assign teammates, filter by assignee, and track status.",
  },
  {
    icon: GitBranch,
    title: "github_activity_banner()",
    description:
      "Push and PR events from linked repos appear in the banner within ~20–60s.",
  },
  {
    icon: FolderGit2,
    title: "repo_linking()",
    description:
      "Connect a GitHub repo and branch per project. Verify access and pick branches in settings.",
  },
  {
    icon: Radio,
    title: "live_presence()",
    description:
      "See who else in your org has the app open. Click status: online in the banner.",
  },
  {
    icon: ThumbsUp,
    title: "reactions_and_inbox()",
    description:
      "React to banner events with 👍. Get inbox notifications when someone reacts to your push.",
  },
];

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

      <main className="flex-1 container mx-auto px-4 py-16 matrix-bg">
        <div className="max-w-3xl mx-auto space-y-16">
          {/* Hero */}
          <section className="space-y-8 text-center">
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
            <div className="flex flex-wrap gap-4 justify-center">
              <TourLauncher />
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <Button size="lg">get_started()</Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Button size="lg" asChild>
                  <Link href="/dashboard">./dashboard</Link>
                </Button>
              </Show>
            </div>
          </section>

          {/* Features */}
          <section className="space-y-6">
            <h2 className="font-mono text-lg text-primary text-center">
              {"// features"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="cyber-border bg-black-light/30 border-primary/20 rounded p-5 text-left"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="font-mono text-sm text-primary">
                        {title}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Getting started */}
          <section className="space-y-6">
            <h2 className="font-mono text-lg text-primary text-center">
              {"// getting_started"}
            </h2>
            <TerminalPanel
              title="quickstart.sh"
              lines={[
                "1. sign_up() with your GitHub account",
                "2. create or select an organization",
                "3. new project -> settings() -> link a GitHub repo + branch",
                "4. add tickets, assign, drag across the Kanban board",
                "5. push to the linked branch -> watch the activity banner",
              ]}
              footer={
                <Show when="signed-out">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <SignUpButton mode="modal">
                      <Button size="lg">get_started()</Button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <Button variant="outline" size="lg">
                        sign_in()
                      </Button>
                    </SignInButton>
                  </div>
                </Show>
              }
            />
            <Show when="signed-in">
              <div className="flex justify-center">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/dashboard">./dashboard</Link>
                </Button>
              </div>
            </Show>
          </section>
        </div>
      </main>
    </div>
  );
}
