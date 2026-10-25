import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "../components/Button";
import { Page } from "../components/Page";
import { Hand, ScrollInk, SplitText } from "../components/Text";
import { recordedSpeed } from "../lib/recorded";
import { useSound } from "../lib/sound";

const ATTEMPTS = [
  {
    tag: "try 1",
    title: "One big prompt",
    verdict: "missed half",
    body: "All of my messages in one prompt, one JSON list out. Gemma 3 4B found 4 of the 6 promises, said “friday” meant tomorrow, and put “kal” two days out. It also took 78 seconds, mostly loading the model.",
  },
  {
    tag: "try 2",
    title: "One message at a time",
    verdict: "flagged everything",
    body: "Asking about each message separately fixed recall, then overshot: “lol same energy” and “sent the SQL dump” both came back as promises, and the “did you already do it?” check matched a lab booking to a phone charger.",
  },
  {
    tag: "try 3",
    title: "Make it show its work",
    verdict: "6 of 6, 1 kept, 0 junk",
    body: "The model now has to copy the exact commitment words. If the quote isn't really in the message, or the message is past tense, it doesn't count. Dates moved into code. “Already done?” became a yes/no question about one later message, and only for messages that look like a completion.",
  },
];

export default function Notes() {
  const [open, setOpen] = useState(2);
  const { play } = useSound();
  return (
    <Page title="Build notes — Said It">
      <article className="notes">
        <div className="eyebrow">build notes</div>
        <SplitText as="h1" by="words" onView={false} text={"A small model,\nkept _honest._"} />
        <p className="lead">
          Said It runs {recordedSpeed.model} through Ollama on a laptop. It's slow-and-steady on purpose: about {recordedSpeed.seconds} seconds and {recordedSpeed.calls} small model calls for the sample
          chat. Here's what broke on the way there.
        </p>

        <div className="attempts">
          {ATTEMPTS.map((a, i) => (
            <motion.button
              key={a.tag}
              type="button"
              layout
              className={`attempt${open === i ? " is-open" : ""}`}
              onClick={() => {
                setOpen(i);
                play("tick");
              }}
              data-cursor={open === i ? undefined : "open"}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.div layout="position" className="attempt-head">
                <span className="attempt-tag">{a.tag}</span>
                <span className="attempt-title">{a.title}</span>
                <span className={`attempt-verdict${i === 2 ? " is-good" : ""}`}>{a.verdict}</span>
              </motion.div>
              {open === i && (
                <motion.p className="attempt-body" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                  {a.body}
                </motion.p>
              )}
            </motion.button>
          ))}
        </div>

        <h2 className="notes-h">Why open matters here</h2>
        <ScrollInk className="notes-ink">
          {`A WhatsApp export is the most personal file on a phone, and most of it is _other_ _people._ They never agreed to have their messages uploaded to an API. With an open-weight model, the export, the prompts and the answers all stay on localhost. It also runs every night for _₹0,_ works in airplane mode, and when a better Hinglish model ships, switching is a dropdown.`}
        </ScrollInk>

        <h2 className="notes-h">The rules that made 4B enough</h2>
        <ul className="rules">
          <li>
            <b>Evidence or nothing.</b> The schema asks for <code>commitment_words</code> before <code>is_promise</code>. Code checks the quote is really in the message.
          </li>
          <li>
            <b>No calendar math in the model.</b> <code>kal</code> → +1, <code>parso</code> → +2, weekday names → the next one, no date → stale after 2 days.
          </li>
          <li>
            <b>Narrow questions.</b> “Did this one later message finish that one task?” instead of “find which message finished it”.
          </li>
          <li>
            <b>Hard limits are checked, not hoped for.</b> Replies over 25 words or missing the thing's name get regenerated, at most three tries.
          </li>
          <li>
            <b>Read less.</b> Only your own messages from the last 21 days, and nothing under three words. “lol” doesn't need a model.
          </li>
        </ul>

        <Hand className="notes-sign">— built slowly, on purpose 🦥</Hand>
        <div className="hero-ctas">
          <Button to="/app" cursor="open">
            Try it
          </Button>
          <Button to="/" variant="ghost" cursor="home">
            Back home
          </Button>
        </div>
      </article>
    </Page>
  );
}
