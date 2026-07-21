"use client";

import { useCallback, useRef } from "react";
import { Bold, Italic, Link, List, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isHtmlEmpty } from "@/lib/sanitizeHtml";
import { cn } from "@/lib/cn";

interface RichNoteComposerProps {
  disabled?: boolean;
  onSubmit: (body: string, format: "text" | "html") => Promise<void>;
}

function execFormat(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichNoteComposer({
  disabled = false,
  onSubmit,
}: RichNoteComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const handleFormat = useCallback(
    (command: string, value?: string) => {
      focusEditor();
      execFormat(command, value);
    },
    [focusEditor]
  );

  const handleLink = useCallback(() => {
    focusEditor();
    const url = window.prompt("Enter link URL (https://…)");
    if (!url?.trim()) return;
    execFormat("createLink", url.trim());
  }, [focusEditor]);

  const clearEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.innerHTML = "";
  }, []);

  const handleSubmit = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor || disabled) return;

    const html = editor.innerHTML;
    if (isHtmlEmpty(html)) return;

    await onSubmit(html, "html");
    clearEditor();
  }, [clearEditor, disabled, onSubmit]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Bold"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleFormat("bold")}
        >
          <Bold className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Italic"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleFormat("italic")}
        >
          <Italic className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Underline"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleFormat("underline")}
        >
          <Underline className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Bulleted list"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleFormat("insertUnorderedList")}
        >
          <List className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="Insert link"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleLink}
        >
          <Link className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>

      <div className="flex items-end gap-2">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          role="textbox"
          aria-multiline="true"
          aria-label="Note message"
          data-placeholder="Write a note…"
          suppressContentEditableWarning
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          className={cn(
            "min-h-10 max-h-28 flex-1 overflow-y-auto rounded-md border border-primary/30",
            "bg-black/50 px-3 py-2 font-mono text-sm leading-5 text-primary/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            "empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
            "[&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
          )}
        />
        <Button
          size="sm"
          className="h-10 shrink-0 px-4"
          onClick={() => void handleSubmit()}
          disabled={disabled}
        >
          {disabled ? "…" : "send"}
        </Button>
      </div>
    </div>
  );
}
