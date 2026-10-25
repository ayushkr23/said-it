import { Easing, interpolate, spring, useVideoConfig } from "remotion";

/** The one reveal curve. Springs handle UI; this handles text and shapes. */
export const REVEAL = Easing.bezier(0.22, 1, 0.36, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 over [start, start + dur] frames with the reveal curve. */
export const reveal = (frame: number, start: number, dur: number) => interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: REVEAL });

export const lerp = (t: number, a: number, b: number) => a + (b - a) * t;

/** UI spring. Damping 14–20 per the brief; lower = bouncier. */
export const pop = (frame: number, fps: number, delay = 0, damping = 15, stiffness = 170) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.8 } });

/** Gentle idle motion so no frame sits still. */
export const drift = (frame: number, amp = 1, period = 90, phase = 0) => Math.sin((frame / period) * Math.PI * 2 + phase) * amp;

export const mix = (t: number, a: string, b: string) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(lerp(Math.min(1, Math.max(0, t)), v, y[i]))).join(",")})`;
};

export function useLayout() {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  return {
    w: width,
    h: height,
    vertical,
    pad: vertical ? 90 : 130,
    /** Headline size that stays big in both formats. */
    display: vertical ? 132 : 150,
    body: vertical ? 54 : 52,
  };
}
