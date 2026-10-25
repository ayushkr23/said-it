import { motion } from "motion/react";
import { useState } from "react";
import { Hand, ScrollInk, SplitText } from "../components/Text";
import { useSound } from "../lib/sound";

const GRAVES = [
  { said: "kal bhej dunga", ago: "said 9 days ago" },
  { said: "let me check and get back", ago: "said 5 days ago" },
  { said: "tomorrow, pakka", ago: "said 4 days ago" },
];

export function Problem() {
  return (
    <section className="section problem" id="problem">
      <div className="eyebrow">01 · the problem</div>
      <div className="problem-grid">
        <ScrollInk className="problem-text">
          {`Every group chat has a graveyard. “Kal bhej dunga.” “Let me check and get back.” “Tomorrow, pakka.” You meant every one of them. Then the chat scrolled and the promise went with it. Summaries tell you _what_ _everyone_ _else_ _said._ Nobody tells you _what_ _you_ _said._`}
        </ScrollInk>
        <div className="graves">
          <Hand className="graves-hint">poke a tombstone</Hand>
          {GRAVES.map((g, i) => (
            <Grave key={g.said} {...g} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Grave({ said, ago, i }: { said: string; ago: string; i: number }) {
  const [flip, setFlip] = useState(false);
  const { play } = useSound();
  return (
    <motion.button
      type="button"
      className="grave"
      style={{ rotate: i % 2 ? 3 : -3 }}
      initial={{ y: 80, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.12, type: "spring", stiffness: 200, damping: 14 }}
      whileHover={{ rotate: [0, -4, 4, -2, 0], transition: { duration: 0.5 } }}
      onClick={() => {
        setFlip((f) => !f);
        play("thunk");
      }}
      data-cursor="poke"
      aria-pressed={flip}
    >
      <motion.span className="grave-inner" animate={{ rotateY: flip ? 180 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
        <span className="grave-face">
          <span className="grave-rip">R.I.P.</span>
          <span className="grave-said">“{said}”</span>
        </span>
        <span className="grave-face grave-back">
          <span className="grave-said">{ago}</span>
          <span className="grave-rip">still open</span>
        </span>
      </motion.span>
    </motion.button>
  );
}

export function SectionTitle({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <header className="section-head">
      <div className="eyebrow">{eyebrow}</div>
      <SplitText text={title} as="h2" />
      {hint && <Hand className="section-hint">{hint}</Hand>}
    </header>
  );
}
