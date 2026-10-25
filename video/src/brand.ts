import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/** Same palette as the website. One accent, one ink, warm paper. */
export const C = {
  paper: "#F2EBDD",
  paperHi: "#FBF7EF",
  paperLo: "#E6DCC8",
  fur: "#D9C7A6",
  ink: "#1E1B17",
  ink2: "rgba(30,27,23,0.62)",
  ink3: "rgba(30,27,23,0.14)",
  accent: "#F2542D",
  accentSoft: "rgba(242,84,45,0.16)",
};

export const F = {
  display: loadBricolage("normal", { weights: ["500", "700", "800"], subsets: ["latin"] }).fontFamily,
  hand: loadCaveat("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily,
  mono: loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily,
};

export const SHADOW = (n = 6, color = C.ink) => `${n}px ${n}px 0 ${color}`;
