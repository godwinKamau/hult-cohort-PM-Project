"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface HeaderPathContextValue {
  projectSlug: string | null;
  setProjectSlug: (slug: string | null) => void;
}

const HeaderPathContext = createContext<HeaderPathContextValue | null>(null);

export function slugifyProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function HeaderPathProvider({ children }: { children: ReactNode }) {
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const value = useMemo(
    () => ({ projectSlug, setProjectSlug }),
    [projectSlug]
  );

  return (
    <HeaderPathContext.Provider value={value}>
      {children}
    </HeaderPathContext.Provider>
  );
}

export function useHeaderPathProjectSlug(): string | null {
  return useContext(HeaderPathContext)?.projectSlug ?? null;
}

export function useSetHeaderProjectName(projectName?: string | null) {
  const context = useContext(HeaderPathContext);

  useLayoutEffect(() => {
    if (!context) return;

    context.setProjectSlug(
      projectName ? slugifyProjectName(projectName) : null
    );

    return () => {
      context.setProjectSlug(null);
    };
  }, [context, projectName]);
}
