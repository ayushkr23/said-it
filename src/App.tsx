import { AnimatePresence, MotionConfig } from "motion/react";
import { useCallback, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Intro, Nav, ScrollProgress } from "./components/Chrome";
import { Cursor } from "./components/Cursor";
import { ToastProvider } from "./components/Toast";
import { SoundProvider } from "./lib/sound";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Run from "./pages/Run";

export default function App() {
  const location = useLocation();
  const [intro, setIntro] = useState(() => !sessionStorage.getItem("saidit-intro"));
  const finish = useCallback(() => {
    sessionStorage.setItem("saidit-intro", "1");
    setIntro(false);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <SoundProvider>
        <ToastProvider>
          <AnimatePresence>{intro && <Intro key="intro" onDone={finish} />}</AnimatePresence>
          <ScrollProgress />
          <Nav />
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/app" element={<Run />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </AnimatePresence>
          <Cursor />
        </ToastProvider>
      </SoundProvider>
    </MotionConfig>
  );
}
