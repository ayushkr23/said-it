import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, SHADOW } from "../brand";
import { CameraRig } from "../motion/Stage";
import { SplitText } from "../motion/Text";
import { Badge, Chip, Marquee } from "../motion/UI";
import { drift, pop, reveal, useLayout } from "../motion/core";
import { voBeat } from "../script";

const at = (word: string, fallback: number, nth = 0) => voBeat("faq", word, fallback, nth);

const QA = [
  { q: "Uploads my chats?", a: "No.", qAt: at("Uploads", 8), aAt: at("No", 52) },
  { q: "Needs wifi?", a: "No.", qAt: at("Needs", 79), aAt: at("No", 112, 1) },
  { q: "Hinglish?", a: "Natively.", qAt: at("Hinglish", 136), aAt: at("Natively", 163) },
];

const MORE = ["needs a GPU?", "Android exports?", "which model?", "group chats?", "stores anything?", "open source?"];

/**
 * ~72–78s. Three question cards pop in on the voice, each answer stamps on with a shake,
 * the active card lifts while answered ones settle back, a stopwatch ticks, and more
 * questions stream past in a marquee.
 * Techniques: spring pops, stamp shake, card shuffle, ticking counter, marquee.
 */
export function S8Faq() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { w, vertical, pad } = useLayout();

  const active = QA.reduce((n, qa, i) => (frame >= qa.qAt - 2 ? i : n), 0);
  const left = Math.max(0, (durationInFrames - frame) / fps);
  const cardW = vertical ? w - pad * 2 : (w - pad * 2 - 60) / 3;

  return (
    <AbsoluteFill>
      <CameraRig keys={[{ at: 0, scale: 1.04 }, { at: QA[2].aAt + 20, scale: 1 }]}>
        <div style={{ position: "absolute", left: pad, top: vertical ? 150 : 90, right: pad, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <SplitText text={"FAQ, _speed_ _round._"} start={2} style={{ fontSize: vertical ? 80 : 84 }} />
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 44, color: C.accent, padding: "8px 18px", border: `4px solid ${C.accent}`, borderRadius: 14 }}>
            00:0{Math.floor(left)}
          </span>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: vertical ? 300 : 230, transform: "rotate(-2deg)", opacity: reveal(frame, 6, 14) }}>
          <Marquee speed={0.18}>
            {MORE.map((m) => (
              <Chip key={m} style={{ fontSize: 28, opacity: 0.85 }}>? {m}</Chip>
            ))}
          </Marquee>
        </div>

        {QA.map((qa, i) => {
          const s = pop(frame, fps, qa.qAt - 2, 13, 190);
          const answered = frame >= qa.aAt;
          const stamp = answered ? Math.sin((frame - qa.aAt) * 2.4) * 10 * Math.exp(-(frame - qa.aAt) / 4) : 0;
          const lift = i === active ? 1 : 0.94;
          const x = vertical ? pad : pad + i * (cardW + 30);
          const y = vertical ? 430 + i * 330 : 400;
          return (
            <div
              key={qa.q}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: cardW,
                height: vertical ? 290 : 380,
                padding: 36,
                borderRadius: 34,
                border: `5px solid ${i === active ? C.accent : C.ink}`,
                background: C.paperHi,
                boxShadow: SHADOW(i === active ? 12 : 6),
                transform: `translate(${stamp}px, ${(1 - s) * 200}px) rotate(${(1 - s) * (i % 2 ? 8 : -8) + drift(frame, 0.6, 80, i) + (i - 1) * 1.5}deg) scale(${s * lift})`,
                opacity: Math.min(1, s * 2),
              }}
            >
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, color: C.ink2 }}>Q{i + 1}</div>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: vertical ? 64 : 58, letterSpacing: "-0.03em", lineHeight: 1.05, marginTop: 10 }}>{qa.q}</div>
              {answered && (
                <div style={{ position: "absolute", right: 30, bottom: 30 }}>
                  <Badge text={qa.a} start={qa.aAt} size={vertical ? 54 : 56} />
                </div>
              )}
            </div>
          );
        })}
      </CameraRig>

    </AbsoluteFill>
  );
}
