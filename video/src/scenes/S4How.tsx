import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, SHADOW } from "../brand";
import { Doodle, DrawPath } from "../motion/Draw";
import { Mascot } from "../motion/Mascot";
import { CameraRig } from "../motion/Stage";
import { Hand, SplitText, TypeWriter } from "../motion/Text";
import { Badge, Bubble, Card, Chip } from "../motion/UI";
import { drift, lerp, pop, reveal, useLayout } from "../motion/core";
import { voBeat } from "../script";

const at = (word: string, fallback: number, nth = 0) => voBeat("how", word, fallback, nth);

const B = {
  export: at("Export", 8),
  just: at("Just", 65),
  gemma: at("Gemma", 144),
  reads: at("reads", 194),
  quotes: at("quotes", 239),
  code: at("Code", 314),
  kal: at("kal", 369),
  parso: at("parso", 415),
  already: at("Already", 464),
  dropped: at("dropped", 497),
  then: at("Then", 522),
  reply: at("reply", 549),
  words: at("twenty-five", 577),
  easiest: at("easiest", 622),
};
const STARTS = [B.export, B.gemma, B.code, B.then];

const ICONS = [
  "M30 45 L30 85 L70 85 L70 45 M50 12 L50 62 M34 28 L50 12 L66 28",
  "M42 18 C 56 18, 66 28, 66 42 C 66 56, 56 66, 42 66 C 28 66, 18 56, 18 42 C 18 28, 28 18, 42 18 Z M60 60 L84 84",
  "M16 26 L84 26 L84 86 L16 86 Z M16 42 L84 42 M34 14 L34 32 M66 14 L66 32 M32 58 L40 58 M54 58 L62 58 M32 72 L40 72",
  "M14 22 C 14 16, 18 14, 24 14 L76 14 C 82 14, 86 16, 86 22 L86 58 C 86 64, 82 66, 76 66 L42 66 L24 84 L28 66 L24 66 C 18 66, 14 64, 14 58 Z",
];

const STEPS = [
  { title: "Export a\nWhatsApp chat.", note: "just a .txt that never leaves your laptop" },
  { title: "Gemma reads\nonly _your_ lines.", note: "and has to quote the promise" },
  { title: "Code does\nthe _calendar._", note: "kal = +1 · parso = +2 · done = dropped" },
  { title: "One reply.\n_Under_ _25_ words.", note: "for the easiest late promise" },
];

/**
 * ~19–41s. Four steps laid out on one long canvas. The camera pulls back and pans to each
 * step as the voice reaches it, while a hand-drawn line connects the numbers.
 * Techniques: camera pan + pull-back, path draw, spring pops, highlighter wipe, type-on.
 */
export function S4How() {
  const frame = useCurrentFrame();
  const { w, h, vertical, pad } = useLayout();

  const pan = STARTS.slice(1).reduce((x, s) => x - reveal(frame, s - 22, 26) * w, 0);
  const zoomKeys = [
    { at: 0, scale: 1.05 },
    { at: 40, scale: 1 },
    ...STARTS.slice(1).flatMap((s) => [
      { at: s - 24, scale: 1 },
      { at: s - 10, scale: 0.9 },
      { at: s + 6, scale: 1 },
    ]),
  ];

  const numY = vertical ? 150 : 110;
  const illus = vertical
    ? { x: pad, y: 720, w: w - pad * 2, h: 700 }
    : { x: 860, y: 140, w: w - 860 - pad, h: 700 };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <CameraRig keys={zoomKeys}>
        <div style={{ position: "absolute", left: 0, top: 0, width: w * 4, height: h, transform: `translateX(${pan}px)` }}>
          {/* Connecting line, drawn as the camera travels to each next step. */}
          <svg width={w * 4} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {[0, 1, 2].map((k) => {
              const x1 = k * w + pad + (vertical ? 260 : 320);
              const x2 = (k + 1) * w + pad - 30;
              const y = numY + 110;
              const d = `M${x1} ${y} C ${x1 + 260} ${y - 140}, ${x2 - 300} ${y + 160}, ${x2} ${y}`;
              return <DrawPath key={k} d={d} start={STARTS[k + 1] - 28} duration={30} stroke={C.ink} width={6} />;
            })}
          </svg>

          {STEPS.map((s, i) => (
            <Step key={i} i={i} start={STARTS[i]} title={s.title} note={s.note} numY={numY} illus={illus}>
              {i === 0 && <ExportArt w={illus.w} />}
              {i === 1 && <ReadArt w={illus.w} />}
              {i === 2 && <CalendarArt w={illus.w} />}
              {i === 3 && <ReplyArt w={illus.w} />}
            </Step>
          ))}
        </div>
      </CameraRig>

      <Mascot
        x={vertical ? w - 290 : pad - 30}
        y={vertical ? 130 : h - 330}
        size={vertical ? 210 : 230}
        enter={6}
        flip={!vertical}
        moods={[
          { at: 0, mood: "point" },
          { at: B.reads, mood: "happy" },
          { at: B.code, mood: "point" },
          { at: B.dropped, mood: "wink" },
          { at: B.then, mood: "point" },
          { at: B.easiest + 10, mood: "celebrate" },
        ]}
      />
    </AbsoluteFill>
  );
}

function Step({ i, start, title, note, numY, illus, children }: { i: number; start: number; title: string; note: string; numY: number; illus: { x: number; y: number; w: number; h: number }; children: ReactNode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { w, h, vertical, pad } = useLayout();
  const n = pop(frame, fps, start - 4, 12, 180);
  const card = pop(frame, fps, start + 6, 16, 160);
  return (
    <div style={{ position: "absolute", left: i * w, top: 0, width: w, height: h }}>
      <div
        style={{
          position: "absolute",
          left: pad,
          top: numY,
          fontFamily: F.display,
          fontWeight: 800,
          fontSize: vertical ? 220 : 250,
          lineHeight: 0.8,
          letterSpacing: "-0.06em",
          color: C.accent,
          transform: `translateY(${(1 - n) * 90}px) rotate(${(1 - n) * -12 + drift(frame, 1.5, 80)}deg)`,
          opacity: Math.min(1, n * 2),
        }}
      >
        0{i + 1}
      </div>
      <svg viewBox="0 0 100 100" width={130} height={130} style={{ position: "absolute", left: pad + (vertical ? 290 : 330), top: numY + 30, overflow: "visible", transform: `rotate(${drift(frame, 4, 70, i)}deg)` }}>
        <DrawPath d={ICONS[i]} start={start + 4} duration={24} stroke={C.ink} width={6} />
      </svg>

      <div style={{ position: "absolute", left: pad, top: vertical ? 400 : 360, width: vertical ? w - pad * 2 : 680 }}>
        <SplitText text={title} start={start + 2} style={{ fontSize: vertical ? 88 : 82 }} />
        <div style={{ marginTop: 28, opacity: reveal(frame, start + 18, 14), transform: `translateX(${(1 - reveal(frame, start + 18, 18)) * -40}px) rotate(-2deg)` }}>
          <Hand style={{ fontSize: vertical ? 58 : 56 }}>{note}</Hand>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: illus.x,
          top: illus.y,
          width: illus.w,
          height: illus.h,
          transform: `translateY(${(1 - card) * 120}px) rotate(${(1 - card) * 4 + drift(frame, 0.4, 110, i)}deg)`,
          opacity: Math.min(1, card * 2),
        }}
      >
        <Card style={{ position: "absolute", inset: 0, padding: 40, overflow: "hidden" }}>{children}</Card>
      </div>
    </div>
  );
}

/* ---------- 01: phone → laptop ---------- */
function ExportArt({ w }: { w: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = pop(frame, fps, B.export + 8, 14, 170);
  const laptop = pop(frame, fps, B.export + 16, 14, 170);
  const fly = reveal(frame, B.just - 8, 30);
  const landed = frame >= B.just + 20;
  const sx = 70;
  const sy = 330;
  const ex = w - 470;
  const ey = 230;
  const fx = lerp(fly, sx, ex);
  const fy = lerp(fly, sy, ey) - Math.sin(fly * Math.PI) * 190;
  const menu = reveal(frame, B.export + 24, 10);
  return (
    <>
      <div style={{ position: "absolute", left: 30, top: 70, width: 230, height: 450, borderRadius: 40, border: `6px solid ${C.ink}`, background: C.paper, transform: `scale(${phone})`, transformOrigin: "50% 100%", boxShadow: SHADOW(6) }}>
        <div style={{ margin: "40px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[0.7, 0.5, 0.8].map((wd, k) => (
            <div key={k} style={{ height: 30, width: `${wd * 100}%`, alignSelf: k === 1 ? "flex-end" : "flex-start", borderRadius: 12, background: k === 1 ? C.ink : C.paperLo }} />
          ))}
          <div style={{ marginTop: 40, padding: "12px 10px", borderRadius: 14, border: `4px solid ${C.ink}`, fontFamily: F.mono, fontWeight: 700, fontSize: 22, textAlign: "center", background: menu > 0.5 ? C.accent : C.paperHi, color: menu > 0.5 ? C.paperHi : C.ink, transform: `scale(${1 + Math.sin(menu * Math.PI) * 0.12})` }}>
            Export chat
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: w - 520, top: 120, transform: `scale(${laptop})`, transformOrigin: "50% 100%" }}>
        <div style={{ width: 420, height: 280, borderRadius: 22, border: `6px solid ${C.ink}`, background: C.ink, padding: 18 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 8, background: C.paperHi, padding: 18, fontFamily: F.mono, fontSize: 24, color: C.ink }}>
            {landed && (
              <div style={{ opacity: reveal(frame, B.just + 20, 10) }}>
                <div style={{ fontWeight: 700 }}>chat.txt</div>
                <div style={{ color: C.ink2, marginTop: 6 }}>2,914 lines</div>
                <div style={{ position: "absolute", right: 34, bottom: 30 }}>
                  <svg viewBox="0 0 100 100" width={70} height={70}>
                    <DrawPath d="M14 52 L40 78 L88 22" start={B.just + 24} duration={14} stroke={C.accent} width={12} />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ width: 500, height: 26, marginLeft: -40, borderRadius: "0 0 18px 18px", background: C.ink }} />
        {frame >= B.just + 30 && (
          <div style={{ position: "absolute", right: -20, top: -30 }}>
            <Badge text="offline" start={B.just + 30} size={28} tone="ink" />
          </div>
        )}
      </div>

      {fly > 0 && !landed && (
        <div style={{ position: "absolute", left: fx, top: fy, transform: `rotate(${Math.sin(fly * Math.PI) * -14}deg) scale(${1 + Math.sin(fly * Math.PI) * 0.15})` }}>
          <Chip style={{ fontSize: 26, padding: "10px 20px" }}>📄 chat.txt</Chip>
        </div>
      )}
      <Doodle kind="arrow" x={w / 2 - 150} y={40} size={150} start={B.just - 6} color={C.accent} width={6} />
    </>
  );
}

/* ---------- 02: only your lines, quoted ---------- */
function Mark({ children, start }: { children: ReactNode; start: number }) {
  const frame = useCurrentFrame();
  const t = reveal(frame, start, 16);
  return (
    <span style={{ backgroundImage: `linear-gradient(${C.accent}, ${C.accent})`, backgroundRepeat: "no-repeat", backgroundSize: `${t * 100}% 100%`, padding: "0 4px", borderRadius: 6, color: t > 0.5 ? C.paperHi : undefined }}>
      {children}
    </span>
  );
}

function ReadArt({ w }: { w: number }) {
  const frame = useCurrentFrame();
  const dim = reveal(frame, B.reads, 16);
  const rows = [
    { who: "Riya", text: "ER diagram tu bana de na?", mine: false },
    { text: <>haan <Mark start={B.quotes}>kal bhej dunga</Mark> ER diagram</>, mine: true },
    { who: "Kabir", text: "lab ka slot kisi ne book kiya?", mine: false },
    { text: <>will <Mark start={B.quotes + 12}>return your charger</Mark> tomorrow</>, mine: true },
  ];
  return (
    <>
      <div style={{ display: "flex", gap: 14, marginBottom: 26, flexWrap: "wrap" }}>
        {["gemma3:4b", "ollama · localhost"].map((t, k) => (
          <span key={t} style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, padding: "8px 16px", borderRadius: 999, border: `3px solid ${C.ink}`, opacity: reveal(frame, B.gemma + 10 + k * 6, 10) }}>
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map((r, k) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", opacity: r.mine ? 1 : 1 - dim * 0.72, transform: `scale(${r.mine ? 1 + dim * 0.03 : 1 - dim * 0.04})`, transformOrigin: r.mine ? "100% 50%" : "0 50%" }}>
            <Bubble text={r.text} who={r.who} mine={r.mine} start={B.gemma + 14 + k * 7} size={w < 800 ? 32 : 34} />
          </div>
        ))}
      </div>
      {frame >= B.quotes + 26 && (
        <div style={{ position: "absolute", right: 34, bottom: 30 }}>
          <Badge text="quoted ✓" start={B.quotes + 26} size={30} />
        </div>
      )}
    </>
  );
}

/* ---------- 03: dates are code, done is dropped ---------- */
function CalendarArt({ w }: { w: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const inner = w - 80;
  const cell = inner / 7;
  const gridTop = 70;

  const chip = (label: string, plus: number, t0: number) => {
    const appear = pop(frame, fps, t0 - 4, 14, 200);
    const go = reveal(frame, t0 + 8, 18);
    const x = lerp(go, inner / 2 - 60, cell * plus + 6);
    const y = lerp(go, 300, gridTop + 50) - Math.sin(go * Math.PI) * 80;
    return (
      <div key={label} style={{ position: "absolute", left: x, top: y, transform: `scale(${appear})`, opacity: Math.min(1, appear * 2) }}>
        <span style={{ display: "inline-block", fontFamily: F.mono, fontWeight: 700, fontSize: 26, padding: "8px 14px", borderRadius: 12, background: C.accent, color: C.paperHi, boxShadow: SHADOW(4) }}>
          {label}
          {go > 0.9 && <span style={{ marginLeft: 8 }}>+{plus}</span>}
        </span>
      </div>
    );
  };

  const fall = reveal(frame, B.dropped, 20);
  const strike = reveal(frame, B.already + 14, 12);
  const card = pop(frame, fps, B.already - 4, 14, 180);

  return (
    <>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: C.ink2 }}>today · Mon 14 Oct</div>
      <div style={{ position: "absolute", left: 40, top: gridTop + 40, display: "flex" }}>
        {days.map((d, k) => {
          const lit = (k === 1 && frame >= B.kal + 24) || (k === 2 && frame >= B.parso + 24);
          return (
            <div key={d} style={{ width: cell - 10, height: 150, marginRight: 10, borderRadius: 16, border: `4px solid ${k === 0 ? C.accent : C.ink}`, background: lit ? C.accentSoft : C.paper, padding: 10, fontFamily: F.mono, fontWeight: 700, fontSize: 22, opacity: reveal(frame, B.code + 6 + k * 2, 12) }}>
              {d}
              <div style={{ fontFamily: F.display, fontSize: 40, marginTop: 4 }}>{14 + k}</div>
            </div>
          );
        })}
      </div>
      {chip("kal", 1, B.kal)}
      {chip("parso", 2, B.parso)}

      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 400,
          padding: "22px 28px",
          borderRadius: 22,
          border: `4px solid ${C.ink}`,
          background: C.paperHi,
          boxShadow: SHADOW(6),
          transform: `translateY(${fall * 260}px) rotate(${fall * 14}deg) scale(${card})`,
          opacity: (1 - fall) * Math.min(1, card * 2),
        }}
      >
        <div style={{ position: "relative", display: "inline-block", fontFamily: F.display, fontWeight: 800, fontSize: 40 }}>
          book the lab slot
          <div style={{ position: "absolute", left: 0, top: "55%", height: 6, width: `${strike * 100}%`, background: C.accent, borderRadius: 3 }} />
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 24, color: C.ink2, marginTop: 6 }}>you, later: "done ✅"</div>
      </div>
      {frame >= B.dropped + 4 && (
        <div style={{ position: "absolute", right: 50, top: 420 }}>
          <Badge text="dropped" start={B.dropped + 4} size={30} tone="ink" />
        </div>
      )}
    </>
  );
}

/* ---------- 04: one reply, word-counted ---------- */
const REPLY = "Sorry yaar, charger kal subah 10 baje deliver karunga 🚀";

function ReplyArt({ w }: { w: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cps = 30;
  const typed = Math.max(0, Math.floor(((frame - B.reply) / fps) * cps));
  const words = REPLY.slice(0, typed).split(/\s+/).filter((x) => /\p{L}|\d/u.test(x)).length;
  const done = typed >= REPLY.length;
  const send = pop(frame, fps, B.easiest + 12, 14, 180);
  const meter = interpolate(words, [0, 25], [0, 1]);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: `4px solid ${C.ink}` }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: C.fur, border: `4px solid ${C.ink}` }} />
        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 38 }}>Kabir</div>
        {frame >= B.easiest && (
          <div style={{ marginLeft: "auto" }}>
            <Badge text="3d late · easiest" start={B.easiest} size={24} />
          </div>
        )}
      </div>

      <div style={{ position: "absolute", left: 40, right: 40, top: 130, display: "flex", flexDirection: "column", gap: 14 }}>
        <Bubble text="bro mera charger 😭" who="Kabir" start={B.then + 8} size={30} />
        {send > 0.01 && (
          <div style={{ display: "flex", flexDirection: "column", transform: `translateY(${(1 - send) * 120}px)`, opacity: Math.min(1, send * 2) }}>
            <Bubble text={REPLY} mine start={B.easiest + 12} size={30} tone="promise" />
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          bottom: 110,
          minHeight: 120,
          padding: "20px 24px",
          borderRadius: 22,
          border: `4px solid ${C.ink}`,
          background: C.paper,
          fontFamily: F.display,
          fontWeight: 600,
          fontSize: w < 800 ? 32 : 34,
          opacity: 1 - send,
        }}
      >
        <TypeWriter text={REPLY} start={B.reply} cps={cps} />
      </div>

      <div style={{ position: "absolute", left: 40, right: 40, bottom: 36, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ flex: 1, height: 16, borderRadius: 8, background: C.paperLo, overflow: "hidden" }}>
          <div style={{ width: `${meter * 100}%`, height: "100%", background: C.accent }} />
        </div>
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, color: frame >= B.words ? C.accent : C.ink }}>{words} / 25 words</span>
        <svg viewBox="0 0 100 100" width={50} height={50}>
          {done && <DrawPath d="M14 52 L40 78 L88 22" start={B.reply + Math.ceil((REPLY.length / cps) * fps) + 2} duration={12} stroke={C.accent} width={14} />}
        </svg>
      </div>
    </>
  );
}
