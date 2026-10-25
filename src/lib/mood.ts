import { useEffect, useState } from "react";

export type Mood = "idle" | "sleepy" | "surprised" | "happy" | "wink" | "hungry";

let current: Mood = "idle";
let timer: number | undefined;
const subs = new Set<(m: Mood) => void>();

/** Sets the mascot's mood everywhere; `ms` makes it temporary. */
export function setMood(m: Mood, ms?: number) {
  window.clearTimeout(timer);
  current = m;
  subs.forEach((f) => f(m));
  if (ms) timer = window.setTimeout(() => setMood("idle"), ms);
}

export function useGlobalMood() {
  const [m, set] = useState<Mood>(current);
  useEffect(() => {
    subs.add(set);
    return () => void subs.delete(set);
  }, []);
  return m;
}
