import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { goToSection } from "./Chrome";

const EASE = [0.7, 0, 0.2, 1] as const;

/** Route wrapper: an ink curtain wipes up on the way out and peels off the top on the way in. */
export function Page({ children, title }: { children: ReactNode; title: string }) {
  const { state } = useLocation();
  useEffect(() => {
    document.title = title;
    const target = (state as { scrollTo?: string } | null)?.scrollTo;
    if (target) window.setTimeout(() => goToSection(target), 450);
    else window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <motion.main className="page" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}>
        {children}
      </motion.main>
      <motion.div className="wipe" initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} exit={{ scaleY: 0 }} style={{ originY: 0 }} transition={{ duration: 0.55, ease: EASE }}>
        <span className="wipe-word">{title.split(" —")[0]}</span>
      </motion.div>
      <motion.div className="wipe wipe-accent" initial={{ scaleY: 0 }} animate={{ scaleY: 0 }} exit={{ scaleY: 1 }} style={{ originY: 1 }} transition={{ duration: 0.45, ease: EASE }} />
    </>
  );
}
