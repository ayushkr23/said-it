import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, SHADOW } from "../brand";
import { Doodle, DrawPath } from "../motion/Draw";
import { Mascot } from "../motion/Mascot";
import { CameraRig } from "../motion/Stage";
import { CountUp } from "../motion/Text";
import { Card, FakeCursor } from "../motion/UI";
import { pop, reveal, useLayout } from "../motion/core";
import { voBeat } from "../script";

const at = (word: string, fallback: number, nth = 0) => voBeat("tour", word, fallback, nth);

const B = {
  run: at("Run", 8),
  night: at("night", 79),
  six: at("Six", 156),
  switch: at("switch", 238),
  open: at("open", 265),
};

const TABS = ["Run it", "Night", "Details", "Open"];
const TAB_AT = [0, B.night - 6, B.six - 6, B.switch - 12];
const URLS = ["/run", "/#night", "/#details", "/#open"];

/**
 * ~51–61s. A browser mock of the site. The cursor clicks through four tabs as the voice
 * names them; a spring underline slides between tabs and each panel runs its own beat.
 * Techniques: sliding underline, panel slide, progress fill, timeline scrub, card flips, switch + lock draw.
 */
export function S6Tour() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, vertical, pad } = useLayout();

  const win = vertical ? { x: pad, y: 300, w: w - pad * 2, h: 960 } : { x: pad, y: 100, w: w - pad * 2, h: 790 };
  const tabW = vertical ? 200 : 230;
  const tabsY = win.y + 96;
  const tabX = (i: number) => win.x + 30 + i * (tabW + 10);

  const active = TAB_AT.reduce((n, t, i) => (frame >= t ? i : n), 0);
  const underX = tabX(0) + TAB_AT.slice(1).reduce((x, t) => x + pop(frame, fps, t, 16, 200), 0) * (tabW + 10);
  const content = { x: win.x + 40, y: tabsY + 100, w: win.w - 80, h: win.h - (tabsY - win.y) - 140 };

  return (
    <AbsoluteFill>
      <CameraRig keys={[{ at: 0, scale: 1.06 }, { at: 60, scale: 1 }, { at: B.open + 40, scale: 1.04, y: vertical ? -20 : 0 }]}>
        <Card style={{ position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 26px", borderBottom: `4px solid ${C.ink}` }}>
            {[C.accent, C.fur, C.paperLo].map((c) => (
              <span key={c} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: `3px solid ${C.ink}` }} />
            ))}
            <span style={{ marginLeft: 18, padding: "6px 18px", borderRadius: 999, background: C.paper, fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: C.ink2 }}>
              saidit.local{URLS[active]}
            </span>
          </div>
        </Card>

        {TABS.map((t, i) => (
          <div key={t} style={{ position: "absolute", left: tabX(i), top: tabsY, width: tabW, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: vertical ? 28 : 30, color: i === active ? C.ink : C.ink2, opacity: reveal(frame, 4 + i * 3, 12) }}>
            {t}
          </div>
        ))}
        <div style={{ position: "absolute", left: underX + 20, top: tabsY + 48, width: tabW - 40, height: 8, borderRadius: 4, background: C.accent }} />
        <div style={{ position: "absolute", left: win.x, top: tabsY + 70, width: win.w, height: 4, background: C.ink3 }} />

        {[RunPanel, NightPanel, DetailsPanel, OpenPanel].map((Panel, i) => {
          const enter = i === 0 ? reveal(frame, 0, 14) : reveal(frame, TAB_AT[i], 16);
          const exit = i < 3 ? reveal(frame, TAB_AT[i + 1], 12) : 0;
          if (enter <= 0 || exit >= 1) return null;
          return (
            <div key={i} style={{ position: "absolute", left: content.x, top: content.y, width: content.w, height: content.h, opacity: enter * (1 - exit), transform: `translateX(${(1 - enter) * 90 - exit * 90}px)` }}>
              <Panel t0={i === 0 ? B.run : TAB_AT[i] + 4} w={content.w} h={content.h} />
            </div>
          );
        })}

        <FakeCursor
          points={[
            { x: w + 40, y: h * 0.6, at: 0 },
            { x: tabX(0) + tabW * 0.6, y: tabsY + 70, at: 30 },
            { x: tabX(1) + tabW * 0.5, y: tabsY + 20, at: TAB_AT[1] },
            { x: tabX(2) + tabW * 0.5, y: tabsY + 20, at: TAB_AT[2] },
            { x: tabX(3) + tabW * 0.5, y: tabsY + 20, at: TAB_AT[3] },
            { x: content.x + content.w * 0.5, y: content.y + content.h * 0.45, at: B.switch + 2 },
          ]}
          clicks={[TAB_AT[1], TAB_AT[2], TAB_AT[3], B.switch + 2]}
        />
      </CameraRig>

      <Mascot
        x={vertical ? w - 280 : w - pad - 200}
        y={vertical ? 40 : h - 300}
        size={vertical ? 190 : 200}
        enter={8}
        moods={[
          { at: 0, mood: "happy" },
          { at: B.night, mood: "sleepy" },
          { at: B.six, mood: "point" },
          { at: B.open, mood: "wink" },
        ]}
      />
    </AbsoluteFill>
  );
}

type PanelProps = { t0: number; w: number; h: number };

function Title({ children }: { children: ReactNode }) {
  return <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 56, letterSpacing: "-0.03em", marginBottom: 26 }}>{children}</div>;
}

function RunPanel({ t0, w }: PanelProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = pop(frame, fps, t0 + 8, 12, 180);
  const fill = reveal(frame, t0 + 22, 46);
  return (
    <>
      <Title>Run it on your export</Title>
      <div style={{ height: 210, borderRadius: 26, border: `5px dashed ${C.ink}`, background: fill > 0 ? C.accentSoft : C.paper, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ transform: `translateY(${(1 - drop) * -160}px) rotate(${(1 - drop) * -12}deg)`, opacity: Math.min(1, drop * 2), padding: "16px 26px", borderRadius: 16, border: `4px solid ${C.ink}`, background: C.paperHi, boxShadow: SHADOW(5), fontFamily: F.mono, fontWeight: 700, fontSize: 30 }}>
          📦 WhatsApp Chat.zip
        </div>
      </div>
      <div style={{ marginTop: 34, height: 26, borderRadius: 13, border: `4px solid ${C.ink}`, overflow: "hidden", background: C.paperHi }}>
        <div style={{ width: `${fill * 100}%`, height: "100%", background: C.accent }} />
      </div>
      <div style={{ marginTop: 22, display: "flex", gap: w < 900 ? 22 : 44, flexWrap: "wrap", fontFamily: F.mono, fontWeight: 700, fontSize: 28 }}>
        <span><CountUp to={17} start={t0 + 22} duration={46} style={{ color: C.accent }} /> model calls</span>
        <span><CountUp to={50} start={t0 + 22} duration={46} style={{ color: C.accent }} /> tok/s</span>
        <span><CountUp to={16.9} decimals={1} start={t0 + 22} duration={46} style={{ color: C.accent }} /> s</span>
      </div>
    </>
  );
}

const NIGHT = ["parse", "your lines", "classify", "quote check", "dates", "reply"];

function NightPanel({ t0, w }: PanelProps) {
  const frame = useCurrentFrame();
  const scrub = reveal(frame, t0 + 6, 62);
  const span = w - 120;
  const x0 = 60;
  return (
    <div style={{ position: "relative", height: "100%", borderRadius: 26, background: C.ink, padding: 34, color: C.paperHi, overflow: "hidden" }}>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 56, letterSpacing: "-0.03em" }}>The night, step by step</div>
      <Doodle kind="star" x={w - 170} y={30} size={70} start={t0 + 4} color={C.paperHi} width={5} />
      <Doodle kind="sparkle" x={w - 260} y={110} size={50} start={t0 + 10} color={C.accent} />
      <div style={{ position: "absolute", left: x0, top: 230, width: span, height: 6, background: "rgba(251,247,239,.25)", borderRadius: 3 }} />
      <div style={{ position: "absolute", left: x0, top: 230, width: span * scrub, height: 6, background: C.accent, borderRadius: 3 }} />
      {NIGHT.map((n, k) => {
        const x = x0 + (span * k) / (NIGHT.length - 1);
        const lit = scrub >= k / (NIGHT.length - 1) - 0.001;
        return (
          <div key={n}>
            <div style={{ position: "absolute", left: x - 20, top: 213, width: 40, height: 40, borderRadius: "50%", background: lit ? C.accent : C.ink, border: `5px solid ${lit ? C.accent : "rgba(251,247,239,.5)"}`, transform: `scale(${lit ? 1.15 : 1})` }} />
            <div style={{ position: "absolute", left: x - 90, top: k % 2 ? 290 : 130, width: 180, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: w < 900 ? 22 : 26, opacity: lit ? 1 : 0.45 }}>{n}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: x0 + span * scrub - 3, top: 190, width: 6, height: 90, background: C.paperHi, borderRadius: 3 }} />
    </div>
  );
}

const DETAILS = ["only your lines", "quote or it didn't happen", "kal = +1, parso = +2", "done? dropped", "≤ 25-word reply", "Hinglish native"];

function DetailsPanel({ t0, w }: PanelProps) {
  const frame = useCurrentFrame();
  const cols = w < 900 ? 2 : 3;
  return (
    <>
      <Title>Six rules, all visible</Title>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22 }}>
        {DETAILS.map((d, k) => {
          const t = reveal(frame, t0 + 4 + k * 5, 18);
          return (
            <div key={d} style={{ perspective: 800 }}>
              <div style={{ minHeight: 130, padding: "20px 22px", borderRadius: 22, border: `4px solid ${C.ink}`, background: k % 3 === 1 ? C.accent : C.paperHi, color: k % 3 === 1 ? C.paperHi : C.ink, boxShadow: SHADOW(5), transform: `rotateY(${(1 - t) * 90}deg)`, opacity: t > 0.02 ? 1 : 0, fontFamily: F.display, fontWeight: 800, fontSize: 34, lineHeight: 1.1 }}>
                <div style={{ fontFamily: F.mono, fontSize: 22, opacity: 0.7, marginBottom: 8 }}>0{k + 1}</div>
                {d}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const LOCK = "M30 46 L70 46 L70 86 L30 86 Z M50 60 L50 72";
const SHACKLE = "M36 46 L36 32 C 36 14, 64 14, 64 32 L64 46";

function OpenPanel({ w }: PanelProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flip = pop(frame, fps, B.switch + 4, 13, 220);
  const close = pop(frame, fps, B.open + 14, 12, 240);
  const swW = w < 900 ? 300 : 380;
  return (
    <>
      <Title>Why open weights matter</Title>
      <div style={{ display: "flex", alignItems: "center", gap: 30, flexWrap: w < 900 ? "wrap" : "nowrap" }}>
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, opacity: 1 - flip * 0.6, textDecoration: flip > 0.5 ? "line-through" : undefined }}>cloud API</span>
        <div style={{ position: "relative", width: swW, height: 120, borderRadius: 60, border: `6px solid ${C.ink}`, background: flip > 0.5 ? C.accent : C.paperLo }}>
          <div style={{ position: "absolute", top: 10, left: 10 + flip * (swW - 120), width: 88, height: 88, borderRadius: "50%", background: C.paperHi, border: `5px solid ${C.ink}`, boxShadow: SHADOW(4) }} />
        </div>
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: flip > 0.5 ? C.accent : C.ink2 }}>local · open</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 40 }}>
        <svg viewBox="0 0 100 100" width={150} height={150} style={{ overflow: "visible" }}>
          <g transform={`translate(0 ${(1 - close) * -14})`}>
            <DrawPath d={SHACKLE} start={B.open} duration={14} stroke={C.ink} width={7} />
          </g>
          <DrawPath d={LOCK} start={B.open} duration={16} stroke={C.ink} width={7} fill={C.accent} fillAfter />
        </svg>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {["₹0", "offline", "auditable", "yours"].map((c, k) => {
            const s = pop(frame, fps, B.open + 10 + k * 4, 13, 200);
            return (
              <span key={c} style={{ transform: `scale(${s})`, display: "inline-block", padding: "12px 24px", borderRadius: 999, border: `4px solid ${C.ink}`, background: C.paperHi, boxShadow: SHADOW(4), fontFamily: F.mono, fontWeight: 700, fontSize: 30 }}>
                {c}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
}
