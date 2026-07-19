import { TerminalPanel } from "./TerminalPanel";

interface EmptyStateProps {
  title: string;
  lines?: string[];
  highlight?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  lines = [],
  highlight,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 matrix-bg rounded">
      <TerminalPanel
        title="status"
        lines={[
          "> system_status: online",
          `> ${title}`,
          ...lines,
          "> waiting_for_input...",
        ]}
        highlight={highlight}
        footer={children}
      />
    </div>
  );
}
