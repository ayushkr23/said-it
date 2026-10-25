import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

type Mode = { kind: "none" | "hover" | "label" | "magnify" | "text"; label?: string };

const INTERACTIVE = "a, button, [role=button], [role=slider], [role=switch], label, select, summary";

/** Dot + springy ring. Elements opt in to labels with data-cursor="drag|open|play|..." or "magnify". */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "none" });
  const [down, setDown] = useState(false);
  const [hidden, setHidden] = useState(true);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 30, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 380, damping: 30, mass: 0.6 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("has-cursor", enabled);
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
      const el = e.target as Element | null;
      const tagged = el?.closest<HTMLElement>("[data-cursor]");
      if (tagged) {
        const v = tagged.dataset.cursor!;
        setMode(v === "magnify" ? { kind: "magnify" } : v === "text" ? { kind: "text" } : { kind: "label", label: v });
      } else if (el?.closest("input:not([type=range]):not([type=checkbox]):not([type=radio]), textarea, [contenteditable]")) {
        setMode({ kind: "text" });
      } else if (el?.closest(INTERACTIVE)) {
        setMode({ kind: "hover" });
      } else {
        setMode({ kind: "none" });
      }
    };
    const leave = () => setHidden(true);
    const press = () => setDown(true);
    const release = () => setDown(false);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = mode.kind === "magnify" ? 112 : mode.kind === "label" ? 74 : mode.kind === "hover" ? 52 : mode.kind === "text" ? 6 : 32;

  return (
    <div className="cursor-layer" aria-hidden="true" style={{ opacity: hidden ? 0 : 1 }}>
      <motion.div
        className={`cursor-ring is-${mode.kind}`}
        style={{ x: rx, y: ry }}
        animate={{ width: size, height: size, scale: down ? 0.82 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        <AnimatePresence mode="popLayout">
          {mode.kind === "label" && (
            <motion.span
              key={mode.label}
              className="cursor-label"
              initial={{ opacity: 0, y: 8, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {mode.label}
            </motion.span>
          )}
          {mode.kind === "magnify" && (
            <motion.span key="mag" className="cursor-lens-handle" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} />
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className="cursor-dot"
        style={{ x, y }}
        animate={{ scale: mode.kind === "label" || mode.kind === "magnify" ? 0 : mode.kind === "text" ? 0 : 1 }}
      />
    </div>
  );
}
