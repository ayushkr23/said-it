import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Kind = "tick" | "pop" | "thunk" | "done";
type SoundApi = { on: boolean; toggle: () => void; play: (k: Kind) => void };

const SoundCtx = createContext<SoundApi>({ on: false, toggle: () => {}, play: () => {} });

export function SoundProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(() => localStorage.getItem("saidit-sound") === "1");
  const ctx = useRef<AudioContext | null>(null);
  const onRef = useRef(on);
  onRef.current = on;

  useEffect(() => localStorage.setItem("saidit-sound", on ? "1" : "0"), [on]);

  const blip = useCallback((force: boolean, k: Kind) => {
    if (!onRef.current && !force) return;
    ctx.current ??= new AudioContext();
    const ac = ctx.current;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain).connect(ac.destination);
    const shape: Record<Kind, [OscillatorType, number, number, number, number]> = {
      tick: ["square", 2200, 1800, 0.025, 0.03],
      pop: ["sine", 720, 240, 0.09, 0.12],
      thunk: ["triangle", 180, 90, 0.12, 0.16],
      done: ["sine", 660, 1320, 0.16, 0.1],
    };
    const [type, f0, f1, len, vol] = shape[k];
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + len);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.start(t);
    osc.stop(t + len + 0.02);
  }, []);

  const api = useMemo<SoundApi>(
    () => ({
      on,
      play: (k) => blip(false, k),
      toggle: () =>
        setOn((v) => {
          if (!v) blip(true, "pop");
          return !v;
        }),
    }),
    [on, blip],
  );

  return <SoundCtx.Provider value={api}>{children}</SoundCtx.Provider>;
}

export const useSound = () => useContext(SoundCtx);
