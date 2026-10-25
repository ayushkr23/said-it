import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { Doodle, DrawPath, DOODLES } from "../motion/Draw";
import { Mascot } from "../motion/Mascot";
import { CameraRig } from "../motion/Stage";
import { CountUp, SplitText } from "../motion/Text";
import { Badge } from "../motion/UI";
import { pop, reveal, useLayout } from "../motion/core";
import { COPY, voBeat } from "../script";

/**
 * 0–5s. Question masks in word by word, a counter slams to 6, "1 kept" gets circled,
 * then a glitch and a squash cut into the title.
 * Techniques: mask reveal, count-up, squash & stretch, path draw, glitch.
 */
export function S1ColdOpen() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const { vertical, pad, w, h } = useLayout();
  const copy = COPY.cold;

  const SIX = voBeat("cold", "Six", 72);
  const ONE = voBeat("cold", "You", 96, 1);
  const KEPT = voBeat("cold", "kept", 108);

  const land = pop(frame, fps, SIX, 9, 320);
  const squashY = frame < SIX ? 1 : interpolate(land, [0, 0.5, 1], [1.25, 0.82, 1]);
  const squashX = frame < SIX ? 1 : interpolate(land, [0, 0.5, 1], [0.85, 1.14, 1]);

  const glitch = frame >= D - 26 && frame < D - 16;
  const gx = glitch ? (random(`g${frame}`) - 0.5) * 40 : 0;
  const out = reveal(frame, D - 14, 14);

  const numSize = vertical ? 520 : 470;

  return (
    <AbsoluteFill style={{ transform: `scale(${1 + out * 0.3}, ${1 - out * 0.85})`, transformOrigin: "50% 100%" }}>
      <CameraRig keys={[{ at: 0, scale: 1.04 }, { at: 140, scale: 1 }]}>
        <Doodle kind="sparkle" x={w - pad - 120} y={pad - 30} size={110} start={6} color={C.accent} />
        <Doodle kind="star" x={pad - 50} y={h - pad - 260} size={80} start={14} />
        <Doodle kind="squiggle" x={w * 0.45} y={vertical ? h * 0.2 : h * 0.12} size={150} start={20} color={C.ink3} width={6} />

        <AbsoluteFill
          style={{
            padding: pad,
            paddingTop: vertical ? 220 : pad,
            filter: glitch ? `drop-shadow(${12 + gx}px 0 0 ${C.accent}) drop-shadow(${-10 - gx}px 0 0 ${C.ink3})` : undefined,
            transform: glitch ? `translateX(${gx}px) skewX(${gx * 0.3}deg)` : undefined,
          }}
        >
          <SplitText text={vertical ? "How many\npromises did you\nmake _this_ _week?_" : copy.question.replace(" did", "\ndid")} start={4} stagger={4} style={{ fontSize: vertical ? 104 : 104, maxWidth: vertical ? 900 : 1100 }} />

          <div
            style={{
              position: "absolute",
              left: vertical ? pad : w * 0.52,
              top: vertical ? 760 : 300,
              display: "flex",
              alignItems: "flex-end",
              gap: 30,
            }}
          >
            <div style={{ transform: `scale(${squashX}, ${squashY})`, transformOrigin: "50% 100%", opacity: reveal(frame, SIX - 32, 6) }}>
              <CountUp to={copy.count} start={SIX - 32} duration={32} style={{ fontFamily: F.display, fontWeight: 800, fontSize: numSize, lineHeight: 0.8, color: C.accent, letterSpacing: "-0.06em" }} />
            </div>
            <div style={{ paddingBottom: 30 }}>
              <SplitText text={copy.countLabel} start={SIX - 2} style={{ fontSize: 84 }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, marginTop: 18 }}>
                <div style={{ position: "relative" }}>
                  <SplitText text={String(copy.kept)} start={ONE} style={{ fontSize: 130 }} />
                  <svg viewBox="0 0 100 100" style={{ position: "absolute", left: -60, top: -50, width: 200, height: 220, overflow: "visible" }}>
                    <DrawPath d={DOODLES.circle} start={ONE + 6} duration={16} stroke={C.accent} width={4} />
                  </svg>
                </div>
                <Badge text={copy.keptLabel} start={KEPT} size={46} />
              </div>
            </div>
          </div>
        </AbsoluteFill>

        <Mascot
          x={vertical ? w - 420 : w - 400}
          y={vertical ? h - 760 : h - 420}
          size={vertical ? 320 : 300}
          enter={18}
          moods={[
            { at: 0, mood: "idle" },
            { at: SIX - 8, mood: "surprised" },
            { at: ONE + 4, mood: "panic" },
          ]}
        />
      </CameraRig>
    </AbsoluteFill>
  );
}
