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
import type { PixelAvatarDTO } from "@/lib/types";
import { PixelAvatar } from "./PixelAvatar";

const MAX_FLOATING_AVATARS = 12;

export interface FloatingAvatar extends PixelAvatarDTO {
  id: string;
  seed: number;
}

interface FloatingAvatarsContextValue {
  myAvatar: PixelAvatarDTO | null;
  addFloatingAvatar: (avatar: PixelAvatarDTO) => void;
}

const FloatingAvatarsContext =
  createContext<FloatingAvatarsContextValue | null>(null);

export function FloatingAvatarsProvider({
  children,
  myAvatar = null,
}: {
  children: ReactNode;
  myAvatar?: PixelAvatarDTO | null;
}) {
  const [floatingAvatars, setFloatingAvatars] = useState<FloatingAvatar[]>(
    []
  );
  const nextId = useRef(0);

  const addFloatingAvatar = useCallback((avatar: PixelAvatarDTO) => {
    const entry: FloatingAvatar = {
      ...avatar,
      id: `float-${nextId.current++}`,
      seed: Math.random(),
    };

    setFloatingAvatars((current) => {
      const next = [...current, entry];
      if (next.length <= MAX_FLOATING_AVATARS) return next;
      return next.slice(next.length - MAX_FLOATING_AVATARS);
    });
  }, []);

  const value = useMemo(
    () => ({ myAvatar, addFloatingAvatar }),
    [myAvatar, addFloatingAvatar]
  );

  return (
    <FloatingAvatarsContext.Provider value={value}>
      {children}
      <FloatingAvatarsLayer avatars={floatingAvatars} />
    </FloatingAvatarsContext.Provider>
  );
}

export function useFloatingAvatars(): FloatingAvatarsContextValue {
  const ctx = useContext(FloatingAvatarsContext);
  if (!ctx) {
    throw new Error(
      "useFloatingAvatars must be used within FloatingAvatarsProvider"
    );
  }
  return ctx;
}

function FloatingAvatarsLayer({ avatars }: { avatars: FloatingAvatar[] }) {
  if (avatars.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {avatars.map((avatar) => {
        const driftX = (avatar.seed * 2 - 1) * 120;
        const driftY = -(80 + avatar.seed * 160);
        const rotate = (avatar.seed * 2 - 1) * 25;
        const duration = 18 + avatar.seed * 14;
        const left = 8 + avatar.seed * 84;

        return (
          <div
            key={avatar.id}
            className="floating-avatar absolute bottom-4 opacity-40"
            style={
              {
                left: `${left}%`,
                "--drift-x": `${driftX}px`,
                "--drift-y": `${driftY}px`,
                "--drift-rotate": `${rotate}deg`,
                "--float-duration": `${duration}s`,
              } as React.CSSProperties
            }
          >
            <PixelAvatar grid={avatar.grid} color={avatar.color} size={48} />
          </div>
        );
      })}
    </div>
  );
}
