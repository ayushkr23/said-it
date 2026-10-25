import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { drift, pop } from "./core";

export type Mood = "idle" | "wink" | "point" | "panic" | "celebrate" | "wave" | "sleepy" | "happy" | "surprised";

type Pose = { left: number; right: number; eyes: "open" | "happy" | "wink" | "wide" | "sleepy"; mouth: "smile" | "grin" | "o" | "flat" };

/** Arm angles in degrees; 0 hangs straight down, -90 points right, 180 is straight up. */
const POSES: Record<Mood, Pose> = {
  idle: { left: 18, right: -18, eyes: "open", mouth: "smile" },
  wink: { left: 18, right: -150, eyes: "wink", mouth: "grin" },
  point: { left: 18, right: -98, eyes: "open", mouth: "grin" },
  panic: { left: 160, right: -160, eyes: "wide", mouth: "o" },
  celebrate: { left: 150, right: -150, eyes: "happy", mouth: "grin" },
  wave: { left: 18, right: -150, eyes: "happy", mouth: "grin" },
  sleepy: { left: 30, right: -30, eyes: "sleepy", mouth: "flat" },
  happy: { left: 24, right: -24, eyes: "happy", mouth: "grin" },
  surprised: { left: 60, right: -60, eyes: "wide", mouth: "o" },
};

type Props = {
  /** Mood schedule in scene frames, e.g. [{ at: 0, mood: "idle" }, { at: 40, mood: "panic" }]. */
  moods: { at: number; mood: Mood }[];
  size?: number;
  x: number;
  y: number;
  /** Frame the mascot pops in. */
  enter?: number;
  flip?: boolean;
  style?: CSSProperties;
};

/** The sloth. Always breathing and blinking, and every mood change springs between poses. */
export function Mascot({ moods, size = 320, x, y, enter = 0, flip, style }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Math.max(0, moods.findLastIndex((m) => frame >= m.at));
  const cur = moods[idx];
  const prev = moods[Math.max(0, idx - 1)];
  const k = idx === 0 ? 1 : pop(frame, fps, cur.at, 12, 200);
  const A = POSES[prev.mood];
  const B = POSES[cur.mood];
  const mood = cur.mood;

  const wave = mood === "wave" || mood === "wink" ? drift(frame, 22, 14) : 0;
  const flail = mood === "panic" ? drift(frame, 26, 6) : mood === "celebrate" ? drift(frame, 14, 10) : 0;
  const left = interpolate(k, [0, 1], [A.left, B.left]) + (mood === "panic" || mood === "celebrate" ? -flail : 0);
  const right = interpolate(k, [0, 1], [A.right, B.right]) + wave + flail;

  const enterS = pop(frame, fps, enter, 11, 180);
  const breathe = 1 + drift(frame, 0.018, 50);
  const bounce = mood === "celebrate" ? -Math.abs(drift(frame, 26, 22)) : mood === "panic" ? drift(frame, 4, 3) : drift(frame, 4, 60);
  const shakeX = mood === "panic" ? drift(frame, 5, 2.2) : 0;
  const tilt = mood === "sleepy" ? drift(frame, 5, 80) - 6 : mood === "point" ? -5 : drift(frame, 2, 70);

  const blink = frame % 72 > 68;
  const eyes = blink && B.eyes === "open" ? "blink" : B.eyes;

  const arm = (side: "l" | "r", deg: number) => (
    <g transform={`translate(${side === "l" ? 46 : 114} 122) rotate(${deg})`}>
      <rect x={-9} y={-4} width={18} height={50} rx={9} fill={C.fur} stroke={C.ink} strokeWidth={3.2} />
      <path d="M-6 44 l-2 10 M0 46 l0 11 M6 44 l2 10" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    </g>
  );

  const eye = (cx: number, i: number) => {
    if (eyes === "happy") return <path key={cx} d={`M${cx - 7} 72 q7 -8 14 0`} stroke={C.paperHi} strokeWidth={3.4} fill="none" strokeLinecap="round" />;
    if ((eyes === "wink" && i === 1) || eyes === "blink") return <path key={cx} d={`M${cx - 7} 70 h14`} stroke={C.paperHi} strokeWidth={3.4} strokeLinecap="round" />;
    const r = eyes === "wide" ? 8.5 : 6.5;
    return (
      <g key={cx}>
        <circle cx={cx} cy={70} r={r} fill={C.paperHi} />
        <circle cx={cx + drift(frame, 1.6, 120)} cy={70 + (eyes === "wide" ? 0 : 0.5)} r={eyes === "wide" ? 3.4 : 3.6} fill={C.ink} />
        {eyes === "sleepy" && <rect x={cx - 9} y={61} width={18} height={10} fill={C.ink} />}
      </g>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size * 1.06,
        transform: `translate(${shakeX}px, ${bounce + (1 - enterS) * size * 0.6}px) scale(${enterS * (flip ? -1 : 1)}, ${enterS}) rotate(${tilt}deg)`,
        transformOrigin: "50% 90%",
        ...style,
      }}
    >
      <svg viewBox="0 0 160 170" width={size} height={size * 1.06} style={{ overflow: "visible" }}>
        <g transform={`translate(80 160) scale(${breathe}) translate(-80 -160)`}>
          <ellipse cx="80" cy="140" rx="40" ry="28" fill={C.fur} stroke={C.ink} strokeWidth={3.2} />
          {arm("l", left)}
          {arm("r", right)}
          <path d="M80 26c25 0 46 18 46 45s-19 47-46 47S34 98 34 71 55 26 80 26z" fill={C.fur} stroke={C.ink} strokeWidth={3.2} strokeLinejoin="round" />
          <path d="M42 54c4-4 8-6 10-5M118 54c-4-4-8-6-10-5" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <ellipse cx="80" cy="78" rx="34" ry="28" fill={C.paperHi} stroke={C.ink} strokeWidth={2.4} />
          <path d="M47 68c6-8 18-10 24-2 3 5-2 14-10 15-9 1-17-5-14-13z" fill={C.ink} />
          <path d="M113 68c-6-8-18-10-24-2-3 5 2 14 10 15 9 1 17-5 14-13z" fill={C.ink} />
          {[60, 100].map(eye)}
          <ellipse cx="80" cy="86" rx="7" ry="5" fill={C.ink} />
          {B.mouth === "o" ? (
            <ellipse cx="80" cy="99" rx="4.5" ry={5.5 + drift(frame, 1, 8)} fill={C.ink} />
          ) : B.mouth === "flat" ? (
            <path d="M73 97 h14" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" />
          ) : (
            <path d={B.mouth === "grin" ? "M69 95q11 12 22 0" : "M71 97q9 6 18 0"} stroke={C.ink} strokeWidth={2.8} fill="none" strokeLinecap="round" />
          )}
          <circle cx="50" cy="92" r="5" fill={C.accent} opacity={0.4} />
          <circle cx="110" cy="92" r="5" fill={C.accent} opacity={0.4} />
          {mood === "panic" && (
            <g>
              {[0, 1].map((i) => {
                const t = ((frame + i * 9) % 18) / 18;
                return <path key={i} d={`M${124 + i * 8} ${40 + t * 30} q4 6 0 10 q-4 -4 0 -10z`} fill="#7ab8e8" stroke={C.ink} strokeWidth={1.5} opacity={1 - t} />;
              })}
            </g>
          )}
          {mood === "sleepy" && (
            <text x={130 + drift(frame, 4, 40)} y={30 - ((frame % 60) / 60) * 16} fontFamily={F.hand} fontSize={26} fontWeight={700} fill={C.accent} opacity={1 - (frame % 60) / 60}>
              z
            </text>
          )}
        </g>
      </svg>
      {mood === "celebrate" && <Confetti />}
    </div>
  );
}

function Confetti() {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const t = ((frame + i * 7) % 40) / 40;
        const a = (i / 14) * Math.PI * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "20%",
              width: 14,
              height: 22,
              borderRadius: 3,
              background: i % 3 === 0 ? C.ink : C.accent,
              transform: `translate(${Math.cos(a) * 220 * t}px, ${Math.sin(a) * 160 * t + t * t * 160}px) rotate(${t * 540 + i * 30}deg)`,
              opacity: 1 - t,
            }}
          />
        );
      })}
    </>
  );
}
