import { Composition } from "remotion";
import { Explainer } from "./Explainer";
import { FPS, TOTAL_FRAMES } from "./script";

export function Root() {
  return (
    <>
      <Composition id="Explainer" component={Explainer} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{ captions: true }} />
      <Composition id="ExplainerVertical" component={Explainer} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{ captions: true }} />
    </>
  );
}
