import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { Doodle } from "../motion/Draw";
import { Mascot } from "../motion/Mascot";
import { CameraRig } from "../motion/Stage";
import { TypeWriter } from "../motion/Text";
import { Chip, Marquee } from "../motion/UI";
import { drift, pop, reveal, useLayout } from "../motion/core";
import { BRIEF, COPY } from "../script";

/**
 * 5–9s. Wordmark draws from strokes then fills, tagline types, mascot pops and winks,
 * feature chips marquee along the bottom.
 * Techniques: stroke draw, typewriter, spring pop, marquee, rotating orbit.
 */
export function S2Title() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { vertical, w, h } = useLayout();

  const size = vertical ? 230 : 300;
  const stroke = reveal(frame, 4, 34);
  const fill = reveal(frame, 30, 14);
  const blob = pop(frame, fps, 0, 18, 90);
  const chipsIn = reveal(frame, 26, 20);
  const cy = vertical ? h * 0.36 : h * 0.4;

  return (
    <AbsoluteFill>
      <CameraRig keys={[{ at: 0, scale: 1.08 }, { at: 120, scale: 1 }]}>
        <div
          style={{
            position: "absolute",
            left: w / 2 - 520,
            top: cy - 520,
            width: 1040,
            height: 1040,
            borderRadius: "50%",
            background: C.accentSoft,
            transform: `scale(${blob}) rotate(${frame * 0.3}deg)`,
          }}
        />
        <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
          <ellipse
            cx={w / 2}
            cy={cy}
            rx={vertical ? 470 : 760}
            ry={vertical ? 300 : 300}
            fill="none"
            stroke={C.ink3}
            strokeWidth={4}
            strokeDasharray="14 18"
            strokeDashoffset={-frame * 2}
            transform={`rotate(${-6 + drift(frame, 2, 120)} ${w / 2} ${cy})`}
          />
        </svg>

        <svg width={w} height={size * 1.3} style={{ position: "absolute", left: 0, top: cy - size * 0.8, overflow: "visible" }}>
          <text
            x={w / 2}
            y={size}
            textAnchor="middle"
            fontFamily={F.display}
            fontWeight={800}
            fontSize={size}
            letterSpacing={-size * 0.05}
            fill={C.ink}
            fillOpacity={fill}
            stroke={C.ink}
            strokeWidth={4}
            strokeDasharray={900}
            strokeDashoffset={900 * (1 - stroke)}
          >
            Said It<tspan fill={C.accent} stroke={C.accent}>.</tspan>
          </text>
        </svg>

        <div style={{ position: "absolute", left: 0, right: 0, top: cy + size * 0.42, textAlign: "center", padding: "0 80px" }}>
          <TypeWriter text={BRIEF.tagline} start={44} cps={30} style={{ fontFamily: F.display, fontWeight: 600, fontSize: vertical ? 58 : 62, color: C.ink2 }} />
        </div>

        <Doodle kind="sparkle" x={w / 2 - (vertical ? 470 : 640)} y={cy - size * 0.9} size={100} start={36} color={C.accent} />
        <Doodle kind="star" x={w / 2 + (vertical ? 330 : 560)} y={cy + size * 0.3} size={70} start={44} />

        <Mascot
          x={w / 2 + (vertical ? 120 : 330)}
          y={cy - size * 1.35}
          size={vertical ? 230 : 250}
          enter={26}
          moods={[
            { at: 0, mood: "happy" },
            { at: 48, mood: "wink" },
            { at: 96, mood: "celebrate" },
          ]}
        />

        <div style={{ position: "absolute", left: 0, right: 0, top: vertical ? h * 0.66 : h - 300, transform: `translateY(${(1 - chipsIn) * 120}px) rotate(-2deg)`, opacity: chipsIn }}>
          <Marquee speed={0.16}>
            {COPY.title.chips.map((c) => (
              <Chip key={c}>
                <span style={{ color: C.accent }}>✳</span>
                {c}
              </Chip>
            ))}
          </Marquee>
        </div>
      </CameraRig>
    </AbsoluteFill>
  );
}
