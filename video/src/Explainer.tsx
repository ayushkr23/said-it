import type { ComponentType } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AudioLayer } from "./motion/AudioLayer";
import { Captions } from "./motion/Captions";
import { Grain, Paper, SceneTransition } from "./motion/Stage";
import { S1ColdOpen } from "./scenes/S1ColdOpen";
import { S2Title } from "./scenes/S2Title";
import { S3Problem } from "./scenes/S3Problem";
import { S4How } from "./scenes/S4How";
import { S5Demo } from "./scenes/S5Demo";
import { S6Tour } from "./scenes/S6Tour";
import { S7Price } from "./scenes/S7Price";
import { S8Faq } from "./scenes/S8Faq";
import { S9Cta } from "./scenes/S9Cta";
import { TIMED } from "./script";

const SCENES: Record<string, ComponentType> = {
  cold: S1ColdOpen,
  title: S2Title,
  problem: S3Problem,
  how: S4How,
  demo: S5Demo,
  tour: S6Tour,
  price: S7Price,
  faq: S8Faq,
  cta: S9Cta,
};

export function Explainer({ captions = true }: { captions?: boolean }) {
  return (
    <AbsoluteFill>
      <Paper />
      {TIMED.map((s) => {
        const Scene = SCENES[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.frames} name={`${s.index + 1}. ${s.title}`}>
            <SceneTransition type={s.transition}>
              <Scene />
            </SceneTransition>
          </Sequence>
        );
      })}
      {captions && <Captions />}
      <Grain />
      <AudioLayer />
    </AbsoluteFill>
  );
}
