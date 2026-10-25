/**
 * Every word on screen and in the voiceover, plus every timing, lives here.
 * Change `seconds` to retime a scene; everything downstream (scene starts, captions,
 * music ducking, SFX) is derived from these numbers.
 */

import VO_FILE from "./vo-timings.json";

export const FPS = 30;
/** Seconds each scene overlaps the previous one, so cuts feel continuous. */
export const OVERLAP = 0.4;

/** Flip these to true once the files exist in public/. */
export const AUDIO = {
  voiceover: true, // public/vo/scene-1.mp3 … scene-9.mp3, then `npm run vo:sync`
  music: false, // public/music.mp3
  sfx: true, // public/sfx/*.wav (generate with `npm run sfx`)
  musicVolume: 0.45,
  musicDuckedVolume: 0.12,
};

export const BRIEF = {
  name: "Said It",
  tagline: "The promises you forgot, found offline.",
  audience: "Anyone whose group chats are full of “kal bhej dunga” they never sent.",
  problem: "Chats bury the promises you make. Summaries tell you what everyone else said, never what you said.",
  url: "saidit.local",
  cta: "Run it on my chats",
  model: "gemma3:4b",
  tokensPerSec: 50,
  secondsPerChat: 23,
};

export type Transition = "cut" | "squash" | "wipe" | "zoom" | "slide";
export type SfxKind = "whoosh" | "pop" | "tick" | "ding";

export type SceneDef = {
  id: string;
  title: string;
  seconds: number;
  transition: Transition;
  /** Voiceover line, also used for word-by-word captions. */
  vo: string;
  /** Seconds after scene start that the voice begins, and how long before the end it should finish. */
  voLead?: number;
  voTail?: number;
  /**
   * Extra sound cues, in seconds from scene start. With a voiceover, a cue with `word`
   * fires `after` seconds from when that word is spoken instead.
   * Transitions get a whoosh automatically.
   */
  sfx?: { at: number; word?: string; after?: number; kind: SfxKind }[];
};

export const SCENES: SceneDef[] = [
  {
    id: "cold",
    title: "Cold open",
    seconds: 5,
    transition: "cut",
    vo: "How many promises did you make this week? Six. You kept one.",
    voLead: 0.3,
    voTail: 0.8,
    sfx: [
      { at: 2.2, kind: "tick" },
      { at: 3.4, word: "Six", kind: "pop" },
      { at: 4.8, word: "kept", kind: "pop" },
    ],
  },
  {
    id: "title",
    title: "Title card",
    seconds: 4.4,
    transition: "squash",
    vo: "Meet Said It. It remembers what you said, so you don't have to.",
    sfx: [{ at: 1.2, kind: "pop" }],
  },
  {
    id: "problem",
    title: "The problem",
    seconds: 11,
    transition: "wipe",
    vo: "Every group chat buries them. Kal bhej dunga. Let me get back to you. Tomorrow, pakka. Summaries tell you what everyone else said. Said It only reads what you said.",
    sfx: [
      { at: 5.2, word: "Summaries", after: -0.33, kind: "tick" },
      { at: 6.0, word: "Summaries", after: 0.67, kind: "pop" },
      { at: 6.8, word: "Summaries", after: 1.67, kind: "pop" },
      { at: 7.6, word: "Summaries", after: 2.67, kind: "pop" },
    ],
  },
  {
    id: "how",
    title: "How it works",
    seconds: 22,
    transition: "zoom",
    vo: "Export a WhatsApp chat. Just a text file on your laptop. Gemma, running locally in Ollama, reads only your messages and quotes the words that make a promise. Code does the calendar: kal is plus one day, parso is plus two. Already did it? It's dropped. Then you get one reply, under twenty-five words, for the easiest late promise.",
  },
  {
    id: "demo",
    title: "Live demo",
    seconds: 8.5,
    transition: "slide",
    vo: "On the site, pull the lever. Other people's messages vanish, your promises get stamped, and the reply pops out.",
  },
  {
    id: "tour",
    title: "Product tour",
    seconds: 11,
    transition: "wipe",
    vo: "Run it reads your export live. The night timeline walks every step. Six detail cards show the rules. And one switch shows why open weights matter.",
  },
  {
    id: "price",
    title: "Pricing and proof",
    seconds: 8,
    transition: "zoom",
    vo: "The price? Zero rupees, every night. Fifty tokens a second on a laptop, and zero bytes uploaded.",
  },
  {
    id: "faq",
    title: "FAQ speed round",
    seconds: 6.5,
    transition: "slide",
    vo: "Uploads my chats? No. Needs wifi? No. Hinglish? Natively.",
  },
  {
    id: "cta",
    title: "End card",
    seconds: 8,
    transition: "squash",
    vo: "Said It. Go be lazy. It runs on your laptop tonight.",
    voTail: 2.5,
  },
];

/* ---------------- on-screen copy per scene ---------------- */

export const COPY = {
  cold: {
    question: "How many promises did you make _this_ _week?_",
    count: 6,
    kept: 1,
    countLabel: "promises",
    keptLabel: "kept",
  },
  title: {
    chips: [
      "runs offline",
      "reads only your lines",
      "Hinglish native",
      "₹0 per night",
      "Gemma 3 · Ollama",
      "one reply, ≤ 25 words",
      "zero bytes uploaded",
    ],
  },
  problem: {
    beforeLabel: "your group chat",
    afterLabel: "what Said It hands you",
    rows: [
      { who: "Riya", text: "ER diagram tu bana de na?", mine: false },
      { who: "you", text: "haan kal bhej dunga ER diagram", mine: true, badge: "9d late" },
      { who: "Kabir", text: "lab ka slot kisi ne book kiya?", mine: false },
      { who: "you", text: "let me check and get back to you", mine: true, badge: "4d late" },
      { who: "Kabir", text: "bro mera charger 😭", mine: false },
      { who: "you", text: "will return your charger tomorrow pakka", mine: true, badge: "3d late" },
    ],
    counterLabel: "messages you'd have to scroll",
    counterTo: 2914,
    punch: "Summaries tell you what _everyone_ _else_ said.",
  },
};

/* ---------------- derived timing (don't edit) ---------------- */

export const sec = (s: number) => Math.round(s * FPS);
export const OVERLAP_FRAMES = sec(OVERLAP);

export type TimedScene = SceneDef & { index: number; from: number; frames: number };

const LEAD = 0.25;
const TAIL = 0.35;

type VoWord = { text: string; start: number; end: number };

/** Real word timings from `npm run vo`, ignored if the line was edited since generating. */
function voWords(index: number): VoWord[] | undefined {
  const rec = (VO_FILE as { scenes: { text: string; words: VoWord[] }[] }).scenes[index];
  if (!AUDIO.voiceover || !rec || rec.text !== SCENES[index].vo || rec.words.length === 0) return undefined;
  return rec.words;
}

export const TIMED: TimedScene[] = (() => {
  let at = 0;
  return SCENES.map((s, index) => {
    const spoken = voWords(index);
    const needed = spoken ? (s.voLead ?? LEAD) + spoken[spoken.length - 1].end + (s.voTail ?? TAIL) : 0;
    const frames = sec(Math.max(s.seconds, needed));
    const from = index === 0 ? 0 : at - OVERLAP_FRAMES;
    at = from + frames;
    return { ...s, index, from, frames };
  });
})();

export const TOTAL_FRAMES = TIMED[TIMED.length - 1].from + TIMED[TIMED.length - 1].frames;

/**
 * Word timings for captions. Uses the real TTS timings when available; otherwise
 * spreads words across the VO window, weighted by word length.
 */
export function captionWords(s: TimedScene) {
  const words = s.vo.split(/\s+/).filter(Boolean);
  const start = s.from + sec(s.voLead ?? LEAD);
  const spoken = voWords(s.index);
  if (spoken && spoken.length === words.length) {
    return words.map((w, i) => ({
      word: w,
      from: start + sec(spoken[i].start),
      to: start + (i + 1 < words.length ? sec(spoken[i + 1].start) : sec(spoken[i].end) + 6),
    }));
  }
  const end = s.from + s.frames - sec(s.voTail ?? TAIL);
  const weights = words.map((w) => 2 + w.replace(/[^\p{L}\p{N}]/gu, "").length + (/[.,?!:]$/.test(w) ? 4 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = start;
  return words.map((w, i) => {
    const len = ((end - start) * weights[i]) / total;
    const out = { word: w, from: Math.round(t), to: Math.round(t + len) };
    t += len;
    return out;
  });
}

/**
 * Frame (relative to the scene's start) at which the voice says `word`, so visuals can
 * land on it. `nth` picks a later repeat. Returns `fallback` when there's no voiceover.
 */
export function voBeat(id: string, word: string, fallback: number, nth = 0) {
  const s = TIMED.find((t) => t.id === id);
  if (!s) return fallback;
  const spoken = voWords(s.index);
  if (!spoken) return fallback;
  const hits = spoken.filter((w) => w.text.toLowerCase() === word.toLowerCase());
  const hit = hits[nth];
  return hit ? sec(s.voLead ?? LEAD) + sec(hit.start) : fallback;
}

/** Frames (absolute) where the voice is talking, for music ducking. */
export const VO_WINDOWS = TIMED.map((s) => {
  const words = captionWords(s);
  return [words[0].from, words[words.length - 1].to] as const;
});
