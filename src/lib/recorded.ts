import raw from "../data/recorded.json";
import type { Promise_, Verdict } from "./promises";

type RawPromise = Omit<Promise_, "saidAt" | "due"> & { saidAt: string; due: string };

const revive = <T extends RawPromise>(p: T) => ({ ...p, saidAt: new Date(p.saidAt), due: new Date(p.due) });

/** A real gemma3:4b run on the bundled sample chat, saved by scripts/check-parse.ts --run --save. */
export const recorded: Verdict = {
  ...(raw as unknown as Verdict),
  late: raw.late.map(revive),
  soon: raw.soon.map(revive),
  kept: raw.kept.map(revive),
  easiest: raw.easiest ? revive(raw.easiest) : null,
  today: new Date(raw.today),
};

export const recordedSpeed = (() => {
  const s = recorded.stats;
  const out = s.reduce((a, b) => a + b.outTokens, 0);
  const ms = s.reduce((a, b) => a + b.ms, 0);
  return {
    calls: s.length,
    seconds: Math.round(ms / 100) / 10,
    tokensPerSec: Math.round(s.reduce((a, b) => a + b.tokensPerSec, 0) / Math.max(1, s.length)),
    outTokens: out,
    model: s[0]?.model ?? "gemma3:4b",
  };
})();
