import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../brand";
import { captionWords, TIMED } from "../script";
import { useLayout } from "./core";

const LINES = TIMED.flatMap((s) => {
  const words = captionWords(s);
  const chunks: (typeof words)[] = [];
  let cur: typeof words = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 7 || /[.?!]$/.test(w.word)) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  return chunks;
});

/** Word-by-word highlighted subtitles, bottom centre, ink pill on paper for AA contrast. */
export function Captions() {
  const frame = useCurrentFrame();
  const { vertical, body } = useLayout();
  const line = LINES.find((l) => frame >= l[0].from - 2 && frame < l[l.length - 1].to + 6);
  if (!line) return null;
  const inT = interpolate(frame, [line[0].from - 2, line[0].from + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: vertical ? 260 : 64, pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: vertical ? 940 : 1500,
          padding: "14px 30px 18px",
          borderRadius: 26,
          background: "rgba(30,27,23,0.92)",
          color: C.paperHi,
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: Math.max(48, body - 2),
          lineHeight: 1.18,
          textAlign: "center",
          letterSpacing: "-0.01em",
          transform: `translateY(${(1 - inT) * 14}px)`,
          opacity: inT,
        }}
      >
        {line.map((w, i) => {
          const active = frame >= w.from && frame < w.to;
          const said = frame >= w.to;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                padding: "0 0.14em",
                margin: "0 0.02em",
                borderRadius: 10,
                background: active ? C.accent : "transparent",
                color: said || active ? C.paperHi : "rgba(251,247,239,0.55)",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
