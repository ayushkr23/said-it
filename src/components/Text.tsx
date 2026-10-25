import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { createElement, useRef, type ReactNode } from "react";

type SplitProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  by?: "words" | "chars";
  className?: string;
  delay?: number;
  stagger?: number;
  onView?: boolean;
};

/**
 * Mask-reveals text upward, line by line ("\n"), word by word or char by char.
 * Wrap a word in _underscores_ to paint it in the accent colour.
 */
export function SplitText({ text, as = "h2", by = "words", className = "", delay = 0, stagger, onView = true }: SplitProps) {
  const step = stagger ?? (by === "chars" ? 0.022 : 0.06);
  let i = 0;
  const lines = text.split("\n").map((line, li) => (
    <span className="split-line" key={li}>
      {line.split(" ").map((raw, wi) => {
        const accent = /^_.*_[.,!?]?$/.test(raw);
        const word = accent ? raw.replace(/_/g, "") : raw;
        const parts = by === "chars" ? [...word] : [word];
        return (
          <span className={`split-word${accent ? " is-accent" : ""}`} key={wi}>
            {parts.map((p, pi) => {
              const d = delay + i++ * step;
              return (
                <span className="split-mask" key={pi}>
                  <motion.span
                    className="split-in"
                    initial={{ y: "110%", rotate: 4 }}
                    {...(onView
                      ? { whileInView: { y: "0%", rotate: 0 }, viewport: { once: true, margin: "-10% 0px" } }
                      : { animate: { y: "0%", rotate: 0 } })}
                    transition={{ duration: 0.8, ease: [0.2, 0.9, 0.1, 1], delay: d }}
                  >
                    {p}
                  </motion.span>
                </span>
              );
            })}
            {wi < line.split(" ").length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  ));
  return createElement(as, { className: `split ${className}`, "aria-label": text.replace(/_/g, "") }, lines);
}

/** Hover the host (.roll-host) and every character rolls up to an identical copy. */
export function RollText({ children }: { children: string }) {
  const chars = [...children];
  const row = (cls: string) => (
    <span className={cls} aria-hidden={cls === "roll-b" ? true : undefined}>
      {chars.map((c, i) => (
        <span key={i} style={{ transitionDelay: `${i * 16}ms` }}>
          {c === " " ? "\u00a0" : c}
        </span>
      ))}
    </span>
  );
  return (
    <span className="roll" aria-label={children}>
      {row("roll-a")}
      {row("roll-b")}
    </span>
  );
}

/** Each word fades from pale to ink as the paragraph scrolls through the viewport. */
export function ScrollInk({ children, className = "" }: { children: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const tokens = children.split(" ");
  return (
    <p ref={ref} className={`scroll-ink ${className}`}>
      {tokens.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / tokens.length, (i + 1) / tokens.length]} raw={w} />
      ))}
    </p>
  );
}

function Word({ progress, range, raw }: { progress: MotionValue<number>; range: [number, number]; raw: string }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  const mark = /^_.*_[.,!?]?$/.test(raw);
  const word = raw.replace(/_/g, "");
  const swipe = useTransform(progress, [range[0], range[1] + 0.05], [0, 1]);
  return (
    <span className={`ink-word${mark ? " is-mark" : ""}`}>
      {mark && <motion.span className="ink-mark" style={{ scaleX: swipe }} />}
      <motion.span style={{ opacity }}>{word}</motion.span>{" "}
    </span>
  );
}

export function Hand({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`hand ${className}`}>{children}</span>;
}
