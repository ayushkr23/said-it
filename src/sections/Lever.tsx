import { AnimatePresence, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sloth } from "../components/Sloth";
import { useToast } from "../components/Toast";
import { recorded } from "../lib/recorded";
import { useSound } from "../lib/sound";
import { parseWhatsApp } from "../lib/whatsapp";
import sample from "../data/sample-chat.txt?raw";
import { SectionTitle } from "./Problem";

const STAGES = ["awake", "mute the others", "only promises", "stamp them", "full sloth"];

export function Lever() {
  const chat = useMemo(() => parseWhatsApp(sample, "WhatsApp Chat with DBMS Project 🦥.txt"), []);
  const late = new Map(recorded.late.map((p) => [p.messageId, p]));
  const soon = new Map(recorded.soon.map((p) => [p.messageId, p]));
  const promiseIds = new Set([...late.keys(), ...soon.keys()]);
  const me = "Ayush";

  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [v, setV] = useState(0);
  const [width, setWidth] = useState(0);
  const stage = Math.min(4, Math.floor(v * 4.999));
  const prevStage = useRef(0);
  const { play } = useSound();
  const toast = useToast();

  useEffect(() => {
    const measure = () => setWidth((track.current?.offsetWidth ?? 0) - 64);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useMotionValueEvent(x, "change", (px) => setV(width ? Math.max(0, Math.min(1, px / width)) : 0));

  useEffect(() => {
    if (stage !== prevStage.current) {
      play(stage === 4 ? "done" : "tick");
      if (stage === 4) toast("Full sloth. One message to send, the rest is gone.", "💤");
      prevStage.current = stage;
    }
  }, [stage, play, toast]);

  const setTo = (n: number) => x.set(Math.max(0, Math.min(1, n)) * width);

  const visible = chat.messages.filter((m) => {
    if (stage >= 1 && m.sender !== me) return false;
    if (stage >= 2 && !promiseIds.has(m.id)) return false;
    return true;
  });

  return (
    <section className="section lever" id="lever">
      <SectionTitle eyebrow="02 · the lever" title={"Pull the lever.\nSkip the _reading._"} hint="go on, drag it all the way" />
      <div className="lever-stage">
        <div className="phone" data-cursor="magnify">
          <div className="phone-top">
            <span className="phone-dot" />
            DBMS Project 🦥
            <span className="phone-count">{visible.length} msgs</span>
          </div>
          <motion.ul className="phone-chat" layout>
            <AnimatePresence initial={false}>
              {visible.map((m) => {
                const mine = m.sender === me;
                const p = late.get(m.id) ?? soon.get(m.id);
                return (
                  <motion.li
                    key={m.id}
                    layout
                    className={`bubble${mine ? " is-mine" : ""}${p && stage >= 2 ? " is-promise" : ""}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6, height: 0, marginTop: 0, padding: 0, transition: { duration: 0.3 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  >
                    {!mine && <span className="bubble-who">{m.sender}</span>}
                    {m.text}
                    <AnimatePresence>
                      {p && stage >= 3 && (
                        <motion.span
                          className="stamp"
                          initial={{ scale: 2.4, opacity: 0, rotate: -24 }}
                          animate={{ scale: 1, opacity: 1, rotate: -9 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 18 }}
                        >
                          {late.has(m.id) ? `${p.daysLate}d late` : "due tmrw"}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
          <AnimatePresence>
            {stage === 4 && recorded.easiest && (
              <motion.div
                className="reply-pop"
                initial={{ y: 80, opacity: 0, rotate: 6 }}
                animate={{ y: 0, opacity: 1, rotate: -1.5 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                <span className="reply-label">send this to {recorded.easiest.to}</span>
                {recorded.reply}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lever-side">
          <Sloth size={130} mood={stage === 4 ? "sleepy" : stage >= 2 ? "happy" : undefined} />
          <div className="lever-readout">
            <AnimatePresence mode="wait">
              <motion.span key={stage} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
                {STAGES[stage]}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="lever-note">
            {stage === 0 && `${chat.messages.length} messages. You'd have to scroll all of this.`}
            {stage === 1 && "Other people's messages: gone. Said It only judges what you wrote."}
            {stage === 2 && "Gemma read each of your lines and kept the ones that commit to something."}
            {stage === 3 && "Code did the date math. Kal means +1 day, parso means +2."}
            {stage === 4 && "One reply. Under 25 words. Names the actual thing."}
          </p>
        </div>
      </div>

      <div
        className="lever-track"
        ref={track}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest(".lever-knob")) return;
          const r = track.current!.getBoundingClientRect();
          setTo((e.clientX - r.left - 32) / width);
        }}
      >
        <div className="lever-ticks">
          {STAGES.map((s, i) => (
            <button type="button" key={s} className={`lever-tick${i <= stage ? " is-on" : ""}`} onClick={() => setTo(i / 4)} data-cursor="pull">
              <span>{s}</span>
            </button>
          ))}
        </div>
        <motion.div className="lever-fill" style={{ scaleX: v }} />
        <motion.div
          className="lever-knob"
          role="slider"
          tabIndex={0}
          aria-label="Laziness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(v * 100)}
          aria-valuetext={STAGES[stage]}
          drag="x"
          dragConstraints={{ left: 0, right: width }}
          dragElastic={0.08}
          dragMomentum={false}
          style={{ x }}
          whileDrag={{ scale: 1.15, rotate: 8 }}
          whileHover={{ scale: 1.06 }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") setTo(v + 0.25);
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") setTo(v - 0.25);
          }}
          data-cursor="drag"
        >
          <span className="knob-grip" />
        </motion.div>
      </div>
    </section>
  );
}
