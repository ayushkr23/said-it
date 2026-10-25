import { getLength } from "@remotion/paths";
import { useMemo, type CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../brand";
import { drift, reveal } from "./core";

type DrawProps = {
  d: string;
  start?: number;
  duration?: number;
  stroke?: string;
  width?: number;
  fill?: string;
  /** Fill fades in after the stroke finishes. */
  fillAfter?: boolean;
};

/** A path that draws itself with stroke-dashoffset. Use inside an <svg>. */
export function DrawPath({ d, start = 0, duration = 24, stroke = C.ink, width = 4, fill = "none", fillAfter }: DrawProps) {
  const frame = useCurrentFrame();
  const len = useMemo(() => getLength(d), [d]);
  const t = reveal(frame, start, duration);
  const f = fillAfter ? reveal(frame, start + duration * 0.8, 10) : 1;
  return (
    <path
      d={d}
      fill={fill}
      fillOpacity={fill === "none" ? undefined : f}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={len}
      strokeDashoffset={len * (1 - t)}
    />
  );
}

export const DOODLES = {
  star: "M50 8 L60 38 L92 40 L66 58 L76 90 L50 70 L24 90 L34 58 L8 40 L40 38 Z",
  sparkle: "M50 6 C 54 38, 62 46, 94 50 C 62 54, 54 62, 50 94 C 46 62, 38 54, 6 50 C 38 46, 46 38, 50 6 Z",
  squiggle: "M6 50 C 18 20, 30 80, 42 50 S 66 20, 78 50 S 94 70, 98 46",
  arrow: "M8 70 C 30 30, 60 20, 88 34 M88 34 L70 22 M88 34 L76 52",
  circle: "M50 10 C 84 8, 96 40, 88 66 C 78 94, 22 96, 10 64 C 0 36, 22 12, 56 14",
  question: "M30 32 C 30 10, 70 8, 70 32 C 70 48, 50 50, 50 64 M50 84 L50 86",
  heart: "M50 86 C 10 60, 6 30, 28 20 C 40 14, 50 26, 50 32 C 50 26, 60 14, 72 20 C 94 30, 90 60, 50 86 Z",
  check: "M14 52 L40 78 L88 22",
  burst: "M50 4 L50 24 M50 76 L50 96 M4 50 L24 50 M76 50 L96 50 M18 18 L32 32 M68 68 L82 82 M82 18 L68 32 M18 82 L32 68",
};

/** A self-drawing hand-drawn doodle that keeps wobbling after it lands. */
export function Doodle({
  kind,
  x,
  y,
  size = 90,
  start = 0,
  duration = 22,
  color = C.ink,
  width = 5,
  rotate = 0,
  fill,
  style,
}: {
  kind: keyof typeof DOODLES;
  x: number;
  y: number;
  size?: number;
  start?: number;
  duration?: number;
  color?: string;
  width?: number;
  rotate?: number;
  fill?: string;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const wob = drift(frame, 5, 70, x * 0.01) + rotate;
  const bob = drift(frame, 6, 95, y * 0.02);
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ position: "absolute", left: x, top: y, transform: `translateY(${bob}px) rotate(${wob}deg)`, overflow: "visible", ...style }}
    >
      <DrawPath d={DOODLES[kind]} start={start} duration={duration} stroke={color} width={width} fill={fill ?? "none"} fillAfter={!!fill} />
    </svg>
  );
}
