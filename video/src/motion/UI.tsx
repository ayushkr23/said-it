import type { CSSProperties, ReactNode } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, SHADOW } from "../brand";
import { drift, mix, pop, reveal } from "./core";

/** Stamp-style badge: springs in tilted, colour tweens from paper to accent. */
export function Badge({ text, start = 0, tone = "accent", size = 30, style }: { text: string; start?: number; tone?: "accent" | "ink"; size?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, start, 11, 260);
  const c = reveal(frame, start + 4, 12);
  const base = tone === "accent" ? C.accent : C.ink;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.18em 0.5em",
        border: `4px solid ${base}`,
        borderRadius: 10,
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: size,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        color: mix(c, base, C.paperHi),
        background: mix(c, C.paperHi, base),
        transform: `scale(${interpolate(s, [0, 1], [2.4, 1])}) rotate(${interpolate(s, [0, 1], [-24, -8])}deg)`,
        opacity: Math.min(1, s * 3),
        ...style,
      }}
    >
      {text}
    </span>
  );
}

/** Chat bubble that springs up into place. */
export function Bubble({ text, who, mine, start = 0, size = 40, tone, style }: { text: ReactNode; who?: string; mine?: boolean; start?: number; size?: number; tone?: "promise" | "dim"; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, start, 16, 200);
  const bg = tone === "promise" ? C.accent : mine ? C.ink : C.paperLo;
  const fg = tone === "promise" || mine ? C.paperHi : C.ink;
  return (
    <div
      style={{
        alignSelf: mine ? "flex-end" : "flex-start",
        maxWidth: "88%",
        padding: "0.42em 0.7em",
        borderRadius: mine ? "1em 0.2em 1em 1em" : "0.2em 1em 1em 1em",
        background: bg,
        color: fg,
        fontFamily: F.display,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.2,
        boxShadow: tone === "promise" ? SHADOW(5) : undefined,
        transform: `translateY(${(1 - s) * 60}px) scale(${0.85 + s * 0.15})`,
        opacity: Math.min(1, s * 2),
        transformOrigin: mine ? "100% 100%" : "0 100%",
        ...style,
      }}
    >
      {who && !mine && <div style={{ fontFamily: F.mono, fontSize: size * 0.55, color: C.accent, fontWeight: 700, marginBottom: 4 }}>{who}</div>}
      {text}
    </div>
  );
}

/** Semicircle gauge; `value` is 0–1 and should already be animated by the caller. */
export function Gauge({ value, size = 420, label }: { value: number; size?: number; label?: ReactNode }) {
  const frame = useCurrentFrame();
  const r = 42;
  const len = Math.PI * r;
  const ang = -90 + value * 180 + drift(frame, 1.2, 9);
  return (
    <div style={{ position: "relative", width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 100 60" width={size} height={size * 0.6} style={{ overflow: "visible" }}>
        <path d="M8 52 A42 42 0 0 1 92 52" fill="none" stroke={C.ink3} strokeWidth={9} strokeLinecap="round" />
        <path
          d="M8 52 A42 42 0 0 1 92 52"
          fill="none"
          stroke={mix(value, C.ink, C.accent)}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - value)}
        />
        <g transform={`rotate(${ang} 50 52)`}>
          <line x1="50" y1="52" x2="50" y2="18" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
        </g>
        <circle cx="50" cy="52" r="5" fill={C.ink} />
      </svg>
      {label && <div style={{ position: "absolute", left: 0, right: 0, bottom: -size * 0.08, textAlign: "center" }}>{label}</div>}
    </div>
  );
}

/** Seamless horizontal loop. The only linear motion allowed. */
export function Marquee({ children, speed = 0.12, style }: { children: ReactNode; speed?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const x = -((frame * speed) % 50);
  return (
    <div style={{ overflow: "hidden", width: "100%", ...style }}>
      <div style={{ display: "flex", width: "max-content", transform: `translateX(${x}%)` }}>
        <div style={{ display: "flex" }}>{children}</div>
        <div style={{ display: "flex" }}>{children}</div>
      </div>
    </div>
  );
}

export function Chip({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 30px",
        marginRight: 22,
        borderRadius: 999,
        border: `4px solid ${C.ink}`,
        background: C.paperHi,
        boxShadow: SHADOW(5),
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: 34,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Paper card with the site's hard ink shadow. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: C.paperHi, border: `5px solid ${C.ink}`, borderRadius: 36, boxShadow: SHADOW(10), ...style }}>
      {children}
    </div>
  );
}

/** Mouse cursor gliding along curved segments between waypoints, with click ripples. */
export function FakeCursor({ points, clicks = [], scale = 1.6 }: { points: { x: number; y: number; at: number; curve?: number }[]; clicks?: number[]; scale?: number }) {
  const frame = useCurrentFrame();
  let x = points[0].x;
  let y = points[0].y;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (frame >= a.at) {
      const t = reveal(frame, a.at, b.at - a.at);
      const k = b.curve ?? 0.25;
      const mx = (a.x + b.x) / 2 - (b.y - a.y) * k;
      const my = (a.y + b.y) / 2 + (b.x - a.x) * k;
      x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x;
      y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y;
    }
  }
  const pressing = clicks.some((c) => frame >= c && frame < c + 5);
  return (
    <>
      {clicks.map((c) => {
        const t = reveal(frame, c, 16);
        if (frame < c || t >= 1) return null;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: x - 60,
              top: y - 60,
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: `5px solid ${C.accent}`,
              transform: `scale(${0.2 + t})`,
              opacity: 1 - t,
            }}
          />
        );
      })}
      <svg
        viewBox="0 0 24 24"
        width={36 * scale}
        height={36 * scale}
        style={{ position: "absolute", left: x - 6, top: y - 4, transform: `scale(${pressing ? 0.85 : 1})`, transformOrigin: "10% 10%", overflow: "visible", filter: "drop-shadow(3px 4px 0 rgba(30,27,23,.35))" }}
      >
        <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.5 L17.5 13.5 Z" fill={C.paperHi} stroke={C.ink} strokeWidth={1.8} strokeLinejoin="round" />
      </svg>
    </>
  );
}
