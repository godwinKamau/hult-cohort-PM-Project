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
const AVATAR_SIZE = 48;
const VIEWPORT_PADDING = 16;
const TOP_SAFE_ZONE = 120;

export interface FloatingAvatar extends PixelAvatarDTO {
  id: string;
  left: number;
  bottom: number;
  driftX: number;
  driftY: number;
  rotate: number;
  duration: number;
}

function createFloatingAvatarEntry(
  avatar: PixelAvatarDTO,
  id: string
): FloatingAvatar {
  const seed = Math.random();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const minX = VIEWPORT_PADDING;
  const maxX = vw - AVATAR_SIZE - VIEWPORT_PADDING;
  const left = minX + seed * Math.max(0, maxX - minX);

  const minBottom = VIEWPORT_PADDING;
  const maxBottom = Math.min(vh * 0.25, 120);
  const bottom = minBottom + seed * Math.max(0, maxBottom - minBottom);

  const startTop = vh - bottom - AVATAR_SIZE;
  const topLimit = TOP_SAFE_ZONE + VIEWPORT_PADDING;

  const maxDriftLeft = left - minX;
  const maxDriftRight = maxX - left;
  const maxHorizontalDrift = Math.min(maxDriftLeft, maxDriftRight, 96);
  const driftX =
    maxHorizontalDrift > 0 ? (seed * 2 - 1) * maxHorizontalDrift : 0;

  const maxDriftUp = Math.max(0, startTop - topLimit);
  const maxVerticalDrift = Math.min(maxDriftUp, 160);
  const driftY =
    maxVerticalDrift > 0 ? -(seed * 0.5 + 0.5) * maxVerticalDrift : 0;

  return {
    ...avatar,
    id,
    left,
    bottom,
    driftX,
    driftY,
    rotate: (seed * 2 - 1) * 15,
    duration: 18 + seed * 14,
  };
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
    const id = `float-${nextId.current++}`;
    const entry = createFloatingAvatarEntry(avatar, id);

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
      {avatars.map((avatar) => (
          <div
            key={avatar.id}
            className="floating-avatar absolute opacity-40"
            style={
              {
                left: `${avatar.left}px`,
                bottom: `${avatar.bottom}px`,
                "--drift-x": `${avatar.driftX}px`,
                "--drift-y": `${avatar.driftY}px`,
                "--drift-rotate": `${avatar.rotate}deg`,
                "--float-duration": `${avatar.duration}s`,
              } as React.CSSProperties
            }
          >
            <PixelAvatar grid={avatar.grid} color={avatar.color} size={48} />
          </div>
        ))}
    </div>
  );
}
