import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setMood } from "../lib/mood";
import { useSound } from "../lib/sound";
import { Sloth } from "./Sloth";
import { Tip } from "./Toast";

type Item = { id: string; label: string; section?: boolean; to?: string };

const HOME_ITEMS: Item[] = [
  { id: "problem", label: "Problem", section: true },
  { id: "lever", label: "Lever", section: true },
  { id: "night", label: "Night", section: true },
  { id: "details", label: "Details", section: true },
  { id: "open", label: "Why open", section: true },
];
const ROUTE_ITEMS: Item[] = [
  { id: "/", label: "Home", to: "/" },
  { id: "/app", label: "Run it", to: "/app" },
  { id: "/notes", label: "Build notes", to: "/notes" },
];

export function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    const t = window.setTimeout(() => ids.forEach((id) => document.getElementById(id) && io.observe(document.getElementById(id)!)), 300);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
    };
  }, [ids.join(), enabled]);
  return active;
}

export function goToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Logo() {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();
  return (
    <motion.a
      href="/"
      className="logo"
      onClick={(e) => {
        e.preventDefault();
        navigate("/");
      }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      animate={hover ? { rotate: [0, -8, 7, -4, 0] } : { rotate: 0 }}
      transition={{ duration: 0.5 }}
      aria-label="Said It home"
    >
      <Sloth size={34} mood={hover ? "wink" : undefined} track={false} />
      <span className="logo-word">
        Said It<span className="logo-dot">.</span>
      </span>
    </motion.a>
  );
}

export function SoundToggle() {
  const { on, toggle } = useSound();
  return (
    <Tip label={on ? "Mute the pops" : "Sound is off. Tap for tiny pops"}>
      <button type="button" className={`sound-btn${on ? " is-on" : ""}`} onClick={toggle} aria-pressed={on} aria-label="Toggle sound">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          <motion.path
            d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          />
          <motion.path
            d="M16 9.5l5 5M21 9.5l-5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: on ? 0 : 1, opacity: on ? 0 : 1 }}
          />
        </svg>
      </button>
    </Tip>
  );
}

export function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { play } = useSound();
  const home = pathname === "/";
  const items = home ? HOME_ITEMS : ROUTE_ITEMS;
  const section = useActiveSection(HOME_ITEMS.map((i) => i.id), home);
  const active = home ? section : pathname;
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 240 && y > prev + 2 && !menu);
    if (y < prev - 2) setHidden(false);
  });

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  const go = (it: Item) => {
    play("tick");
    setMenu(false);
    if (it.to) navigate(it.to);
    else if (home) goToSection(it.id);
    else navigate("/", { state: { scrollTo: it.id } });
  };

  return (
    <>
      <motion.header
        className={`nav${scrolled ? " is-scrolled" : ""}`}
        initial={{ y: -90 }}
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Logo />
        <nav className="nav-items" onPointerLeave={() => setHovered(null)} aria-label="Main">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`nav-item roll-host${active === it.id ? " is-active" : ""}`}
              onPointerEnter={() => setHovered(it.id)}
              onClick={() => go(it)}
              aria-current={active === it.id ? "true" : undefined}
            >
              {hovered === it.id && (
                <motion.span layoutId="nav-hover" className="nav-hover-pill" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
              )}
              {active === it.id && (
                <motion.span layoutId="nav-active" className="nav-active-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <span className="nav-label">{it.label}</span>
            </button>
          ))}
        </nav>
        <div className="nav-end">
          <SoundToggle />
          {home && (
            <button type="button" className="nav-cta" onClick={() => navigate("/app")} onPointerEnter={() => setMood("happy", 900)} data-cursor="open">
              Run it
            </button>
          )}
          <button type="button" className={`burger${menu ? " is-open" : ""}`} onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
            <motion.span animate={menu ? { rotate: 45, y: 4 } : { rotate: 0, y: -3 }} />
            <motion.span animate={menu ? { rotate: -45, y: -4 } : { rotate: 0, y: 3 }} />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="mobile-menu"
            initial={{ clipPath: "circle(0% at 92% 4%)" }}
            animate={{ clipPath: "circle(150% at 92% 4%)" }}
            exit={{ clipPath: "circle(0% at 92% 4%)" }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
          >
            <ul>
              {[...items, ...(home ? [{ id: "/app", label: "Run it", to: "/app" }, { id: "/notes", label: "Build notes", to: "/notes" }] : [])].map((it, i) => (
                <li key={it.id} className="split-mask">
                  <motion.button
                    type="button"
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "110%" }}
                    transition={{ delay: 0.18 + i * 0.06, duration: 0.6, ease: [0.2, 0.9, 0.1, 1] }}
                    onClick={() => go(it)}
                  >
                    <span className="mm-num">0{i + 1}</span>
                    {it.label}
                  </motion.button>
                </li>
              ))}
            </ul>
            <motion.div className="mm-sloth" initial={{ y: 200, rotate: 20 }} animate={{ y: 0, rotate: -6 }} transition={{ delay: 0.4, type: "spring" }}>
              <Sloth size={140} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return <motion.div className="scroll-progress" style={{ scaleX }} />;
}

export function Intro({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 850);
      setCount(Math.round(p * p * 6));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const done = window.setTimeout(onDone, 1300);
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [onDone]);

  return (
    <motion.div className="intro" exit={{ clipPath: "inset(0 0 100% 0)" }} transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}>
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 380, damping: 14 }}>
        <Sloth size={110} mood={count >= 6 ? "happy" : "surprised"} track={false} />
      </motion.div>
      <div className="intro-count">
        <span className="intro-num">{count}</span> promises found
      </div>
      <div className="intro-word split-mask">
        <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: [0.2, 0.9, 0.1, 1] }}>
          Said It<span className="logo-dot">.</span>
        </motion.span>
      </div>
      <span className="intro-skip hand">click anywhere to skip</span>
    </motion.div>
  );
}
