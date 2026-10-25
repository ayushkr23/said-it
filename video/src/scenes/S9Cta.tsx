import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, SHADOW } from "../brand";
import { Doodle, DrawPath, DOODLES } from "../motion/Draw";
import { Mascot } from "../motion/Mascot";
import { Hand, SplitText, TypeWriter } from "../motion/Text";
import { FakeCursor } from "../motion/UI";
import { drift, pop, reveal, REVEAL, useLayout } from "../motion/core";
import { BRIEF, voBeat } from "../script";

const at = (word: string, fallback: number, nth = 0) => voBeat("cta", word, fallback, nth);

const B = {
  said: at("Said", 8),
  go: at("Go", 33),
  runs: at("runs", 67),
  tonight: at("tonight", 99),
};
const HOVER = B.runs + 20;
const PRESS = B.tonight + 6;
const DONE = PRESS + 26;

/**
 * ~78–86s. Giant wordmark drawn in and pulled toward the cursor, "Go be lazy." scribbled
 * on, the CTA button runs the site's full micro-state cycle (wipe fill, arrow swap, press,
 * loading, success), the mascot waves, and an ink curtain closes the film.
 * Techniques: char reveal, magnetic pulse, button state machine, path draw, curtain wipe.
 */
export function S9Cta() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const { w, h, vertical } = useLayout();

  const markY = vertical ? 470 : 150;
  const btn = { w: vertical ? 820 : 760, h: 130, cx: w / 2, cy: vertical ? 1080 : 690 };

  const cursor = [
    { x: w + 80, y: btn.cy + 260, at: 0 },
    { x: w + 80, y: btn.cy + 260, at: B.runs + 2 },
    { x: btn.cx + 120, y: btn.cy + 20, at: HOVER },
    { x: btn.cx + 150, y: btn.cy + 30, at: PRESS - 2, curve: 0.05 },
  ];
  const near = reveal(frame, B.runs + 2, HOVER - B.runs - 2);

  const pulse = frame > B.said + 30 ? Math.sin((frame - B.said) / 9) * 0.018 : 0;
  const pull = near * 26;
  const markSize = vertical ? 250 : 300;
  const dot = pop(frame, fps, B.said + 18, 8, 300);

  const btnIn = pop(frame, fps, B.runs - 6, 13, 190);
  const fill = reveal(frame, HOVER - 2, 14);
  const arrow = reveal(frame, HOVER, 12);
  const press = frame >= PRESS && frame < PRESS + 6 ? 0.94 : 1;
  const loading = frame >= PRESS + 4 && frame < DONE;
  const success = frame >= DONE;

  const curtain = REVEAL(Math.min(1, Math.max(0, (frame - (D - 28)) / 24)));

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: markY, display: "flex", justifyContent: "center", alignItems: "flex-end", transform: `translateY(${pull}px) scale(${1 + pulse + near * 0.02})` }}>
        <SplitText text="Said It" by="chars" start={B.said} stagger={2.2} duration={18} style={{ fontSize: markSize, letterSpacing: "-0.06em" }} />
        <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: markSize, lineHeight: 0.98, color: C.accent, display: "inline-block", transform: `scale(${dot})`, transformOrigin: "50% 80%" }}>.</span>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: markY + (vertical ? 290 : 330), textAlign: "center", transform: `rotate(-3deg) scale(${pop(frame, fps, B.go, 12, 200)})` }}>
        <Hand style={{ fontSize: vertical ? 96 : 100 }}>Go be lazy.</Hand>
      </div>
      <svg viewBox="0 0 100 100" width={vertical ? 240 : 300} height={60} preserveAspectRatio="none" style={{ position: "absolute", left: w / 2 - (vertical ? 120 : 150), top: markY + (vertical ? 395 : 425), overflow: "visible" }}>
        <DrawPath d={DOODLES.squiggle} start={B.go + 12} duration={16} stroke={C.accent} width={6} />
      </svg>

      {/* CTA button with the website's micro-states. */}
      <div
        style={{
          position: "absolute",
          left: btn.cx - btn.w / 2,
          top: btn.cy - btn.h / 2,
          width: btn.w,
          height: btn.h,
          borderRadius: 999,
          border: `6px solid ${C.ink}`,
          background: C.paperHi,
          boxShadow: SHADOW(press < 1 ? 3 : 9),
          overflow: "hidden",
          transform: `translate(${near * 10}px, ${near * 6 + (press < 1 ? 6 : 0)}px) scale(${btnIn * press})`,
          opacity: Math.min(1, btnIn * 2),
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: success ? C.ink : C.accent, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }} />
        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 24, fontFamily: F.display, fontWeight: 800, fontSize: vertical ? 52 : 54, color: fill > 0.5 ? C.paperHi : C.ink }}>
          {success ? (
            <>
              <svg viewBox="0 0 100 100" width={64} height={64}>
                <DrawPath d={DOODLES.check} start={DONE} duration={12} stroke={C.paperHi} width={14} />
              </svg>
              see you tonight
            </>
          ) : loading ? (
            <svg viewBox="0 0 100 100" width={70} height={70} style={{ transform: `rotate(${(frame - PRESS) * 22}deg)` }}>
              <circle cx="50" cy="50" r="36" fill="none" stroke={C.paperHi} strokeWidth={12} strokeDasharray="150 300" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              {BRIEF.cta}
              <span style={{ position: "relative", display: "inline-block", width: 50, height: 50, overflow: "hidden" }}>
                <span style={{ position: "absolute", left: 0, top: -6, transform: `translateX(${arrow * 60}px)` }}>→</span>
                <span style={{ position: "absolute", left: 0, top: -6, transform: `translateX(${(arrow - 1) * 60}px)` }}>→</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: btn.cy + btn.h / 2 + 40, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: vertical ? 32 : 40, color: C.ink2 }}>
        <TypeWriter text={`${BRIEF.url} · open source · runs offline`} start={B.runs + 6} cps={34} caret={frame < DONE} />
      </div>

      <Doodle kind="sparkle" x={w / 2 + (vertical ? 300 : 520)} y={markY - 40} size={110} start={B.said + 18} color={C.accent} />
      <Doodle kind="star" x={vertical ? 110 : w / 2 - 640} y={vertical ? markY - 170 : markY + 60} size={80} start={B.said + 24} />
      {success && <Doodle kind="burst" x={btn.cx + btn.w / 2 - 70} y={btn.cy - btn.h - 40} size={150} start={DONE + 2} duration={10} color={C.accent} width={7} />}

      <Mascot
        x={vertical ? w - 300 : w - 400}
        y={vertical ? 1290 : h - 380}
        size={vertical ? 220 : 250}
        enter={B.go}
        moods={[
          { at: 0, mood: "wave" },
          { at: DONE, mood: "celebrate" },
          { at: D - 40, mood: "wave" },
        ]}
      />

      <FakeCursor points={cursor} clicks={[PRESS]} />

      {/* Curtain */}
      <AbsoluteFill style={{ background: C.ink, transform: `translateY(${(curtain - 1) * 100}%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: vertical ? 120 : 140, letterSpacing: "-0.05em", color: C.paperHi, opacity: reveal(frame, D - 12, 10), transform: `translateY(${drift(frame, 4, 40)}px)` }}>
          Said It<span style={{ color: C.accent }}>.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
