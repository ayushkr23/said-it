# Said It: explainer video

A roughly 87-second product film built with [Remotion](https://remotion.dev). It has two compositions that share the same scenes:

| Composition | Size | Output |
|---|---|---|
| `Explainer` | 1920×1080 | `out/explainer.mp4` |
| `ExplainerVertical` | 1080×1920 | `out/explainer-vertical.mp4` |

## Run it

```bash
npm i
npm run sfx               # synthesizes the whoosh/pop/tick/ding WAVs into public/sfx
npm run dev               # Remotion Studio, scrub every frame
npm run render            # out/explainer.mp4
npm run render:vertical   # out/explainer-vertical.mp4
npm run still             # quick PNG of frame 60
```

## Render for YouTube

```bash
npm run render:youtube   # out/said-it-youtube.mp4  (3840×2160, ~45 Mbps, 320k AAC)
npm run render:shorts    # out/said-it-shorts.mp4   (2160×3840, for Shorts)
```

These render a 4K master, then `scripts/youtube-encode.mjs` re-encodes it to what YouTube ingests best: limited-range BT.709, a bitrate cap (the film grain otherwise pushes 4K past 130 Mbps), and faststart. Uploading 4K gets the video YouTube's higher-quality encode, even for viewers watching at 1080p.

- Close Remotion Studio first; both use port 3000.
- Renders stage frames in your temp folder. If C: is short on space, point it at another drive in the same terminal: `$env:TEMP="D:\path\to\video\.remotion-tmp"; $env:TMP=$env:TEMP`.
- Cursor's built-in video preview can't play AAC audio. Open the MP4 in a normal player.

## Change the copy or timings: `src/script.ts`

Everything spoken or shown on screen lives in this file.

- `SCENES[n].seconds` sets a scene's length. Scene starts, the 0.4 s overlaps (`OVERLAP`), caption timing, music ducking, and SFX cues are all derived from it, so no other file needs editing.
- `SCENES[n].vo` is the voiceover line. Captions are generated from it word by word, with each word's timing weighted by its length. `voLead` and `voTail` trim the window the voice occupies.
- `SCENES[n].transition` sets how the scene enters: `cut`, `squash`, `wipe`, `zoom`, or `slide`.
- `SCENES[n].sfx` holds extra cues as `{ at: seconds, kind }`. Non-cut transitions get a whoosh automatically.
- `COPY` holds the scene-specific on-screen text: headlines, chat rows, counters, chips. Wrap a word in underscores (`_this_`) to render it in the accent color.

Scene-internal animation beats are frame numbers counted from that scene's start, defined at the top of each `src/scenes/S*.tsx`. If you shorten a scene a lot, check those numbers in Studio.

## Change colors and fonts: `src/brand.ts`

`C` is the palette (paper, ink, accent, and so on) and `F` is the font set, loaded through `@remotion/google-fonts`. All scenes and the motion library read from these, so swapping `C.accent` recolors the whole film.

## Swap in the voiceover and music

1. Record one file per scene (ElevenLabs or anything else) reading that scene's `vo` line, and save them as `public/vo/scene-1.mp3` … `public/vo/scene-9.mp3`.
2. Run `npm run vo:sync`. It finds the pauses in each clip, snaps every sentence of the `vo` line to them, and writes word timings to `src/vo-timings.json`.
3. Make sure `AUDIO.voiceover = true` in `src/script.ts`.

After syncing, a scene stretches if its clip is longer than its `seconds`, captions highlight along with the delivery, and beats like the "6" landing on "Six" follow the voice (see `voBeat()` in `src/script.ts`). If you edit a `vo` line, re-record it and re-run `npm run vo:sync`. Until then, that scene falls back to evenly spread captions.

`npm run vo` generates a free placeholder voice instead (Microsoft neural TTS via `python -m pip install edge-tts`), with exact word timings.

For music, put the bed at `public/music.mp3` and set `AUDIO.music = true`. It loops if it's shorter than the film.

Music ducks from `AUDIO.musicVolume` to `AUDIO.musicDuckedVolume` whenever a voice line plays (8-frame ramps) and fades in and out at the ends. Set `AUDIO.sfx = false` to mute the effects. To use your own sounds, replace the WAVs in `public/sfx/`, keeping the same names.

Captions are on by default. Pass the composition prop `captions: false` in Studio to render without them.

## Layout

```
src/
  script.ts         copy + timings (source of truth)
  brand.ts          palette, fonts, shadows
  Explainer.tsx     stitches scenes, transitions, captions, grain, audio
  Root.tsx          landscape + vertical compositions
  motion/           reusable motion library
    core.ts         easing (REVEAL = cubic-bezier(.22,1,.36,1)), springs, useLayout()
    Text.tsx        SplitText, CountUp, TypeWriter, Hand
    Draw.tsx        DrawPath, Doodle (self-drawing SVG doodles)
    UI.tsx          Badge, Bubble, Gauge, Marquee, Chip, Card, FakeCursor
    Mascot.tsx      the sloth, with spring-blended moods
    Stage.tsx       CameraRig, SceneTransition, Grain, Paper
    Captions.tsx    word-highlight captions
    AudioLayer.tsx  music (ducked), voiceover, SFX
  scenes/           one file per scene
```

`useLayout()` returns `vertical`, safe padding, and base type sizes. Scenes branch on it so the same file renders both aspect ratios.
