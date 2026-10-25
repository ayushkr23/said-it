import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, SHADOW } from "../brand";
import { Doodle } from "../motion/Draw";
import { Mascot } from "../motion/Mascot";
import { CameraRig } from "../motion/Stage";
import { CountUp, Hand } from "../motion/Text";
import { Badge, Bubble, Card, FakeCursor, Gauge } from "../motion/UI";
import { pop, reveal, useLayout } from "../motion/core";
import { voBeat } from "../script";

const at = (word: string, fallback: number, nth = 0) => voBeat("demo", word, fallback, nth);

const B = {
  pull: at("pull", 25),
  other: at("Other", 71),
  vanish: at("vanish", 111),
  promises: at("promises", 140),
  stamped: at("stamped", 162),
  pops: at("pops", 200),
};

const GRAB = B.pull - 3;
const DRAGGED = GRAB + 28;
const TOGGLE = DRAGGED + 14;

const ROWS = [
  { who: "Riya", text: "ER diagram tu bana de na?" },
  { text: "haan kal bhej dunga", mine: true, badge: "9d late" },
  { who: "Kabir", text: "lab ka slot kisi ne book kiya?" },
  { text: "let me check with sir", mine: true, badge: "4d late" },
  { who: "Kabir", text: "bro mera charger 😭" },
  { text: "charger kal pakka", mine: true, badge: "3d late" },
];

/**
 * ~43–51s. A cursor pulls the site's lever and flips "only my lines". Other people's
 * rows collapse away, your promises get stamped with a little shake, the gauge swings
 * to 3 late, and the reply pops out with a sparkle burst.
 * Techniques: fake cursor drag + click, layout collapse, stamp shake, gauge tween, burst.
 */
export function S5Demo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, vertical, pad } = useLayout();

  const L = vertical
    ? { win: { x: pad, y: 200, w: w - pad * 2, h: 1250 }, track: { x: 150, y: 400, h: 380 }, toggle: { x: 140, y: 870 }, chat: { x: 330, y: 300, w: w - pad - 330 - 40 }, gauge: { x: 150, y: 1000, size: 330 }, reply: { x: 520, y: 1080, w: w - pad - 520 - 40 }, size: 28 }
    : { win: { x: pad, y: 110, w: w - pad * 2, h: 770 }, track: { x: 250, y: 250, h: 430 }, toggle: { x: 220, y: 760 }, chat: { x: 470, y: 190, w: 700 }, gauge: { x: 1250, y: 200, size: 420 }, reply: { x: 1230, y: 560, w: 520 }, size: 32 };

  const knobTop = L.track.y + 40;
  const knobBottom = L.track.y + L.track.h - 40;
  const knobX = L.track.x + 30;
  const pullT = reveal(frame, GRAB, DRAGGED - GRAB);
  const knobY = knobTop + (knobBottom - knobTop) * pullT;
  const toggled = reveal(frame, TOGGLE + 2, 8);

  const stamps = [0, 1, 2].map((k) => B.stamped + k * 7);
  const shake = stamps.reduce((s, t) => (frame >= t ? s + Math.sin(frame * 2.6) * 12 * Math.exp(-(frame - t) / 4) : s), 0);
  const gaugeV = interpolate(pop(frame, fps, B.promises, 12, 120), [0, 1], [0, 0.75]);
  const reply = pop(frame, fps, B.pops, 12, 200);

  return (
    <AbsoluteFill>
      <CameraRig keys={[{ at: 0, scale: 1.04 }, { at: B.vanish, scale: 1 }, { at: B.pops + 20, scale: 1.04, x: vertical ? 0 : -30 }]}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
          <Card style={{ position: "absolute", left: L.win.x, top: L.win.y, width: L.win.w, height: L.win.h }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 26px", borderBottom: `4px solid ${C.ink}` }}>
              {[C.accent, C.fur, C.paperLo].map((c) => (
                <span key={c} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: `3px solid ${C.ink}` }} />
              ))}
              <span style={{ marginLeft: 18, fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: C.ink2 }}>saidit.local / the lever</span>
            </div>
          </Card>

          {/* Lever */}
          <div style={{ position: "absolute", left: L.track.x, top: L.track.y, width: 60, height: L.track.h, borderRadius: 30, border: `5px solid ${C.ink}`, background: C.paperLo, overflow: "hidden" }}>
            <div style={{ width: "100%", height: knobY - L.track.y, background: C.accent }} />
          </div>
          <div style={{ position: "absolute", left: knobX - 55, top: knobY - 55, width: 110, height: 110, borderRadius: "50%", background: C.ink, border: `6px solid ${C.ink}`, boxShadow: SHADOW(6, C.accent), transform: `scale(${frame >= GRAB && frame < DRAGGED + 4 ? 0.92 : 1})` }} />
          <div style={{ position: "absolute", left: L.track.x - 30, top: L.track.y - 80, transform: "rotate(-6deg)" }}>
            <Hand style={{ fontSize: 52 }}>{pullT > 0.95 ? "pulled!" : "pull me"}</Hand>
          </div>

          {/* Toggle */}
          <div style={{ position: "absolute", left: L.toggle.x, top: L.toggle.y, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 110, height: 58, borderRadius: 29, border: `5px solid ${C.ink}`, background: toggled > 0.5 ? C.accent : C.paperLo, position: "relative" }}>
              <div style={{ position: "absolute", top: 5, left: 5 + toggled * 52, width: 38, height: 38, borderRadius: "50%", background: C.paperHi, border: `4px solid ${C.ink}` }} />
            </div>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26 }}>only my lines</span>
          </div>

          {/* Chat */}
          <div style={{ position: "absolute", left: L.chat.x, top: L.chat.y, width: L.chat.w, display: "flex", flexDirection: "column" }}>
            {ROWS.map((r, k) => {
              const go = r.mine ? 0 : reveal(frame, B.other + k * 6, 22);
              const promise = r.mine && frame >= B.promises + k * 3;
              const mineIdx = Math.floor(k / 2);
              return (
                <div key={k} style={{ display: "flex", flexDirection: "row", justifyContent: r.mine ? "flex-end" : "flex-start", alignItems: "center", gap: 18, height: (1 - go) * (vertical ? 118 : 104), opacity: 1 - go, transform: `translateX(${go * -120}px)`, marginBottom: 12 * (1 - go) }}>
                  {r.mine && frame >= stamps[mineIdx] && <Badge text={r.badge!} start={stamps[mineIdx]} size={26} />}
                  <Bubble text={r.text} who={r.who} mine={r.mine} start={4 + k * 4} size={L.size} tone={promise ? "promise" : undefined} style={{ alignSelf: "center" }} />
                </div>
              );
            })}
          </div>

          {/* Gauge + reply */}
          <div style={{ position: "absolute", left: L.gauge.x, top: L.gauge.y }}>
            <Gauge
              value={gaugeV}
              size={L.gauge.size}
              label={
                <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 52 }}>
                  <CountUp to={3} start={B.promises} duration={24} style={{ color: C.accent }} /> late
                </span>
              }
            />
          </div>
          <div style={{ position: "absolute", left: L.reply.x, top: L.reply.y, width: L.reply.w, display: "flex", flexDirection: "column", transform: `scale(${reply}) rotate(${(1 - reply) * -8}deg)`, transformOrigin: "100% 100%", opacity: Math.min(1, reply * 3) }}>
            <Bubble text="Sorry yaar, charger kal subah 10 baje 🚀" mine tone="promise" size={L.size} start={B.pops} />
          </div>
          {frame >= B.pops && (
            <>
              <Doodle kind="burst" x={L.reply.x + L.reply.w - 90} y={L.reply.y - 110} size={150} start={B.pops + 2} duration={10} color={C.accent} width={7} />
              <Doodle kind="sparkle" x={L.reply.x - 60} y={L.reply.y - 60} size={80} start={B.pops + 6} color={C.accent} />
            </>
          )}

          <FakeCursor
            points={[
              { x: w - 200, y: h + 60, at: 0 },
              { x: knobX, y: knobTop, at: GRAB },
              { x: knobX, y: knobBottom, at: DRAGGED, curve: 0 },
              { x: L.toggle.x + 55, y: L.toggle.y + 29, at: TOGGLE },
              { x: L.reply.x + L.reply.w * 0.6, y: L.reply.y + 140, at: B.pops - 4 },
            ]}
            clicks={[GRAB, TOGGLE]}
          />
        </div>
      </CameraRig>

      <Mascot
        x={vertical ? w - 290 : w - pad - 220}
        y={vertical ? 1430 - 210 : h - 320}
        size={vertical ? 190 : 210}
        enter={6}
        moods={[
          { at: 0, mood: "idle" },
          { at: GRAB, mood: "surprised" },
          { at: B.stamped, mood: "point" },
          { at: B.pops, mood: "celebrate" },
        ]}
      />
    </AbsoluteFill>
  );
}
