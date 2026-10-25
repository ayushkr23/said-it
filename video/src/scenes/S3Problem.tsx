import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../brand";
import { Doodle } from "../motion/Draw";
import { Mascot } from "../motion/Mascot";
import { CameraRig } from "../motion/Stage";
import { CountUp, Hand, SplitText } from "../motion/Text";
import { Badge, Bubble, Card } from "../motion/UI";
import { drift, reveal, useLayout } from "../motion/core";
import { COPY, voBeat } from "../script";

const SUMMARIES = voBeat("problem", "Summaries", 160);
const SAID = voBeat("problem", "Said", 262, 1);
const SCAN_START = SUMMARIES - 10;
const SCAN_END = SCAN_START + 90;
/** Your three lines pop in as the voice says them; other people's rows arrive first. */
const MINE_AT = [voBeat("problem", "Kal", 17), voBeat("problem", "Let", 35), voBeat("problem", "Tomorrow", 53)];
const PROMISES = [
  { what: "send ER diagram", to: "Riya", badge: "9d late" },
  { what: "check with sir", to: "Riya", badge: "4d late" },
  { what: "return charger", to: "Kabir", badge: "3d late" },
];

/**
 * 9–20s. Messy chat on the left with question marks and a ticking scroll counter.
 * A scan line sweeps down: other people's rows strike out, your promises flip and land
 * on the clean right panel with stamped badges. Slow camera push-in throughout.
 * Techniques: camera push, scan sweep, 3D flip, badge pop, count-up, mask reveal.
 */
export function S3Problem() {
  const frame = useCurrentFrame();
  const { vertical, pad, w, h } = useLayout();
  const copy = COPY.problem;
  const rows = copy.rows;

  const panelW = vertical ? w - pad * 2 : (w - pad * 2 - 70) / 2;
  const left = { x: pad, y: vertical ? 300 : 190, w: panelW, h: vertical ? 650 : 720 };
  const right = vertical ? { x: pad, y: 1010, w: panelW, h: 470 } : { x: pad + panelW + 70, y: 190, w: panelW, h: 720 };

  const scanY = interpolate(frame, [SCAN_START, SCAN_END], [0, left.h - 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scanning = frame >= SCAN_START - 6 && frame <= SCAN_END + 10;
  const passed = (i: number) => SCAN_START + ((i + 0.6) / rows.length) * (SCAN_END - SCAN_START);
  const mineIdx = rows.map((r, i) => (r.mine ? i : -1)).filter((i) => i >= 0);
  const ticking = frame > SCAN_START ? Math.floor((frame - SCAN_START) / 3) : 0;
  const rowStart = (i: number) => (rows[i].mine ? MINE_AT[mineIdx.indexOf(i)] : 10 + (i / 2) * 14);

  return (
    <AbsoluteFill>
      <CameraRig
        keys={[
          { at: 0, scale: 1, x: 0 },
          { at: SCAN_END - 10, scale: 1.03, x: vertical ? 0 : 20 },
          { at: SAID + 58, scale: 1.05, x: vertical ? 0 : -20, y: vertical ? -40 : 10 },
        ]}
      >
        {/* Headline swaps with the voiceover. */}
        <div style={{ position: "absolute", left: pad, right: pad, top: vertical ? 110 : 70 }}>
          {frame < SUMMARIES && <SplitText text={"Every group chat _buries_ them."} start={6} exitAt={SUMMARIES - 20} style={{ fontSize: vertical ? 70 : 76 }} />}
          {frame >= SUMMARIES - 10 && frame < SAID && (
            <SplitText text={vertical ? "Summaries tell you what\n_everyone_ _else_ said." : "Summaries tell you what _everyone_ _else_ said."} start={SUMMARIES} exitAt={SAID - 16} style={{ fontSize: vertical ? 64 : 76 }} />
          )}
          {frame >= SAID - 7 && <SplitText text={"Said It reads what _you_ said."} start={SAID} style={{ fontSize: vertical ? 70 : 76 }} />}
        </div>

        {/* BEFORE */}
        <Card style={{ position: "absolute", left: left.x, top: left.y, width: left.w, height: left.h, padding: 34, overflow: "hidden", transform: `rotate(${-0.8 + drift(frame, 0.3, 90)}deg)` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: vertical ? 6 : 10 }}>
            {rows.map((r, i) => {
              const hit = frame >= passed(i);
              const flip = r.mine ? reveal(frame, passed(i), 14) : 0;
              const dim = !r.mine && hit ? reveal(frame, passed(i), 10) : 0;
              const tilt = (i % 2 ? 1 : -1) * (1.6 - flip * 1.6);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", justifyContent: "center", perspective: 900, position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      transform: `rotateX(${flip * 360}deg) rotate(${tilt}deg) scale(${1 + Math.sin(flip * Math.PI) * 0.06})`,
                      opacity: 1 - dim * 0.75,
                    }}
                  >
                    <Bubble text={r.text} mine={r.mine} who={r.mine ? undefined : r.who} start={rowStart(i)} size={vertical ? 38 : 32} tone={r.mine && flip > 0.5 ? "promise" : undefined} />
                  </div>
                  {!r.mine && (
                    <div style={{ position: "absolute", left: 0, top: "52%", height: 5, borderRadius: 3, background: C.accent, width: `${dim * 62}%` }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 92, borderTop: `4px solid ${C.ink}`, background: C.paper, display: "flex", alignItems: "center", gap: 18, padding: "0 34px" }}>
            <CountUp to={copy.counterTo} start={16} duration={130} style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 48, color: C.accent }} />
            {ticking > 0 && <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.accent }}>+{ticking}</span>}
            <span style={{ fontFamily: F.mono, fontSize: 28, color: C.ink2 }}>{copy.counterLabel}</span>
          </div>

          {scanning && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 34 + scanY - 120, height: 130, pointerEvents: "none" }}>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent, ${C.accentSoft})` }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: C.accent, boxShadow: `0 0 26px 6px ${C.accentSoft}` }} />
            </div>
          )}
        </Card>

        {/* Floating question marks over the mess, gone once scanned. */}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ opacity: 1 - reveal(frame, SCAN_END - 20, 20) }}>
            <Doodle kind="question" x={left.x + left.w - 120 - i * 170} y={left.y - 60 + (i % 2) * 40} size={84} start={30 + i * 10} color={C.accent} width={7} />
          </div>
        ))}

        <div style={{ position: "absolute", left: left.x + 30, top: left.y - 34, transform: "rotate(-3deg)" }}>
          <Hand style={{ fontSize: 50, background: C.paper, padding: "0 12px" }}>{copy.beforeLabel}</Hand>
        </div>

        {/* AFTER */}
        <Card style={{ position: "absolute", left: right.x, top: right.y, width: right.w, height: right.h, padding: 34, background: C.paperHi, transform: `rotate(${0.8 + drift(frame, 0.3, 110)}deg)` }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.ink2, marginBottom: 20, opacity: 0.6 + reveal(frame, SCAN_START, 20) * 0.4 }}>
            {frame < SCAN_START ? "waiting for a chat…" : "3 late · 0 for you to scroll"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: vertical ? 18 : 26 }}>
            {PROMISES.map((p, k) => {
              const at = passed(mineIdx[k]) + 6;
              const t = reveal(frame, at, 18);
              return (
                <div
                  key={p.what}
                  style={{
                    position: "relative",
                    padding: vertical ? "18px 24px" : "24px 28px",
                    borderRadius: 24,
                    border: `4px solid ${C.ink}`,
                    background: C.paper,
                    boxShadow: `${6 * t}px ${6 * t}px 0 ${C.ink}`,
                    transform: `translateX(${(1 - t) * (vertical ? 0 : -260)}px) translateY(${(1 - t) * (vertical ? -120 : 0)}px) rotate(${(1 - t) * -8}deg)`,
                    opacity: t,
                  }}
                >
                  <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: vertical ? 46 : 50, letterSpacing: "-0.02em" }}>{p.what}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 28, color: C.ink2 }}>to {p.to}</div>
                  {frame >= at + 6 && (
                    <div style={{ position: "absolute", right: 22, top: -22 }}>
                      <Badge text={p.badge} start={at + 6} size={30} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ position: "absolute", left: right.x + 30, top: right.y - 34, transform: "rotate(2deg)" }}>
          <Hand style={{ fontSize: 50, background: C.paper, padding: "0 12px" }}>{copy.afterLabel}</Hand>
        </div>

        <Mascot
          x={vertical ? w - 300 : w - pad - 260}
          y={vertical ? 860 : h - 330}
          size={vertical ? 230 : 240}
          enter={10}
          moods={[
            { at: 0, mood: "panic" },
            { at: SCAN_START - 10, mood: "surprised" },
            { at: SCAN_END - 10, mood: "point" },
            { at: SAID + 28, mood: "happy" },
          ]}
        />
      </CameraRig>
    </AbsoluteFill>
  );
}
