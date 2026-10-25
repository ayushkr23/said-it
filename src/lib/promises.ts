import { chatJSON, type ChatStats } from "./ollama.ts";
import type { Msg, ParsedChat } from "./whatsapp.ts";

export const WHEN = ["same_day", "next_day", "in_2_days", "this_week", "next_week", "unspecified"] as const;
export type When = (typeof WHEN)[number];

export type Promise_ = {
  messageId: number;
  quote: string;
  saidAt: Date;
  what: string;
  to: string;
  due: Date;
  dueLabel: string;
  effort: number;
  daysLate: number;
};

export type ScanEvent = { messageId: number; text: string; isPromise: boolean; what?: string };

export type Verdict = {
  late: Promise_[];
  soon: Promise_[];
  kept: (Promise_ & { keptBy: string })[];
  easiest: Promise_ | null;
  reply: string;
  thrownAway: number;
  scanned: number;
  total: number;
  today: Date;
  stats: ChatStats[];
};

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(startOfDay(d).getTime() + n * DAY);
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const weekday = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short" });

const DAYS = [
  ["sunday", "sun", "ravivar", "itwaar"],
  ["monday", "mon", "somvar", "somwar"],
  ["tuesday", "tue", "mangalvar"],
  ["wednesday", "wed", "budhvar"],
  ["thursday", "thu", "thurs", "guruvar"],
  ["friday", "fri", "shukravar"],
  ["saturday", "sat", "shanivar"],
];

/** Deadlines are read from the words in the message; the model's guess is only a fallback. */
export function dueDate(said: Date, text: string, modelGuess: When): { due: Date; label: string } {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, " ")} `;
  const has = (...w: string[]) => w.some((x) => t.includes(` ${x} `));

  if (has("parso", "parson") || t.includes(" day after ")) return { due: addDays(said, 2), label: "parso" };
  if (has("kal", "kl", "tomorrow", "tmrw", "tmr", "tomoro")) return { due: addDays(said, 1), label: "kal / tomorrow" };
  if (has("aaj", "today", "tonight", "eod", "abhi", "raat", "shaam", "now")) return { due: addDays(said, 0), label: "today" };
  for (let i = 0; i < 7; i++) {
    if (has(...DAYS[i])) {
      const ahead = (i - said.getDay() + 7) % 7 || 7;
      return { due: addDays(said, ahead), label: DAYS[i][0] };
    }
  }
  if (has("weekend")) return { due: addDays(said, (7 - said.getDay()) % 7 || 7), label: "weekend" };
  if (t.includes(" next week ")) return { due: addDays(said, 7), label: "next week" };
  if (t.includes(" this week ")) return { due: addDays(said, Math.max(0, 5 - said.getDay())), label: "this week" };

  const fallback: Record<When, [number, string]> = {
    same_day: [0, "today"],
    next_day: [1, "tomorrow"],
    in_2_days: [2, "in 2 days"],
    this_week: [Math.max(0, 5 - said.getDay()), "this week"],
    next_week: [7, "next week"],
    // "I'll get back to you" with no date goes stale after two days.
    unspecified: [2, "no date, so 2 days"],
  };
  const [n, label] = fallback[WHEN.includes(modelGuess) ? modelGuess : "unspecified"];
  return { due: addDays(said, n), label };
}

export function defaultToday(chat: ParsedChat): Date {
  const last = chat.messages.at(-1)?.at ?? new Date();
  return addDays(last, 1);
}

export function myRecentMessages(chat: ParsedChat, me: string, today: Date, windowDays = 21, max = 80) {
  const from = addDays(today, -windowDays).getTime();
  const until = addDays(today, 1).getTime();
  const picked = chat.messages
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.sender === me && m.at.getTime() >= from && m.at.getTime() < until)
    // "lol", "5 min", "😅" can't carry a promise; skipping them saves a model call each.
    .filter(({ m }) => (m.text.match(/[a-z]{2,}/gi)?.length ?? 0) >= 3);
  return picked.slice(-max).map(({ m, i }) => {
    let before: Msg | undefined;
    for (let j = i - 1; j >= 0; j--) {
      if (chat.messages[j].sender !== me) {
        before = chat.messages[j];
        break;
      }
    }
    return { m, before };
  });
}

const CLASSIFY_SYSTEM = `You decide if ONE WhatsApp message contains a promise by the sender (called ME).
Messages are often Hinglish (Hindi in English letters) mixed with English.

A promise means ME says they WILL do a specific task for someone in the future.

First fill commitment_words: copy, exactly as written, the few words where ME says they will do it.
Typical commitment words: "bhej dunga", "kar dunga", "I'll book", "will return", "get back to you",
"share karta hu", "dekh leta hu", "I will send", "done by EOD".
If ME does not commit to a future task, commitment_words is "" and is_promise is false.

These are NOT promises (commitment_words ""):
- "lol same energy" (a reaction)
- "sent the notes btw" / "bhej diya" / "slot booked ✅" (already done, past tense)
- "kaun aa raha hai?" (a question)
- "yesss someday" / "we should go sometime" (a vague wish, no task)

If it is a promise also give:
- what: the task in 2 to 6 plain English words starting with a verb, like "send ER diagram".
  Keep the nouns from the message ("doc" means document).
- to: who it was promised to. Use the context person's name if ME is replying to them, else "group".
- when: same_day, next_day, in_2_days, this_week, next_week or unspecified
- effort: 1 = one message or something already ready, 2 = under an hour, 3 = real work
If it is not a promise, set what and to to "" and effort to 1.`;

const CLASSIFY_SCHEMA = {
  type: "object",
  properties: {
    commitment_words: { type: "string" },
    is_promise: { type: "boolean" },
    what: { type: "string" },
    to: { type: "string" },
    when: { type: "string", enum: WHEN },
    effort: { type: "integer", enum: [1, 2, 3] },
  },
  required: ["commitment_words", "is_promise", "what", "to", "when", "effort"],
};

const KEPT_SYSTEM = `ME promised to do a task earlier. Later ME sent one more message.
Answer done = true only if that later message says ME already finished THE SAME task.
Same task means the same object: a message about the lab slot does not finish a promise about a charger or a diagram.
same_thing: name the object both messages talk about, or "" if they are about different things.`;

const KEPT_SCHEMA = {
  type: "object",
  properties: { same_thing: { type: "string" }, done: { type: "boolean" } },
  required: ["same_thing", "done"],
};

const DONE_MARKERS =
  /(✅|☑|✔|\b(done|sent|booked|returned|shared|submitted|finished|uploaded|paid|here it is|here you go|bhej diya|kar diya|de diya|ho gaya|hogaya|lauta diya)\b)/i;

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const REPLY_SYSTEM = `You write ONE WhatsApp reply that ME sends to close a promise they forgot.
Rules:
- Under 25 words. Shorter is better.
- Match the language of ME's original message. If it was Hinglish, reply in casual Hinglish.
- Own it in at most three words ("my bad", "sorry yaar"). No long apology, no excuses.
- Mention the actual thing by name.
- Give one concrete new time today or tomorrow, like "by 9 tonight" or "kal subah 10 baje".
- At most one emoji, only at the end. No quotes around the reply.`;

const REPLY_SCHEMA = {
  type: "object",
  properties: { reply: { type: "string" } },
  required: ["reply"],
};

export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export type Step = "reading" | "scanning" | "checking" | "drafting" | "done";

export async function findPromises(opts: {
  chat: ParsedChat;
  me: string;
  today: Date;
  model: string;
  host?: string;
  signal?: AbortSignal;
  onStep?: (s: Step, info?: string) => void;
  onScan?: (e: ScanEvent) => void;
}): Promise<Verdict> {
  const { chat, me, today, model, host, signal, onStep, onScan } = opts;
  onStep?.("reading");
  const mine = myRecentMessages(chat, me, today);
  const stats: ChatStats[] = [];
  const ask = async <T,>(system: string, user: string, schema: object) => {
    const r = await chatJSON<T>({ host, model, signal, system, user, schema });
    stats.push(r.stats);
    return r.data;
  };

  onStep?.("scanning", `${mine.length} of your messages`);
  const found: Promise_[] = [];
  for (const { m, before } of mine) {
    const ctx = before ? `Context, ${before.sender} said just before: "${before.text.slice(0, 120).replace(/\n/g, " ")}"\n` : "";
    const c = await ask<{ commitment_words: string; is_promise: boolean; what: string; to: string; when: When; effort: number }>(
      CLASSIFY_SYSTEM,
      `${ctx}Sent on ${weekday(m.at)} ${iso(m.at)}.\nME: ${m.text}`,
      CLASSIFY_SCHEMA,
    );
    const quoted = norm(c.commitment_words);
    const grounded = quoted.length > 2 && norm(m.text).includes(quoted) && !DONE_MARKERS.test(m.text);
    const isPromise = c.is_promise && grounded;
    onScan?.({ messageId: m.id, text: m.text, isPromise, what: c.what });
    if (!isPromise) continue;
    const { due, label } = dueDate(m.at, m.text, c.when);
    const to = c.to.trim();
    found.push({
      messageId: m.id,
      quote: m.text,
      saidAt: m.at,
      what: c.what.trim() || m.text.slice(0, 40),
      to: chat.senders.includes(to) && to !== me ? to : (before?.sender ?? "group"),
      due,
      dueLabel: label,
      effort: Math.min(3, Math.max(1, c.effort || 2)),
      daysLate: Math.round((startOfDay(today).getTime() - due.getTime()) / DAY),
    });
  }

  onStep?.("checking", `${found.length} promises`);
  const open: Promise_[] = [];
  const kept: Verdict["kept"] = [];
  for (const p of found) {
    const candidates = chat.messages.filter((m) => m.sender === me && m.id > p.messageId && DONE_MARKERS.test(m.text));
    let by: Msg | undefined;
    for (const m of candidates) {
      const k = await ask<{ same_thing: string; done: boolean }>(
        KEPT_SYSTEM,
        `Earlier promise: "${p.quote}" (task: ${p.what})\nLater message: "${m.text}"`,
        KEPT_SCHEMA,
      );
      if (k.done && k.same_thing.trim()) {
        by = m;
        break;
      }
    }
    if (by) kept.push({ ...p, keptBy: by.text });
    else open.push(p);
  }

  const t0 = startOfDay(today).getTime();
  const late = open.filter((p) => p.due.getTime() < t0).sort((a, b) => b.daysLate - a.daysLate);
  const soon = open.filter((p) => p.due.getTime() >= t0 && p.due.getTime() <= t0 + DAY).sort((a, b) => +a.due - +b.due);
  const pool = late.length ? late : soon;
  const easiest = [...pool].sort((a, b) => a.effort - b.effort || +b.saidAt - +a.saidAt)[0] ?? null;

  let reply = "";
  if (easiest) {
    onStep?.("drafting", easiest.what);
    const thing = easiest.what.split(/\s+/).slice(1).join(" ") || easiest.what;
    const key = norm(thing).split(" ").sort((a, b) => b.length - a.length)[0] ?? "";
    const prompt = `ME originally wrote to ${easiest.to} on ${iso(easiest.saidAt)}: "${easiest.quote}"
The promise: ${easiest.what}. ${easiest.daysLate > 0 ? `It is ${easiest.daysLate} day(s) late.` : "It is due very soon."}
The reply must say "${thing}".
Write the reply.`;
    for (let attempt = 0; attempt < 3; attempt++) {
      reply = (await ask<{ reply: string }>(REPLY_SYSTEM, prompt, REPLY_SCHEMA)).reply.trim().replace(/^["“]|["”]$/g, "");
      if (words(reply) < 25 && norm(reply).includes(key)) break;
    }
    if (words(reply) >= 25) reply = reply.split(/\s+/).slice(0, 24).join(" ") + "…";
  }

  onStep?.("done");
  return {
    late,
    soon,
    kept,
    easiest,
    reply,
    thrownAway: chat.messages.length - late.length - soon.length,
    scanned: mine.length,
    total: chat.messages.length,
    today,
    stats,
  };
}
