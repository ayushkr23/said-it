import { AnimatePresence, motion, useSpring } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Toast = { id: number; text: string; icon?: string };
const ToastCtx = createContext<(text: string, icon?: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const n = useRef(0);
  const push = useCallback((text: string, icon = "🦥") => {
    const id = ++n.current;
    setList((l) => [...l.slice(-2), { id, text, icon }]);
    window.setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div
              key={t.id}
              layout
              className="toast"
              initial={{ opacity: 0, y: 40, scale: 0.85, rotate: -3 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 520, damping: 28 }}
            >
              <span className="toast-icon">{t.icon}</span>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/** Tooltip that springs in above the element and leans a little toward the cursor. */
export function Tip({ label, children }: { label: string; children: ReactElement }) {
  const [open, setOpen] = useState(false);
  const host = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 300, damping: 22 });
  const y = useSpring(0, { stiffness: 300, damping: 22 });

  useEffect(() => {
    if (!open) return;
    const move = (e: PointerEvent) => {
      const r = host.current?.getBoundingClientRect();
      if (!r) return;
      const cx = r.left + r.width / 2;
      x.set(cx + (e.clientX - cx) * 0.35);
      y.set(r.top - 10 + (e.clientY - r.top) * 0.12);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [open, x, y]);

  const show = () => {
    const r = host.current?.getBoundingClientRect();
    if (r) {
      x.jump(r.left + r.width / 2);
      y.jump(r.top - 10);
    }
    setOpen(true);
  };

  return (
    <span ref={host} className="tip-host" onPointerEnter={show} onPointerLeave={() => setOpen(false)} onFocus={show} onBlur={() => setOpen(false)}>
      {children}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.span className="tip" style={{ left: x, top: y }} role="tooltip">
              <motion.span
                className="tip-body"
                initial={{ opacity: 0, scale: 0.6, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 4, transition: { duration: 0.12 } }}
                transition={{ type: "spring", stiffness: 600, damping: 26 }}
              >
                {label}
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  );
}
