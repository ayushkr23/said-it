import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useSound } from "../lib/sound";
import { SectionTitle } from "./Problem";

const STEPS = [
  {
    time: "11:40 pm",
    title: "You export the chat",
    body: "WhatsApp → chat → More → Export chat → Without media. It's a .txt on your disk. Drop it in. That's the only effort you'll spend.",
    code: `WhatsApp Chat with DBMS Project 🦥.txt\n29 messages · 3 people · 2.1 KB`,
  },
  {
    time: "11:41 pm",
    title: "Gemma reads only your lines",
    body: "One message at a time, Gemma 3 4B has to quote the exact words that commit you to something. If the quote isn't really in your message, it doesn't count.",
    code: `ME: haan kal bhej dunga ER diagram\n→ commitment_words: "kal bhej dunga" ✓ grounded`,
  },
  {
    time: "11:41 pm",
    title: "Code does the calendar",
    body: "Small models are bad at dates. So the model never does date math: kal is +1 day, parso is +2, “friday” is the next Friday, and “I'll get back to you” goes stale after 2 days.",
    code: `said Thu 15 Oct · "kal" → due Fri 16 Oct\ntoday Sun 25 Oct → 9 days late`,
  },
  {
    time: "11:42 pm",
    title: "Already did it? Dropped.",
    body: "Your later “booked ✅” or “bhej diya” gets checked against each promise. Only the same task counts. Kept promises don't nag you.",
    code: `"I'll book the lab slot for friday"\n  ↳ "lab slot booked for friday 3pm ✅"  → kept`,
  },
  {
    time: "7:30 am",
    title: "You get one reply",
    body: "The easiest late promise, and one message under 25 words that names the thing. Copy, paste, done. Everything else is thrown away.",
    code: `→ Kabir: "Sorry yaar, charger kal subah 10 baje\n   deliver karunga 🚀"`,
  },
];

export function Night() {
  const [i, setI] = useState(0);
  const { play } = useSound();
  const pick = (n: number) => {
    setI(n);
    play("tick");
  };
  return (
    <section className="section night" id="night">
      <SectionTitle eyebrow="03 · one night" title={"It works while\nyou're _asleep._"} hint="click the times" />
      <div className="timeline" role="tablist" aria-label="How a night goes">
        <div className="timeline-line">
          <motion.div className="timeline-fill" animate={{ scaleX: i / (STEPS.length - 1) }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        {STEPS.map((s, n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={i === n}
            className={`tl-node${n <= i ? " is-past" : ""}${n === i ? " is-on" : ""}`}
            onClick={() => pick(n)}
            data-cursor="open"
          >
            <motion.span className="tl-dot" animate={{ scale: n === i ? 1.35 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
              {n === STEPS.length - 1 ? "☀" : n === 0 ? "☾" : ""}
            </motion.span>
            <span className="tl-time">{s.time}</span>
          </button>
        ))}
      </div>
      <div className="tl-panel-wrap">
        <AnimatePresence mode="wait">
          <motion.article
            key={i}
            className="tl-panel"
            initial={{ opacity: 0, y: 24, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -16, rotate: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <div>
              <span className="tl-step">step {i + 1} of {STEPS.length}</span>
              <h3>{STEPS[i].title}</h3>
              <p>{STEPS[i].body}</p>
              <div className="tl-nav">
                <button type="button" className="chip" disabled={i === 0} onClick={() => pick(i - 1)} data-cursor="back">
                  ← back
                </button>
                <button type="button" className="chip" disabled={i === STEPS.length - 1} onClick={() => pick(i + 1)} data-cursor="next">
                  next →
                </button>
              </div>
            </div>
            <pre className="tl-code">{STEPS[i].code}</pre>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}
