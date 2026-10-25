import { motion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useGlobalMood, type Mood } from "../lib/mood";

type Props = { size?: number; mood?: Mood; className?: string; track?: boolean };

/** Doodled sloth. Pupils follow the cursor; it dozes off when nobody moves. */
export function Sloth({ size = 120, mood: forced, className, track = true }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const global = useGlobalMood();
  const [dozing, setDozing] = useState(false);
  const [blink, setBlink] = useState(false);
  const px = useSpring(0, { stiffness: 300, damping: 20 });
  const py = useSpring(0, { stiffness: 300, damping: 20 });

  useEffect(() => {
    if (!track) return;
    let idle = window.setTimeout(() => setDozing(true), 7000);
    const move = (e: PointerEvent) => {
      setDozing(false);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setDozing(true), 7000);
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 300);
      px.set((dx / d) * 3.2 * k);
      py.set((dy / d) * 2.6 * k);
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      window.clearTimeout(idle);
    };
  }, [px, py, track]);

  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
        loop();
      }, 2400 + Math.random() * 3200);
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);

  const mood: Mood = forced ?? (global !== "idle" ? global : dozing ? "sleepy" : "idle");
  const lid = mood === "sleepy" ? 0.55 : blink ? 1 : 0;
  const happy = mood === "happy";
  const wide = mood === "surprised" || mood === "hungry";

  return (
    <svg ref={ref} viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <motion.g
        animate={mood === "sleepy" ? { rotate: [0, -4, 0], y: [0, 2, 0] } : { rotate: 0, y: 0 }}
        transition={mood === "sleepy" ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" } : { type: "spring" }}
        style={{ originX: "50%", originY: "80%" }}
      >
        <path
          d="M60 16c25 0 46 18 46 45s-19 47-46 47S14 88 14 61 35 16 60 16z"
          fill="var(--fur)"
          stroke="var(--ink)"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="M22 44c4-4 8-6 10-5M98 44c-4-4-8-6-10-5" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <ellipse cx="60" cy="68" rx="34" ry="28" fill="var(--paper-hi)" stroke="var(--ink)" strokeWidth="2.4" />
        <path d="M27 58c6-8 18-10 24-2 3 5-2 14-10 15-9 1-17-5-14-13z" fill="var(--ink)" />
        <path d="M93 58c-6-8-18-10-24-2-3 5 2 14 10 15 9 1 17-5 14-13z" fill="var(--ink)" />

        {[40, 80].map((cx, i) => (
          <g key={cx}>
            {happy ? (
              <path d={`M${cx - 6} ${64} q6 -7 12 0`} stroke="var(--paper-hi)" strokeWidth="3" fill="none" strokeLinecap="round" />
            ) : mood === "wink" && i === 1 ? (
              <path d={`M${cx - 6} ${63} h12`} stroke="var(--paper-hi)" strokeWidth="3" strokeLinecap="round" />
            ) : (
              <>
                <circle cx={cx} cy={63} r={wide ? 7.5 : 6} fill="var(--paper-hi)" />
                <motion.circle cx={cx} cy={63} r={wide ? 3.2 : 3.4} fill="var(--ink)" style={{ x: px, y: py }} />
                <motion.rect
                  x={cx - 8}
                  y={55}
                  width={16}
                  height={16}
                  fill="var(--ink)"
                  initial={false}
                  animate={{ scaleY: lid }}
                  style={{ originY: 0 }}
                  transition={{ duration: 0.12 }}
                />
              </>
            )}
          </g>
        ))}

        <ellipse cx="60" cy="76" rx="7" ry="5" fill="var(--ink)" />
        {wide ? (
          <ellipse cx="60" cy="89" rx="4.5" ry="5.5" fill="var(--ink)" />
        ) : (
          <path
            d={happy ? "M49 85q11 12 22 0" : "M51 87q9 6 18 0"}
            stroke="var(--ink)"
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
          />
        )}
        <circle cx="30" cy="82" r="5" fill="var(--accent)" opacity=".35" />
        <circle cx="90" cy="82" r="5" fill="var(--accent)" opacity=".35" />
      </motion.g>

      {mood === "sleepy" && (
        <motion.text
          x="98"
          y="20"
          className="zzz"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: [0, 1, 0], y: [26, 14, 4] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          z
        </motion.text>
      )}
    </svg>
  );
}
