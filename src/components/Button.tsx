import { AnimatePresence, motion } from "motion/react";
import { useRef, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSound } from "../lib/sound";
import { Magnetic } from "./Magnetic";
import { RollText } from "./Text";

type Props = {
  children: string;
  to?: string;
  href?: string;
  onClick?: (e: MouseEvent) => void;
  variant?: "solid" | "ghost" | "accent";
  state?: "idle" | "loading" | "success";
  arrow?: boolean;
  icon?: ReactNode;
  cursor?: string;
  small?: boolean;
  disabled?: boolean;
  magnetic?: boolean;
};

const Arrow = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
    <path d="M3 10h13M11 4.5 16.5 10 11 15.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Button({
  children,
  to,
  href,
  onClick,
  variant = "solid",
  state = "idle",
  arrow = true,
  icon,
  cursor,
  small,
  disabled,
  magnetic = true,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { play } = useSound();

  /** Parks the fill circle where the pointer crossed the edge, so it grows in from (and shrinks out to) that spot. */
  const edge = (e: PointerEvent, entering: boolean) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--fx", `${e.clientX - r.left}px`);
    el.style.setProperty("--fy", `${e.clientY - r.top}px`);
    el.classList.toggle("is-hover", entering);
    if (entering) play("tick");
  };

  const click = (e: MouseEvent) => {
    if (disabled || state === "loading") return;
    play("pop");
    onClick?.(e);
    if (to) navigate(to);
    else if (href) window.open(href, "_blank", "noopener");
  };

  const busy = state !== "idle";
  const btn = (
    <motion.button
      ref={ref}
      type="button"
      layout
      className={`btn btn-${variant}${small ? " btn-sm" : ""}${busy ? ` is-${state}` : ""}`}
      onPointerEnter={(e) => edge(e, true)}
      onPointerLeave={(e) => edge(e, false)}
      onClick={click}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      data-cursor={cursor}
      disabled={disabled}
      aria-label={children}
      aria-busy={state === "loading"}
    >
      <span className="btn-fill" aria-hidden="true" />
      <AnimatePresence mode="popLayout" initial={false}>
        {state === "loading" ? (
          <motion.span key="load" className="btn-content" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
            <span className="spinner" />
            <span className="btn-busy-label">{children}</span>
          </motion.span>
        ) : state === "success" ? (
          <motion.span key="ok" className="btn-content" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <svg viewBox="0 0 24 24" width="22" height="22" className="check-draw" aria-label="done">
              <path d="M4 12.5 9.5 18 20 6.5" />
            </svg>
          </motion.span>
        ) : (
          <motion.span key="idle" className="btn-content" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {icon}
            <RollText>{children}</RollText>
            {arrow && (
              <span className="btn-arrow" aria-hidden="true">
                <span className="arrow-a">
                  <Arrow />
                </span>
                <span className="arrow-b">
                  <Arrow />
                </span>
              </span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );

  return magnetic ? <Magnetic>{btn}</Magnetic> : btn;
}

export function ULink({ children, onClick, href, to }: { children: ReactNode; onClick?: () => void; href?: string; to?: string }) {
  const navigate = useNavigate();
  return (
    <a
      className="u-link"
      href={href ?? (to ? `#${to}` : "#")}
      target={href ? "_blank" : undefined}
      rel={href ? "noreferrer" : undefined}
      onClick={(e) => {
        if (to || onClick) e.preventDefault();
        onClick?.();
        if (to) navigate(to);
      }}
    >
      {children}
    </a>
  );
}
