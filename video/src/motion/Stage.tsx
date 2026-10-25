import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../brand";
import { OVERLAP_FRAMES, type Transition } from "../script";
import { drift, lerp, pop, REVEAL } from "./core";

type Key = { at: number; scale?: number; x?: number; y?: number; rotate?: number };

/** Scale/translate wrapper for push-ins and pans. Adds a slow handheld drift so frames never sit still. */
export function CameraRig({ keys, children, handheld = 1, style }: { keys: Key[]; children: ReactNode; handheld?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const get = (prop: keyof Omit<Key, "at">, fallback: number) => {
    const ks = keys.filter((k) => k[prop] !== undefined);
    if (!ks.length) return fallback;
    if (frame <= ks[0].at) return ks[0][prop]!;
    for (let i = 0; i < ks.length - 1; i++) {
      const a = ks[i];
      const b = ks[i + 1];
      if (frame <= b.at) {
        const t = REVEAL((frame - a.at) / Math.max(1, b.at - a.at));
        return lerp(t, a[prop]!, b[prop]!);
      }
    }
    return ks[ks.length - 1][prop]!;
  };
  const s = get("scale", 1);
  const x = get("x", 0) + drift(frame, 6 * handheld, 140);
  const y = get("y", 0) + drift(frame, 5 * handheld, 170, 1);
  const r = get("rotate", 0) + drift(frame, 0.25 * handheld, 200, 2);
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`, transformOrigin: "50% 50%", ...style }}>
      {children}
    </AbsoluteFill>
  );
}

/** Entry transition for a scene, played over the overlap with the previous one. */
export function SceneTransition({ type, children }: { type: Transition; children: ReactNode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = OVERLAP_FRAMES;
  const t = REVEAL(Math.min(1, Math.max(0, frame / n)));
  let style: CSSProperties = {};
  let edge: ReactNode = null;

  if (type === "wipe") {
    style = { clipPath: `inset(0 0 0 ${(1 - t) * 100}%)` };
    edge = t < 1 && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(1 - t) * 100}%`, width: 26, marginLeft: -13, background: C.accent }} />;
  } else if (type === "zoom") {
    style = { transform: `scale(${lerp(t, 1.5, 1)})`, opacity: t, filter: `blur(${(1 - t) * 18}px)` };
  } else if (type === "slide") {
    style = { transform: `translateX(${(1 - t) * 100}%)`, boxShadow: t < 1 ? "-30px 0 60px rgba(30,27,23,.25)" : undefined };
  } else if (type === "squash") {
    const s = pop(frame, fps, 0, 9, 260);
    style = { transform: `scale(${interpolate(s, [0, 1], [1.35, 1])}, ${interpolate(s, [0, 1], [0.15, 1])})`, transformOrigin: "50% 100%", opacity: Math.min(1, s * 4) };
  }

  return (
    <AbsoluteFill style={{ background: C.paper, ...style }}>
      {children}
      {edge}
    </AbsoluteFill>
  );
}

/** Animated paper grain. Jumps every 2 frames like film. */
export function Grain({ opacity = 0.32 }: { opacity?: number }) {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 2);
  const x = Math.floor(random(`gx${step}`) * 200);
  const y = Math.floor(random(`gy${step}`) * 200);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .12 0 0 0 0 .1 0 0 0 0 .08 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        mixBlendMode: "multiply",
        backgroundImage: `url("data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E")}")`,
        backgroundPosition: `${x}px ${y}px`,
      }}
    />
  );
}

/** Soft vignette so edges feel like paper under a lamp. */
export function Paper() {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 40%, ${C.paperHi} 0%, ${C.paper} 55%, ${C.paperLo} 120%)`,
      }}
    />
  );
}
