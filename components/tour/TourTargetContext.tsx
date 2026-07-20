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

interface TourTargetContextValue {
  registerTarget: (id: string, element: HTMLElement | null) => void;
  getTarget: (id: string) => HTMLElement | null;
  version: number;
}

const TourTargetContext = createContext<TourTargetContextValue | null>(null);

export function TourTargetProvider({ children }: { children: ReactNode }) {
  const targetsRef = useRef(new Map<string, HTMLElement>());
  const [version, setVersion] = useState(0);

  const registerTarget = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      targetsRef.current.set(id, element);
    } else {
      targetsRef.current.delete(id);
    }
    setVersion((current) => current + 1);
  }, []);

  const getTarget = useCallback((id: string) => {
    return targetsRef.current.get(id) ?? null;
  }, []);

  const value = useMemo(
    () => ({ registerTarget, getTarget, version }),
    [registerTarget, getTarget, version]
  );

  return (
    <TourTargetContext.Provider value={value}>
      {children}
    </TourTargetContext.Provider>
  );
}

export function useTourTargets() {
  const ctx = useContext(TourTargetContext);
  if (!ctx) {
    throw new Error("useTourTargets must be used within TourTargetProvider");
  }
  return ctx;
}

export function useTourTarget(id: string) {
  const { registerTarget } = useTourTargets();

  return useCallback(
    (element: HTMLElement | null) => {
      registerTarget(id, element);
    },
    [id, registerTarget]
  );
}
