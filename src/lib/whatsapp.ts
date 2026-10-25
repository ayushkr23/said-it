export type Msg = {
  id: number;
  at: Date;
  sender: string;
  text: string;
};

export type ParsedChat = {
  chatName: string;
  messages: Msg[];
  senders: string[];
};

const STAMP =
  /^\[?(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?\s?m\.?)?\]?\s*(?:[-–]\s*)?([^:]{1,60}?):\s?(.*)$/i;

const SKIP = [
  /^<media omitted>$/i,
  /^this message was deleted$/i,
  /^you deleted this message$/i,
  /^<this message was edited>$/i,
  /\.(jpg|jpeg|png|webp|opus|mp4|pdf) \(file attached\)$/i,
  /^(image|video|audio|sticker|gif|document) omitted$/i,
  /^null$/,
];

type Raw = { a: number; b: number; y: number; h: number; m: number; ap?: string; sender: string; text: string };

function clean(line: string) {
  return line.replace(/[\u200e\u200f\u202a-\u202e]/g, "").replace(/[\u202f\u00a0]/g, " ");
}

export function parseWhatsApp(source: string, fileName = ""): ParsedChat {
  const lines = clean(source).split(/\r?\n/);
  const raws: Raw[] = [];

  for (const line of lines) {
    const m = line.match(STAMP);
    if (m) {
      raws.push({
        a: +m[1],
        b: +m[2],
        y: +m[3] < 100 ? 2000 + +m[3] : +m[3],
        h: +m[4],
        m: +m[5],
        ap: m[7]?.replace(/[.\s]/g, "").toLowerCase(),
        sender: m[8].trim(),
        text: m[9],
      });
    } else if (raws.length && line.trim()) {
      raws[raws.length - 1].text += "\n" + line;
    }
  }

  // WhatsApp uses the phone's locale, so the day/month order has to be inferred from the data.
  const dayFirst = raws.some((r) => r.a > 12) || !raws.some((r) => r.b > 12);

  const messages: Msg[] = [];
  for (const r of raws) {
    const text = r.text.trim();
    if (!text || SKIP.some((re) => re.test(text))) continue;
    let hour = r.h;
    if (r.ap === "pm" && hour < 12) hour += 12;
    if (r.ap === "am" && hour === 12) hour = 0;
    const day = dayFirst ? r.a : r.b;
    const month = dayFirst ? r.b : r.a;
    messages.push({ id: messages.length + 1, at: new Date(r.y, month - 1, day, hour, r.m), sender: r.sender, text });
  }

  const counts = new Map<string, number>();
  for (const m of messages) counts.set(m.sender, (counts.get(m.sender) ?? 0) + 1);
  const senders = [...counts.entries()].sort((x, y) => y[1] - x[1]).map(([s]) => s);

  const fromFile = fileName.match(/WhatsApp Chat (?:with|-)\s*(.+?)(?:\.txt)?$/i)?.[1];
  const chatName = fromFile ?? (senders.length > 2 ? "group chat" : senders.slice(0, 2).join(" & ") || "chat");

  return { chatName, messages, senders };
}

export function guessMe(chat: ParsedChat): string {
  const you = chat.senders.find((s) => /^(you|me)$/i.test(s));
  return you ?? chat.senders[0] ?? "";
}
