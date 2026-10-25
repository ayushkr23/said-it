import { animate, motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { dueDate, words } from "../lib/promises";
import { recorded, recordedSpeed } from "../lib/recorded";
import { useSound } from "../lib/sound";
import { SectionTitle } from "./Problem";

export function Details() {
  return (
    <section className="section details" id="details">
      <SectionTitle eyebrow="04 · small things, done right" title={"Tiny rules that\nkeep a _4B_ model honest."} hint="every card does something" />
      <div className="cards">
        <Card n="a" title="Speaks Hinglish" note="tap to translate">
          <Flip />
        </Card>
        <Card n="b" title="Quote it, or it didn't happen" note="hover the message">
          <Quote />
        </Card>
        <Card n="c" title="Calendar math lives in code" note="pick a day and a word">
          <Calendar />
        </Card>
        <Card n="d" title="Already done? Dropped." note="press check">
          <Kept />
        </Card>
        <Card n="e" title="25 words. Hard stop." note="type a reply">
          <Counter />
        </Card>
        <Card n="f" title="Runs every night for ₹0" note="numbers from a real run">
          <Speed />
        </Card>
      </div>
    </section>
  );
}

function Card({ n, title, note, children }: { n: string; title: string; note: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 200, damping: 18 });
  const ry = useSpring(0, { stiffness: 200, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useTransform([gx, gy], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,.55), transparent 45%)`);
  return (
    <motion.article
      ref={ref}
      className="card"
      data-cursor="magnify"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * 10);
        rx.set((0.5 - py) * 8);
        gx.set(px * 100);
        gy.set(py * 100);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      <motion.span className="card-glare" style={{ background: glare }} />
      <header className="card-head">
        <span className="card-n">{n}</span>
        <h3>{title}</h3>
      </header>
      <div className="card-body">{children}</div>
      <span className="card-note hand">{note}</span>
    </motion.article>
  );
}

function Flip() {
  const [on, setOn] = useState(false);
  const { play } = useSound();
  const pairs = [
    ["kal bhej dunga", "send it tomorrow"],
    ["parso tak kar dunga", "done in 2 days"],
    ["main dekh leta hu", "I'll look into it"],
  ];
  return (
    <button
      type="button"
      className="flip"
      onClick={() => {
        setOn((o) => !o);
        play("pop");
      }}
      data-cursor="flip"
    >
      {pairs.map(([hi, en], i) => (
        <span key={hi} className="flip-row">
          <motion.span className="flip-inner" animate={{ rotateX: on ? 180 : 0 }} transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 18 }}>
            <span className="flip-face">{hi}</span>
            <span className="flip-face flip-back">{en}</span>
          </motion.span>
        </span>
      ))}
    </button>
  );
}

function Quote() {
  return (
    <div className="quote">
      <p className="quote-msg">
        haan <mark className="quote-mark">kal bhej dunga</mark> ER diagram
        <span className="quote-tag">commitment_words ✓</span>
      </p>
      <p className="quote-msg is-dropped">
        lab slot <mark className="quote-mark">booked</mark> ✅<span className="quote-tag">past tense → not a promise</span>
      </p>
    </div>
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PHRASES = ["tonight", "kal", "parso", "friday", "get back to you"];

function Calendar() {
  const [day, setDay] = useState(4);
  const [phrase, setPhrase] = useState("kal");
  const { play } = useSound();
  const said = new Date(2026, 9, 11 + day);
  const { due, label } = dueDate(said, `I'll do it ${phrase}`, "unspecified");
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return (
    <div className="cal">
      <div className="cal-row">
        {DAY_NAMES.map((d, i) => (
          <button key={d} type="button" className={`cal-chip${i === day ? " is-on" : ""}`} onClick={() => (setDay(i), play("tick"))} data-cursor="pick">
            {i === day && <motion.span layoutId="cal-day" className="cal-pill" />}
            <span>{d}</span>
          </button>
        ))}
      </div>
      <div className="cal-row">
        {PHRASES.map((p) => (
          <button key={p} type="button" className={`cal-chip${p === phrase ? " is-on" : ""}`} onClick={() => (setPhrase(p), play("tick"))} data-cursor="pick">
            {p === phrase && <motion.span layoutId="cal-phrase" className="cal-pill" />}
            <span>{p}</span>
          </button>
        ))}
      </div>
      <p className="cal-out">
        said {fmt(said)} · <b>“{phrase}”</b> → due{" "}
        <motion.b key={+due} className="accent" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {fmt(due)}
        </motion.b>
        <span className="cal-rule">rule: {label}</span>
      </p>
    </div>
  );
}

function Kept() {
  const [done, setDone] = useState(false);
  const { play } = useSound();
  return (
    <div className="kept">
      <p className={`kept-line${done ? " is-struck" : ""}`}>
        <span>I'll book the lab slot for friday</span>
        <svg className="strike" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
          <path d="M1 6 C 30 2, 60 9, 99 4" pathLength={100} />
        </svg>
      </p>
      <p className="kept-later">later: “lab slot booked for friday 3pm ✅”</p>
      <div className="kept-foot">
        <button
          type="button"
          className="chip"
          onClick={() => {
            setDone((d) => !d);
            play(done ? "tick" : "done");
          }}
          data-cursor="check"
        >
          {done ? "undo" : "check"}
        </button>
        {done && (
          <motion.span className="stamp stamp-ok" initial={{ scale: 2.2, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: -8 }}>
            kept
          </motion.span>
        )}
      </div>
    </div>
  );
}

function Counter() {
  const [text, setText] = useState("Sorry yaar, charger kal subah 10 baje deliver karunga");
  const n = words(text);
  const over = n >= 25;
  return (
    <div className={`counter${over ? " is-over" : ""}`}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} aria-label="Try writing a reply" data-cursor="text" />
      <div className="counter-foot">
        <svg viewBox="0 0 36 36" width="34" height="34" aria-hidden="true">
          <circle cx="18" cy="18" r="15" className="ring-bg" />
          <motion.circle cx="18" cy="18" r="15" className="ring-fg" animate={{ pathLength: Math.min(1, n / 25) }} style={{ rotate: -90 }} />
        </svg>
        <motion.span key={over ? "o" : "k"} animate={over ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.4 }}>
          {n} / 25 words {over ? "— Gemma would retry this" : ""}
        </motion.span>
      </div>
    </div>
  );
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  useEffect(() => {
    if (!seen) return;
    const c = animate(0, to, {
      duration: 1.4,
      ease: [0.2, 0.9, 0.1, 1],
      onUpdate: (v) => ref.current && (ref.current.textContent = (to % 1 ? v.toFixed(1) : Math.round(v).toString()) + suffix),
    });
    return () => c.stop();
  }, [seen, to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

function Speed() {
  return (
    <div className="speed">
      <div className="speed-stat">
        <b>
          <CountUp to={recordedSpeed.tokensPerSec} />
        </b>
        <span>tokens/sec</span>
      </div>
      <div className="speed-stat">
        <b>
          <CountUp to={recordedSpeed.seconds} suffix="s" />
        </b>
        <span>whole chat</span>
      </div>
      <div className="speed-stat">
        <b>
          <CountUp to={recordedSpeed.calls} />
        </b>
        <span>model calls</span>
      </div>
      <div className="speed-stat">
        <b>₹0</b>
        <span>per night</span>
      </div>
      <p className="speed-foot">
        {recordedSpeed.model} on a laptop · {recorded.scanned} of your messages read, {recorded.total - recorded.scanned} skipped unread
      </p>
    </div>
  );
}
