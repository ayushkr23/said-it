import { Audio, interpolate, Sequence, staticFile } from "remotion";
import { AUDIO, sec, TIMED, TOTAL_FRAMES, VO_WINDOWS, voBeat } from "../script";

const RAMP = 8;

/** Music volume per frame: full between lines, ducked under the voice with short ramps. */
export function musicVolume(f: number) {
  let duck = 0;
  for (const [a, b] of VO_WINDOWS) {
    const d = interpolate(f, [a - RAMP, a, b, b + RAMP], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    duck = Math.max(duck, d);
  }
  const fadeOut = interpolate(f, [TOTAL_FRAMES - 45, TOTAL_FRAMES], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return fadeIn * fadeOut * interpolate(duck, [0, 1], [AUDIO.musicVolume, AUDIO.musicDuckedVolume]);
}

function cueFrame(id: string, cue: { at: number; word?: string; after?: number }) {
  if (!cue.word) return sec(cue.at);
  const beat = voBeat(id, cue.word, -1);
  return beat < 0 ? sec(cue.at) : Math.max(0, beat + sec(cue.after ?? 0));
}

export function AudioLayer() {
  return (
    <>
      {AUDIO.music && <Audio src={staticFile("music.mp3")} volume={musicVolume} loop />}

      {AUDIO.voiceover &&
        TIMED.map((s) => (
          <Sequence key={s.id} from={s.from + sec(s.voLead ?? 0.25)} durationInFrames={s.frames} name={`VO ${s.index + 1}`}>
            <Audio src={staticFile(`vo/scene-${s.index + 1}.mp3`)} />
          </Sequence>
        ))}

      {AUDIO.sfx &&
        TIMED.flatMap((s) => [
          ...(s.index > 0 && s.transition !== "cut" ? [{ at: 0, kind: "whoosh" as const }] : []),
          ...(s.sfx ?? []),
        ].map((cue, i) => (
          <Sequence key={`${s.id}-${i}`} from={s.from + cueFrame(s.id, cue)} durationInFrames={sec(1)} name={`sfx ${cue.kind}`}>
            <Audio src={staticFile(`sfx/${cue.kind}.wav`)} volume={cue.kind === "whoosh" ? 0.5 : 0.6} />
          </Sequence>
        )))}
    </>
  );
}
