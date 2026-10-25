import type { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { reveal } from "./core";

type SplitProps = {
  text: string;
  by?: "words" | "chars";
  start?: number;
  stagger?: number;
  duration?: number;
  style?: CSSProperties;
  /** Frame at which the text masks back out downward (optional). */
  exitAt?: number;
};

/**
 * Mask-reveals text upward per word or per char. "\n" breaks lines; wrap a word in
 * _underscores_ to paint it in the accent colour.
 */
export function SplitText({ text, by = "words", start = 0, stagger, duration = 22, style, exitAt }: SplitProps) {
  const frame = useCurrentFrame();
  const step = stagger ?? (by === "chars" ? 1.2 : 3);
  let i = 0;
  return (
    <div style={{ fontFamily: F.display, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.98, color: C.ink, ...style }}>
      {text.split("\n").map((line, li) => (
        <div key={li} style={{ display: "block" }}>
          {line.split(" ").map((raw, wi, arr) => {
            const accent = /^_.*_[.,!?]?$/.test(raw);
            const word = raw.replace(/_/g, "");
            const parts = by === "chars" ? [...word] : [word];
            return (
              <span key={wi} style={{ display: "inline-block", whiteSpace: "pre", color: accent ? C.accent : undefined, fontStyle: accent ? "italic" : undefined }}>
                {parts.map((p, pi) => {
                  const t = reveal(frame, start + i++ * step, duration);
                  const out = exitAt === undefined ? 0 : reveal(frame, exitAt + (i - 1) * step * 0.5, duration * 0.7);
                  return (
                    <span key={pi} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0.06em 0.03em 0.12em", margin: "-0.06em -0.03em -0.12em" }}>
                      <span
                        style={{
                          display: "inline-block",
                          transform: `translateY(${(1 - t) * 112 + out * 112}%) rotate(${(1 - t) * 6}deg)`,
                          transformOrigin: "0 100%",
                        }}
                      >
                        {p}
                      </span>
                    </span>
                  );
                })}
                {wi < arr.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Eased number tween. */
export function CountUp({ from = 0, to, start = 0, duration = 40, decimals = 0, prefix = "", suffix = "", style }: {
  from?: number;
  to: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const v = from + (to - from) * reveal(frame, start, duration);
  const txt = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-IN");
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{prefix + txt + suffix}</span>;
}

/** Types text in at `cps` characters per second with a blinking caret. */
export function TypeWriter({ text, start = 0, cps = 26, style, caret = true }: { text: string; start?: number; cps?: number; style?: CSSProperties; caret?: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - start) / fps) * cps));
  const done = n >= text.length;
  const on = Math.floor(frame / 8) % 2 === 0 || !done;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {caret && frame >= start && (
        <span style={{ display: "inline-block", width: "0.08em", height: "1em", marginLeft: "0.06em", background: C.accent, verticalAlign: "-0.12em", opacity: on ? 1 : 0 }} />
      )}
    </span>
  );
}

/** Handwritten note with a tape strip that pops in. */
export function Hand({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return <span style={{ fontFamily: F.hand, fontWeight: 700, color: C.accent, lineHeight: 1, ...style }}>{children}</span>;
}
