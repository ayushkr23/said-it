import { unzipSync, strFromU8 } from "fflate";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Page } from "../components/Page";
import { Sloth } from "../components/Sloth";
import { Hand, SplitText } from "../components/Text";
import { Tip, useToast } from "../components/Toast";
import sample from "../data/sample-chat.txt?raw";
import { setMood } from "../lib/mood";
import { DEFAULT_HOST } from "../lib/ollama";
import { defaultToday, findPromises, iso, myRecentMessages, type Promise_, type ScanEvent, type Step, type Verdict } from "../lib/promises";
import { recorded } from "../lib/recorded";
import { useSound } from "../lib/sound";
import { useOllama } from "../lib/useOllama";
import { guessMe, parseWhatsApp, type ParsedChat } from "../lib/whatsapp";

const SAMPLE_NAME = "WhatsApp Chat with DBMS Project 🦥.txt";
const STEP_LABEL: Record<Step, string> = {
  reading: "reading the export",
  scanning: "Gemma is reading your lines",
  checking: "checking what you already did",
  drafting: "drafting one reply",
  done: "done",
};
const fmt = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Run() {
  const [params] = useSearchParams();
  const status = useOllama();
  const toast = useToast();
  const { play } = useSound();

  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [fileName, setFileName] = useState("");
  const [me, setMe] = useState("");
  const [today, setToday] = useState("");
  const [model, setModel] = useState("");
  const [drag, setDrag] = useState(false);
  const [run, setRun] = useState<"idle" | "loading" | "success">("idle");
  const [step, setStep] = useState<{ s: Step; info?: string } | null>(null);
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [replay, setReplay] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!model && status.models.length) {
      setModel(status.models.find((m) => m.name.startsWith("gemma"))?.name ?? status.models[0].name);
    }
  }, [status.models, model]);

  const load = (text: string, name: string) => {
    const c = parseWhatsApp(text, name);
    if (!c.messages.length) {
      toast("That doesn't look like a WhatsApp export.", "🤔");
      setMood("surprised", 1200);
      return null;
    }
    setChat(c);
    setFileName(name);
    setMe(guessMe(c));
    setToday(iso(defaultToday(c)));
    setVerdict(null);
    setScans([]);
    setRun("idle");
    play("pop");
    setMood("happy", 1000);
    toast(`Read ${c.messages.length} messages locally. 0 bytes uploaded.`, "📄");
    return c;
  };

  const loadFile = async (f: File) => {
    if (/\.zip$/i.test(f.name)) {
      const files = unzipSync(new Uint8Array(await f.arrayBuffer()));
      const txt = Object.keys(files).find((k) => /\.txt$/i.test(k));
      if (!txt) return toast("No .txt inside that zip.", "🤔");
      load(strFromU8(files[txt]), f.name.replace(/\.zip$/i, ".txt"));
    } else load(await f.text(), f.name);
  };

  const startReplay = async () => {
    const c = load(sample, SAMPLE_NAME);
    if (!c) return;
    setMe("Ayush");
    setReplay(true);
    setRun("loading");
    setScans([]);
    setVerdict(null);
    const mine = myRecentMessages(c, "Ayush", recorded.today);
    const promised = new Set([...recorded.late, ...recorded.soon, ...recorded.kept].map((p) => p.messageId));
    setTotal(mine.length);
    setStep({ s: "scanning", info: `${mine.length} of your messages` });
    for (const { m } of mine) {
      await sleep(380);
      setScans((s) => [...s, { messageId: m.id, text: m.text, isPromise: promised.has(m.id) }]);
      if (promised.has(m.id)) play("tick");
    }
    setStep({ s: "checking" });
    await sleep(600);
    setStep({ s: "drafting", info: recorded.easiest?.what });
    await sleep(700);
    finish(recorded);
  };

  const autoplayed = useRef(false);
  useEffect(() => {
    if (params.get("demo") && !autoplayed.current) {
      autoplayed.current = true;
      startReplay();
    }
  }, []);

  const finish = (v: Verdict) => {
    setVerdict(v);
    setStep({ s: "done" });
    setRun("success");
    play("done");
    setMood("happy", 2200);
    window.setTimeout(() => setRun("idle"), 1800);
    window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  };

  const start = async () => {
    if (!chat || !me || !model) return;
    setError("");
    setReplay(false);
    setVerdict(null);
    setScans([]);
    setRun("loading");
    setMood("idle");
    const ctl = new AbortController();
    abort.current = ctl;
    const day = new Date(`${today}T00:00:00`);
    setTotal(myRecentMessages(chat, me, day).length);
    try {
      const v = await findPromises({
        chat,
        me,
        today: day,
        model,
        signal: ctl.signal,
        onStep: (s, info) => setStep({ s, info }),
        onScan: (e) => {
          setScans((s) => [...s, e]);
          if (e.isPromise) play("tick");
        },
      });
      finish(v);
    } catch (e) {
      setRun("idle");
      setStep(null);
      if ((e as Error).name === "AbortError") toast("Stopped. Back to napping.", "💤");
      else {
        setError((e as Error).message);
        setMood("surprised", 1500);
      }
    }
  };

  const busy = run === "loading";
  const offline = status.state === "offline";

  return (
    <Page title="Run it — Said It">
      <section className="run">
        <header className="run-head">
          <div className="eyebrow">the tool</div>
          <SplitText as="h1" by="words" onView={false} text={"Drop a chat.\nGet _one_ reply."} />
          <StatusChip status={status} />
        </header>

        <div className="run-grid">
          <div className="run-steps">
            <StepBox n={1} title="Your chat export" done={!!chat}>
              <div
                className={`drop${drag ? " is-drag" : ""}${chat ? " is-loaded" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!drag) setMood("hungry");
                  setDrag(true);
                }}
                onDragLeave={() => {
                  setDrag(false);
                  setMood("idle");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const f = e.dataTransfer.files[0];
                  if (f) loadFile(f);
                }}
                onClick={() => input.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
                data-cursor={chat ? "swap" : "drop"}
              >
                <svg className="drop-ants" aria-hidden="true">
                  <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="18" />
                </svg>
                <Sloth size={64} mood={drag ? "hungry" : chat ? "happy" : undefined} track={false} />
                {chat ? (
                  <div className="drop-text">
                    <b>{fileName}</b>
                    <span>
                      {chat.messages.length} messages · {chat.senders.length} people · read in your browser
                    </span>
                  </div>
                ) : (
                  <div className="drop-text">
                    <b>Drop your WhatsApp export here</b>
                    <span>.txt or the .zip from iPhone · chat → More → Export chat → Without media</span>
                  </div>
                )}
                <input ref={input} type="file" accept=".txt,.zip" hidden onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
              </div>
              <div className="row-gap">
                <button type="button" className="chip" onClick={() => load(sample, SAMPLE_NAME) && setMe("Ayush")} data-cursor="load">
                  use the sample chat
                </button>
                <a className="u-link small" href={`/sample/${encodeURIComponent(SAMPLE_NAME)}`} download>
                  download the sample
                </a>
              </div>
            </StepBox>

            <StepBox n={2} title="Which one is you?" done={!!me} disabled={!chat}>
              <div className="pills">
                {chat?.senders.map((s) => (
                  <button key={s} type="button" className={`pill${s === me ? " is-on" : ""}`} onClick={() => (setMe(s), play("tick"))} data-cursor="me">
                    {s === me && <motion.span layoutId="me-pill" className="pill-bg" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
                    <span>{s}</span>
                  </button>
                ))}
              </div>
              {chat && <Hand className="tiny-hint">only {me}'s messages get read. the others are context, never judged.</Hand>}
            </StepBox>

            <StepBox n={3} title="Model and date" done={!!model} disabled={!chat}>
              <div className="fields">
                <label className="field">
                  <span>model (local)</span>
                  <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!status.models.length}>
                    {!status.models.length && <option>no local models found</option>}
                    {status.models.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} · {(m.size / 1e9).toFixed(1)} GB
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <Tip label="Defaults to the day after the last message, so old exports still make sense">
                    <span>“today” is</span>
                  </Tip>
                  <input type="date" value={today} onChange={(e) => setToday(e.target.value)} />
                </label>
              </div>
            </StepBox>

            <div className="run-go">
              <Button onClick={start} state={run} disabled={!chat || !me || !model || offline} cursor="go">
                {busy ? "Reading…" : "Find my promises"}
              </Button>
              {busy && !replay && (
                <button type="button" className="chip" onClick={() => abort.current?.abort()} data-cursor="stop">
                  stop
                </button>
              )}
              {!busy && (
                <Button onClick={startReplay} variant="ghost" arrow={false} small cursor="play" icon={<span className="play-tri" />}>
                  Replay a recorded run
                </Button>
              )}
            </div>
            {offline && (
              <p className="warn">
                Ollama isn't answering on {DEFAULT_HOST}. Start it with <code>ollama serve</code> and pull a model with <code>ollama pull gemma3:4b</code>. If this page isn't on localhost,
                set <code>OLLAMA_ORIGINS</code> to this site's address. Until then, the recorded run still works.
              </p>
            )}
            {error && <p className="warn">Ollama said: {error}</p>}
          </div>

          <div className="run-live">
            <ScanFeed scans={scans} total={total} step={step} replay={replay} me={me} />
          </div>
        </div>

        <AnimatePresence>{verdict && <Results v={verdict} replay={replay} />}</AnimatePresence>
      </section>
    </Page>
  );
}

function StatusChip({ status }: { status: ReturnType<typeof useOllama> }) {
  const text =
    status.state === "online"
      ? `Ollama online · ${status.models.length} local model${status.models.length === 1 ? "" : "s"}`
      : status.state === "offline"
        ? "Ollama not found on localhost"
        : "looking for Ollama…";
  return (
    <Tip label={status.state === "online" ? "Every request in this page goes to localhost:11434. Open DevTools → Network and check." : "Nothing else is contacted either way"}>
      <span className={`status-chip is-${status.state}`}>
        <span className="status-dot" />
        {text}
      </span>
    </Tip>
  );
}

function StepBox({ n, title, done, disabled, children }: { n: number; title: string; done: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <motion.div className={`step-box${disabled ? " is-disabled" : ""}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + n * 0.08 }}>
      <div className="step-head">
        <span className={`step-n${done ? " is-done" : ""}`}>
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.svg key="ok" viewBox="0 0 24 24" width="16" height="16" className="check-draw" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <path d="M4 12.5 9.5 18 20 6.5" />
              </motion.svg>
            ) : (
              <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                {n}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <h3>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function ScanFeed({ scans, total, step, replay, me }: { scans: ScanEvent[]; total: number; step: { s: Step; info?: string } | null; replay: boolean; me: string }) {
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [scans.length]);
  const pct = total ? scans.length / total : 0;
  return (
    <div className="feed" data-cursor="magnify">
      <div className="feed-head">
        <span>{step ? STEP_LABEL[step.s] : "waiting for a chat"}</span>
        {replay && <span className="badge">recorded run · gemma3:4b · not live</span>}
      </div>
      <div className="feed-bar">
        <motion.div className="feed-bar-fill" animate={{ scaleX: step?.s === "done" ? 1 : pct }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </div>
      {!scans.length ? (
        <div className="feed-empty">
          <Sloth size={110} />
          <Hand>
            {step ? "warming up the model… the first call loads it into memory" : `nothing yet. ${me ? `I'll only read ${me}'s lines.` : "load a chat on the left."}`}
          </Hand>
        </div>
      ) : (
        <ul className="feed-list" ref={list}>
          <AnimatePresence initial={false}>
            {scans.map((s) => (
              <motion.li
                key={s.messageId}
                className={`feed-item${s.isPromise ? " is-promise" : ""}`}
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: s.isPromise ? 1 : 0.5, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <span className="feed-mark">{s.isPromise ? "promise" : "nope"}</span>
                <span className="feed-text">{s.text}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <div className="feed-foot">
        {scans.length}/{total || "–"} read · {scans.filter((s) => s.isPromise).length} promises {step?.info && step.s !== "scanning" ? `· ${step.info}` : ""}
      </div>
    </div>
  );
}

function Results({ v, replay }: { v: Verdict; replay: boolean }) {
  const toast = useToast();
  const { play } = useSound();
  const [copied, setCopied] = useState(false);
  const stats = useMemo(() => {
    const ms = v.stats.reduce((a, b) => a + b.ms, 0);
    const tps = v.stats.length ? v.stats.reduce((a, b) => a + b.tokensPerSec, 0) / v.stats.length : 0;
    return { calls: v.stats.length, s: (ms / 1000).toFixed(1), tps: tps.toFixed(0), model: v.stats[0]?.model };
  }, [v]);

  const copy = async () => {
    await navigator.clipboard.writeText(v.reply);
    setCopied(true);
    play("done");
    toast("Copied. Now go send it.", "📋");
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div id="results" className="results" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 140, damping: 20 }}>
      <div className="results-head">
        <SplitText as="h2" text={v.late.length ? `${v.late.length} late. ${v.soon.length} due by tomorrow.` : v.soon.length ? `${v.soon.length} due by tomorrow.` : "You're clean. Go nap."} />
        <span className="results-sub">
          today = {fmt(v.today)} · {stats.calls} calls to {stats.model} · {stats.s}s · ~{stats.tps} tok/s {replay ? "· recorded" : "· just now, on this machine"}
        </span>
      </div>

      {v.easiest && v.reply && (
        <motion.div className="reply-card" initial={{ rotate: -3, scale: 0.9 }} animate={{ rotate: -1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}>
          <span className="reply-label">the one thing to do · send to {v.easiest.to}</span>
          <p className="reply-text">{v.reply}</p>
          <span className="reply-why">
            closes “{v.easiest.what}” · {v.easiest.daysLate > 0 ? `${v.easiest.daysLate} days late` : "due soon"} · picked because it's the least effort
          </span>
          <Button onClick={copy} state={copied ? "success" : "idle"} variant="accent" arrow={false} cursor="copy" small>
            Copy reply
          </Button>
        </motion.div>
      )}

      <div className="buckets">
        <Bucket title="Already late" items={v.late} tone="late" />
        <Bucket title="Due by tomorrow" items={v.soon} tone="soon" />
      </div>

      <div className="leftovers">
        <motion.div className="trash" whileHover={{ rotate: [0, -6, 6, 0] }} data-cursor="bin">
          🗑️ <b>{v.thrownAway}</b> messages thrown away. You don't need to read them.
        </motion.div>
        {v.kept.length > 0 && (
          <div className="kept-list">
            <b>Kept already, nice:</b>
            {v.kept.map((k) => (
              <span key={k.messageId} className="kept-pill">
                {k.what} ✓
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Bucket({ title, items, tone }: { title: string; items: Promise_[]; tone: "late" | "soon" }) {
  return (
    <div className={`bucket is-${tone}`}>
      <h3>
        {title} <span className="bucket-n">{items.length}</span>
      </h3>
      {!items.length && <p className="bucket-empty hand">nothing here 🎉</p>}
      {items.map((p, i) => (
        <motion.article
          key={p.messageId}
          className="promise"
          initial={{ opacity: 0, y: 20, rotate: i % 2 ? 1.5 : -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ y: -4, rotate: i % 2 ? 0.8 : -0.8 }}
          data-cursor="magnify"
        >
          <span className="stamp">{tone === "late" ? `${p.daysLate}d late` : p.daysLate === 0 ? "due today" : "due tmrw"}</span>
          <h4>{p.what}</h4>
          <p className="promise-quote">“{p.quote}”</p>
          <p className="promise-meta">
            to {p.to} · said {fmt(p.saidAt)} · due {fmt(p.due)} <span className="muted">({p.dueLabel})</span>
          </p>
        </motion.article>
      ))}
    </div>
  );
}
