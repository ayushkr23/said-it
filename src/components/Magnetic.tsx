import { motion, useSpring } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

type Props = { children: ReactNode; radius?: number; strength?: number; className?: string };

/** Drifts toward the cursor inside `radius` px of its edge; the inner layer shifts the other way for depth. */
export function Magnetic({ children, radius = 80, strength = 0.32, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const cfg = { stiffness: 220, damping: 15, mass: 0.5 };
  const x = useSpring(0, cfg);
  const y = useSpring(0, cfg);
  const ix = useSpring(0, cfg);
  const iy = useSpring(0, cfg);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const outside = Math.max(Math.abs(dx) - r.width / 2, Math.abs(dy) - r.height / 2, 0);
      if (outside < radius) {
        const fall = 1 - outside / radius;
        x.set(dx * strength * fall);
        y.set(dy * strength * fall);
        ix.set(-dx * 0.08 * fall);
        iy.set(-dy * 0.08 * fall);
      } else {
        x.set(0);
        y.set(0);
        ix.set(0);
        iy.set(0);
      }
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [radius, strength, x, y, ix, iy]);

  return (
    <motion.span ref={ref} className={`magnetic ${className}`} style={{ x, y }}>
      <motion.span className="magnetic-inner" style={{ x: ix, y: iy }}>
        {children}
      </motion.span>
    </motion.span>
  );
}
