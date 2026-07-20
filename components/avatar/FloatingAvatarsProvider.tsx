"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pickRandomEmote } from "@/lib/avatar";
import type { PixelAvatarDTO } from "@/lib/types";
import { PixelAvatar } from "./PixelAvatar";

const MAX_FLOATING_AVATARS = 12;
const AVATAR_SIZE = 48;
const VIEWPORT_PADDING = 16;
const SIDE_LANE_WIDTH = 88;
const TOP_SAFE_ZONE = 120;
const EMOTE_DURATION_MS = 2500;

export interface FloatingAvatar extends PixelAvatarDTO {
  id: string;
  left: number;
  bottom: number;
  driftX: number;
  driftY: number;
  rotate: number;
  duration: number;
  emote: string | null;
  emoteNonce: number;
}

function createFloatingAvatarEntry(
  avatar: PixelAvatarDTO,
  id: string
): FloatingAvatar {
  const seed = Math.random();
  const seedY = Math.random();
  const onLeft = Math.random() < 0.5;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const minX = VIEWPORT_PADDING;
  const maxX = vw - AVATAR_SIZE - VIEWPORT_PADDING;

  // Keep avatars in narrow lanes along the left or right edge.
  const left = onLeft
    ? minX + seed * SIDE_LANE_WIDTH
    : maxX - seed * SIDE_LANE_WIDTH;

  // Wobble outward (away from center) so drift never crosses into the workspace.
  const wobble = 8 + seed * 20;
  const driftX = onLeft ? -wobble : wobble;

  const minBottom = VIEWPORT_PADDING;
  const maxBottom = Math.min(vh * 0.35, 160);
  const bottom = minBottom + seedY * Math.max(0, maxBottom - minBottom);

  const startTop = vh - bottom - AVATAR_SIZE;
  const topLimit = TOP_SAFE_ZONE + VIEWPORT_PADDING;
  const maxDriftUp = Math.max(0, startTop - topLimit);
  const maxVerticalDrift = Math.min(maxDriftUp, 140);
  const driftY =
    maxVerticalDrift > 0 ? -(seedY * 0.4 + 0.3) * maxVerticalDrift : 0;

  return {
    ...avatar,
    id,
    left,
    bottom,
    driftX,
    driftY,
    rotate: (seed * 2 - 1) * 12,
    duration: 18 + seed * 14,
    emote: null,
    emoteNonce: 0,
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
  const emoteTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const clearEmote = useCallback((avatarId: string, emoteNonce: number) => {
    setFloatingAvatars((current) =>
      current.map((avatar) =>
        avatar.id === avatarId && avatar.emoteNonce === emoteNonce
          ? { ...avatar, emote: null }
          : avatar
      )
    );
  }, []);

  const scheduleEmoteClear = useCallback(
    (avatarId: string, emoteNonce: number) => {
      const existing = emoteTimeoutsRef.current.get(avatarId);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        clearEmote(avatarId, emoteNonce);
        emoteTimeoutsRef.current.delete(avatarId);
      }, EMOTE_DURATION_MS);

      emoteTimeoutsRef.current.set(avatarId, timeout);
    },
    [clearEmote]
  );

  useEffect(() => {
    const timeouts = emoteTimeoutsRef.current;
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  const addFloatingAvatar = useCallback(
    (avatar: PixelAvatarDTO) => {
      const id = `float-${nextId.current++}`;
      const entry = createFloatingAvatarEntry(avatar, id);
      const reactedAvatars: { id: string; emoteNonce: number }[] = [];

      setFloatingAvatars((current) => {
        const reacted = current.map((existing) => {
          const emoteNonce = existing.emoteNonce + 1;
          reactedAvatars.push({ id: existing.id, emoteNonce });
          return {
            ...existing,
            emote: pickRandomEmote(),
            emoteNonce,
          };
        });

        const next = [...reacted, entry];
        if (next.length <= MAX_FLOATING_AVATARS) return next;
        return next.slice(next.length - MAX_FLOATING_AVATARS);
      });

      for (const reacted of reactedAvatars) {
        scheduleEmoteClear(reacted.id, reacted.emoteNonce);
      }
    },
    [scheduleEmoteClear]
  );

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
      className="fixed inset-0 z-[15] pointer-events-none overflow-hidden"
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
          {avatar.emote && (
            <div
              key={avatar.emoteNonce}
              className="avatar-speech-bubble"
              aria-hidden
            >
              <span>{avatar.emote}</span>
            </div>
          )}
          <PixelAvatar grid={avatar.grid} color={avatar.color} size={48} />
        </div>
      ))}
    </div>
  );
}
