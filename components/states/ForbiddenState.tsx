import { TerminalPanel } from "./TerminalPanel";

export function ForbiddenState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <TerminalPanel
        title="access.denied"
        lines={[
          "> error: 403 forbidden",
          "> org_scope: mismatch",
          "> $ you_do_not_have_access_to_this_resource",
        ]}
      />
    </div>
  );
}
