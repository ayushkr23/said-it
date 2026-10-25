import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button, ULink } from "../components/Button";
import { Sloth } from "../components/Sloth";
import { Hand, SplitText } from "../components/Text";
import { useSound } from "../lib/sound";
import { SectionTitle } from "./Problem";

const LOOP = "M10 70 C 180 8, 420 8, 590 70 C 420 152, 180 152, 10 90";
const OUT = "M10 80 C 200 80, 400 80, 590 80";

const ROWS: [string, string, string][] = [
  ["Where Riya's and Kabir's names go", "someone else's server", "nowhere. this laptop"],
  ["Cost of running it every night", "per token, forever", "₹0 after one download"],
  ["Works with wifi off", "no", "yes"],
  ["Hinglish not good enough?", "wait for a vendor", "swap the model in a dropdown"],
  ["Can you read every prompt?", "partly", "all of it, in promises.ts"],
];

export function Open() {
  const [open, setOpen] = useState(true);
  const { play } = useSound();
  const flip = () => {
    setOpen((o) => !o);
    play("tick");
  };
  return (
    <section className="section open" id="open">
      <SectionTitle eyebrow="05 · why open" title={"Your friends never\n_agreed_ to an upload."} hint="flip the switch" />

      <div className="open-switch-row">
        <span className={!open ? "is-on" : ""}>closed API</span>
        <button type="button" role="switch" aria-checked={open} className={`switch${open ? " is-open" : ""}`} onClick={flip} data-cursor="flip" aria-label="Open weights">
          <motion.span className="switch-knob" layout transition={{ type: "spring", stiffness: 600, damping: 30 }} />
        </button>
        <span className={open ? "is-on" : ""}>open weights</span>
      </div>

      <div className={`flow${open ? " is-open" : ""}`} data-cursor="magnify">
        <span className="flow-fence hand">{open ? "your laptop — nothing leaves this box" : "your laptop"}</span>
        <div className="flow-node">
          <span className="flow-icon">📄</span>
          <span>_chat.txt</span>
        </div>
        <svg className="flow-svg" viewBox="0 0 600 160" aria-hidden="true">
          <AnimatePresence mode="wait">
            <motion.g key={open ? "o" : "c"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <motion.path
                id={open ? "flow-o" : "flow-c"}
                d={open ? LOOP : OUT}
                className="flow-path"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
              />
              <circle r="9" className="packet">
                <animateMotion dur={open ? "2.6s" : "1.4s"} repeatCount="indefinite" path={open ? LOOP : OUT} />
              </circle>
            </motion.g>
          </AnimatePresence>
        </svg>
        <AnimatePresence mode="wait">
          <motion.div
            key={open ? "o" : "c"}
            className={`flow-node flow-dest${open ? "" : " is-cloud"}`}
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {open ? (
              <>
                <Sloth size={56} mood="happy" track={false} />
                <span>gemma3:4b · localhost</span>
              </>
            ) : (
              <>
                <span className="flow-icon">☁️</span>
                <span>api.someone-else.com</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="compare">
        {ROWS.map(([q, closed, op], i) => (
          <motion.div key={q} className="compare-row" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
            <span className="compare-q">{q}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={open ? "o" : "c"}
                className={`compare-a${open ? " is-good" : ""}`}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                {open ? op : closed}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <div className="honest">
        <div className="honest-col">
          <h3>Where open won</h3>
          <p>
            A WhatsApp export is full of people who never signed up for anything. Keeping it on localhost isn't a feature toggle, it's the only version I'd run on my own chats.
            And because the model is a file on disk, it runs every night for free and I can swap it the day a better Hinglish model ships.
          </p>
        </div>
        <div className="honest-col">
          <h3>Where it cost me</h3>
          <p>
            Gemma 3 4B first missed half the promises, then flagged “lol same energy” as one. The fix was to stop trusting it with what small models are bad at: it must quote its evidence, code does the dates,
            and “already done?” is a yes/no question. Read the <ULink to="/notes">build notes</ULink>.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Outro() {
  return (
    <section className="outro">
      <Hand className="outro-hint">he's earned a nap</Hand>
      <SplitText as="h2" by="chars" className="outro-title" text={"Go be _lazy._"} />
      <div className="outro-ctas">
        <Button to="/app" cursor="open">
          Run it on my chats
        </Button>
        <Button to="/notes" variant="ghost" cursor="read">
          Build notes
        </Button>
      </div>
      <div className="branch" aria-hidden="true">
        <svg viewBox="0 0 800 60" preserveAspectRatio="none">
          <path d="M0 30 C 200 10, 400 50, 800 24" />
          <path d="M520 30 q 18 -24 46 -20 M220 24 q -10 -20 -36 -22" />
        </svg>
        <motion.div className="branch-sloth" animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <Sloth size={110} mood="sleepy" track={false} />
        </motion.div>
      </div>
      <footer className="foot">
        <span>Said It.</span>
        <span>Gemma 3 · Ollama · React · runs offline.</span>
      </footer>
    </section>
  );
}
