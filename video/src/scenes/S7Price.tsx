import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, SHADOW } from "../brand";
import { Doodle, DrawPath, DOODLES } from "../motion/Draw";
import { Mascot } from "../motion/Mascot";
import { CameraRig } from "../motion/Stage";
import { CountUp, Hand, SplitText } from "../motion/Text";
import { Badge } from "../motion/UI";
import { pop, reveal, useLayout } from "../motion/core";
import { voBeat } from "../script";

const at = (word: string, fallback: number, nth = 0) => voBeat("price", word, fallback, nth);

const B = {
  price: at("price", 16),
  zero: at("Zero", 41),
  fifty: at("Fifty", 110),
  laptop: at("laptop", 161),
  bytes: at("zero", 182, 1),
  uploaded: at("uploaded", 203),
};

/**
 * ~64–72s. ₹999 counts down and slams onto ₹0 on "Zero rupees", the cloud price gets
 * struck out, a hand-drawn arrow points to the aside, and three proof rows tick on their words.
 * Techniques: count-down + squash landing, strike draw, arrow draw, check draws, badge pop.
 */
export function S7Price() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, vertical, pad } = useLayout();

  const land = pop(frame, fps, B.zero, 9, 320);
  const squashY = frame < B.zero ? 1 : interpolate(land, [0, 0.5, 1], [1.3, 0.8, 1]);
  const squashX = frame < B.zero ? 1 : interpolate(land, [0, 0.5, 1], [0.85, 1.15, 1]);
  const strike = reveal(frame, B.zero + 8, 14);

  const priceBox = vertical ? { x: pad, y: 180 } : { x: pad, y: 150 };
  const proof = vertical ? { x: pad, y: 780, w: w - pad * 2 } : { x: 1040, y: 230, w: w - 1040 - pad };

  return (
    <AbsoluteFill>
      <CameraRig keys={[{ at: 0, scale: 1.08 }, { at: B.zero, scale: 1.02 }, { at: B.fifty, scale: 1, x: vertical ? 0 : -20 }, { at: B.uploaded + 30, scale: 1.03 }]}>
        <div style={{ position: "absolute", left: priceBox.x, top: priceBox.y }}>
          <SplitText text="The price?" start={B.price - 6} style={{ fontSize: vertical ? 84 : 80 }} />
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 10, transform: `scale(${squashX}, ${squashY})`, transformOrigin: "0 100%" }}>
            <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: vertical ? 300 : 330, lineHeight: 0.85, letterSpacing: "-0.06em", color: C.accent }}>
              ₹<CountUp from={999} to={0} start={B.price} duration={Math.max(8, B.zero - B.price)} />
            </span>
            <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: vertical ? 64 : 70, marginLeft: 18, marginBottom: 30, opacity: reveal(frame, B.zero + 4, 12) }}>/ night</span>
          </div>
          <div style={{ position: "relative", display: "inline-block", marginTop: 30, fontFamily: F.mono, fontWeight: 700, fontSize: vertical ? 40 : 40, color: C.ink2, opacity: reveal(frame, B.zero - 10, 12) }}>
            cloud API: ₹ per message
            <div style={{ position: "absolute", left: -8, top: "52%", height: 6, width: `calc(${strike * 100}% + 16px)`, background: C.accent, borderRadius: 3, transform: "rotate(-2deg)" }} />
          </div>
        </div>

        <svg viewBox="0 0 100 100" width={140} height={140} style={{ position: "absolute", left: vertical ? w - pad - 300 : 560, top: vertical ? 330 : 230, overflow: "visible", transform: "rotate(150deg)" }}>
          <DrawPath d={DOODLES.arrow} start={B.zero + 14} duration={18} stroke={C.ink} width={5} />
        </svg>
        <div style={{ position: "absolute", left: vertical ? w - pad - 430 : 660, top: vertical ? 230 : 160, transform: "rotate(-5deg)", opacity: reveal(frame, B.zero + 26, 10) }}>
          <Hand style={{ fontSize: vertical ? 60 : 66 }}>yes, actually zero.</Hand>
        </div>

        <div style={{ position: "absolute", left: proof.x, top: proof.y, width: proof.w, display: "flex", flexDirection: "column", gap: vertical ? 30 : 36 }}>
          <Row start={B.fifty}>
            <CountUp to={50} start={B.fifty} duration={30} style={{ color: C.accent }} /> tokens / sec
          </Row>
          <Row start={B.laptop}>on a normal laptop</Row>
          <Row start={B.bytes}>
            <span style={{ color: C.accent }}>0</span> bytes uploaded
          </Row>
          {frame >= B.uploaded + 4 && (
            <div style={{ alignSelf: "flex-start", marginLeft: 120 }}>
              <Badge text="checked: wifi off" start={B.uploaded + 4} size={32} tone="ink" />
            </div>
          )}
        </div>

        <Doodle kind="sparkle" x={vertical ? w - pad - 120 : 880} y={vertical ? 640 : 330} size={90} start={B.zero + 2} color={C.accent} />
        <Doodle kind="star" x={vertical ? pad + 40 : 900} y={vertical ? 1260 : 700} size={70} start={B.fifty} />
      </CameraRig>

      <Mascot
        x={vertical ? w - 300 : pad}
        y={vertical ? 1420 - 220 : h - 330}
        size={vertical ? 200 : 220}
        enter={6}
        moods={[
          { at: 0, mood: "surprised" },
          { at: B.zero + 4, mood: "wink" },
          { at: B.fifty, mood: "happy" },
          { at: B.uploaded, mood: "celebrate" },
        ]}
      />
    </AbsoluteFill>
  );
}

function Row({ start, children }: { start: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(frame, fps, start - 4, 14, 190);
  const { vertical } = useLayout();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, transform: `translateX(${(1 - s) * 80}px)`, opacity: Math.min(1, s * 2) }}>
      <div style={{ flex: "none", width: 92, height: 92, borderRadius: 24, border: `5px solid ${C.ink}`, background: C.paperHi, boxShadow: SHADOW(5) }}>
        <svg viewBox="0 0 100 100" width={82} height={82}>
          <DrawPath d={DOODLES.check} start={start + 4} duration={12} stroke={C.accent} width={13} />
        </svg>
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: vertical ? 64 : 62, letterSpacing: "-0.03em", lineHeight: 1 }}>{children}</div>
    </div>
  );
}
