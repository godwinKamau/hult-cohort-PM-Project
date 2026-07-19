"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";

interface SearchableSelectProps {
  id?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "select_option",
  searchPlaceholder = "search…",
  emptyMessage = "no_matches",
  disabled = false,
  loading = false,
  className,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const displayValue = value || placeholder;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (disabled || loading) return;
          setOpen((current) => !current);
          setQuery("");
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded border border-primary/30 bg-black-light px-3 py-1 text-sm font-mono shadow-sm transition-colors",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          value ? "text-primary" : "text-muted-foreground/50"
        )}
      >
        <span className="truncate text-left">
          {loading ? "loading…" : displayValue}
        </span>
        <span className="text-muted-foreground">▾</span>
      </button>

      {open && !disabled && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded border border-primary/30 bg-black-light shadow-lg">
          <div className="border-b border-primary/20 p-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 font-mono text-xs text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left font-mono text-xs transition-colors hover:bg-primary/10",
                      option === value ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {option}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
