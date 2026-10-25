import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { Sloth } from "../components/Sloth";
import { Hand, SplitText } from "../components/Text";
import { useToast } from "../components/Toast";
import { setMood } from "../lib/mood";
import { recorded, recordedSpeed } from "../lib/recorded";
import { useSound } from "../lib/sound";
import { useOllama } from "../lib/useOllama";

const NOTES = [
  ...recorded.late.map((p) => ({ id: p.messageId, text: p.quote, stamp: `${p.daysLate}d late` })),
  ...recorded.soon.map((p) => ({ id: p.messageId, text: p.quote, stamp: "due tmrw" })),
];
const SPOTS = [
  { left: "4%", top: "8%", rotate: -7 },
  { left: "42%", top: "2%", rotate: 5 },
  { left: "8%", top: "46%", rotate: 4 },
  { left: "50%", top: "40%", rotate: -5 },
  { left: "20%", top: "72%", rotate: -3 },
];

export function Hero() {
  const board = useRef<HTMLDivElement>(null);
  const mouth = useRef<HTMLDivElement>(null);
  const [eaten, setEaten] = useState<number[]>([]);
  const [top, setTop] = useState<number | null>(null);
  const toast = useToast();
  const { play } = useSound();

  const overMouth = (x: number, y: number) => {
    const r = mouth.current?.getBoundingClientRect();
    return !!r && x > r.left - 20 && x < r.right + 20 && y > r.top - 20 && y < r.bottom + 20;
  };

  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <Hand className="hero-hint">
          psst — this runs on your laptop, wifi off
          <svg viewBox="0 0 60 40" width="46" className="hint-arrow" aria-hidden="true">
            <path d="M4 6c18 2 34 10 44 26m0 0-9-3m9 3 1-9" />
          </svg>
        </Hand>
        <SplitText as="h1" by="chars" onView={false} delay={0.15} className="hero-title" text={"You said\nyou'd do it.\n_We_ _noticed._"} />
        <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          Said It reads <b>only the messages you sent</b>, finds every “kal bhej dunga”, and hands you one reply that closes the easiest promise.
          Gemma runs on your machine through Ollama. Your chats never leave it.
        </motion.p>
        <motion.div className="hero-ctas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}>
          <Button to="/app" cursor="open">
            Run it on my chats
          </Button>
          <Button to="/app?demo=1" variant="ghost" arrow={false} cursor="play" icon={<span className="play-tri" />}>
            Watch a real run
          </Button>
        </motion.div>
      </div>

      <div className="hero-board" ref={board}>
        <Hand className="board-hint">drag a promise into his mouth ↘</Hand>
        {NOTES.map((n, i) =>
          eaten.includes(n.id) ? null : (
            <motion.div
              key={n.id}
              className="note"
              style={{ left: SPOTS[i % SPOTS.length].left, top: SPOTS[i % SPOTS.length].top, zIndex: top === n.id ? 5 : 1 }}
              initial={{ opacity: 0, scale: 0.6, rotate: SPOTS[i].rotate * 3 }}
              animate={{ opacity: 1, scale: 1, rotate: SPOTS[i].rotate }}
              transition={{ delay: 1 + i * 0.09, type: "spring", stiffness: 260, damping: 16 }}
              drag
              dragConstraints={board}
              dragElastic={0.15}
              dragMomentum
              whileHover={{ scale: 1.04, rotate: 0 }}
              whileDrag={{ scale: 1.08, rotate: 0, boxShadow: "10px 14px 0 var(--ink)" }}
              onDragStart={() => {
                setTop(n.id);
                setMood("hungry");
                play("tick");
              }}
              onDragEnd={(_, info) => {
                if (overMouth(info.point.x - window.scrollX, info.point.y - window.scrollY)) {
                  setEaten((e) => [...e, n.id]);
                  setMood("happy", 1400);
                  play("thunk");
                  toast("Om nom. The promise is still open, though.", "🍃");
                } else setMood("idle");
              }}
              data-cursor="drag"
            >
              <span className="note-stamp">{n.stamp}</span>
              <span className="note-text">“{n.text}”</span>
              <span className="note-by">— you</span>
            </motion.div>
          ),
        )}
        <div className="board-sloth" ref={mouth}>
          <Sloth size={170} />
          <AnimatePresence>
            {eaten.length === NOTES.length && (
              <motion.button
                type="button"
                className="chip"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => setEaten([])}
                data-cursor="undo"
              >
                bring them back
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Ticker />
    </section>
  );
}

function Ticker() {
  const status = useOllama();
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const mm = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const items = [
    status.state === "online"
      ? `● ollama online · ${status.models.length} model${status.models.length === 1 ? "" : "s"}${status.loaded.length ? ` · ${status.loaded[0]} warm` : ""}`
      : status.state === "offline"
        ? "○ ollama not running here · demo uses a recorded run"
        : "◌ looking for ollama on localhost…",
    `bytes sent to a server: 0`,
    `${recordedSpeed.model} · ${recordedSpeed.tokensPerSec} tok/s on a laptop`,
    `you've been here ${mm} — the sloth approves`,
    `sample chat: ${recorded.total} messages → ${recorded.late.length + recorded.soon.length} promises`,
    `cost per run: ₹0`,
    `works in airplane mode`,
  ];
  const row = (
    <div className="ticker-row">
      {items.map((t, i) => (
        <span key={i} className={i === 0 ? `ticker-live is-${status.state}` : undefined}>
          {t}
          <span className="ticker-sep">✳</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="ticker" aria-label="Live stats">
      <div className="ticker-track">
        {row}
        {row}
      </div>
    </div>
  );
}
