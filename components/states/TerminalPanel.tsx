import { cn } from "@/lib/cn";

interface TerminalPanelProps {
  title?: string;
  lines: string[];
  className?: string;
  showCursor?: boolean;
}

export function TerminalPanel({
  title = "terminal.log",
  lines,
  className,
  showCursor = true,
}: TerminalPanelProps) {
  return (
    <div
      className={cn(
        "cyber-border bg-black-light/30 border-primary/20 rounded p-6",
        className
      )}
    >
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-primary" />
        <span className="ml-2 font-mono text-sm text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="font-mono text-sm space-y-1">
        {lines.map((line, i) => (
          <div key={i} className="text-green-dark">
            {line}
          </div>
        ))}
        {showCursor && (
          <div className="text-primary">
            <span className="animate-pulse">_</span>
          </div>
        )}
      </div>
    </div>
  );
}
