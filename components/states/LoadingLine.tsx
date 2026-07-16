import { Skeleton } from "@/components/ui/skeleton";

export function LoadingLine({ message = "$ fetching_data…" }: { message?: string }) {
  return (
    <div className="space-y-3 p-4">
      <p className="font-mono text-sm text-muted-foreground terminal-cursor">
        {message}
      </p>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
