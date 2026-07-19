"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastVariant = "info" | "error" | "success";

interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface TerminalToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const TerminalToastContext = createContext<TerminalToastContextValue | null>(
  null
);

const VARIANT_CLASS: Record<ToastVariant, string> = {
  info: "text-primary border-primary/40",
  success: "text-green-dark border-green-dark/40",
  error: "text-destructive border-destructive/40",
};

export function TerminalToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <TerminalToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-[70] flex max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "cyber-border rounded border bg-black-light/95 px-3 py-2 font-mono text-xs shadow-lg shadow-primary/10",
              VARIANT_CLASS[toast.variant]
            )}
          >
            {toast.variant === "error" ? "! " : "> "}
            {toast.message}
          </div>
        ))}
      </div>
    </TerminalToastContext.Provider>
  );
}

export function useTerminalToast() {
  const context = useContext(TerminalToastContext);
  if (!context) {
    throw new Error("useTerminalToast must be used within TerminalToastProvider");
  }
  return context;
}
