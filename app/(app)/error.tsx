"use client";

import { TerminalPanel } from "@/components/states/TerminalPanel";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <TerminalPanel
        title="error.handler"
        lines={[
          "> error: unhandled_exception",
          `> message: ${error.message}`,
          "> $ try_again_or_contact_support",
        ]}
      />
      <Button className="mt-4" onClick={reset}>
        retry()
      </Button>
    </div>
  );
}
