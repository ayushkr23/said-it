/**
 * Syncs your own voiceover (e.g. from ElevenLabs) to the video.
 *
 * Reads public/vo/scene-N.mp3, finds the pauses with ffmpeg's silencedetect, snaps each
 * sentence of the matching `vo` line in src/script.ts to a pause, and spreads the words
 * across the speech in between. Writes src/vo-timings.json, which drives scene lengths,
 * caption highlighting, and the visual beats keyed to spoken words.
 *
 *     npm run vo:sync
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOISE = "-38dB";
const MIN_PAUSE = 0.18;

const src = readFileSync(join(ROOT, "src/script.ts"), "utf8");
const body = src.split("export const SCENES")[1].split("export const COPY")[0];
const lines = [...body.matchAll(/^\s*vo:\s*"([^"]*)"/gm)].map((m) => m[1]);

function analyse(file) {
  const out = execSync(`npx remotion ffmpeg -hide_banner -i "${file}" -af silencedetect=noise=${NOISE}:d=${MIN_PAUSE} -f null - 2>&1`, {
    cwd: ROOT,
    encoding: "utf8",
  });
  const [, hh, mm, ss] = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const duration = +hh * 3600 + +mm * 60 + +ss;
  const silences = [];
  for (const m of out.matchAll(/silence_(start|end): ([\d.]+)/g)) {
    if (m[1] === "start") silences.push({ s: +m[2], e: duration });
    else silences[silences.length - 1].e = +m[2];
  }
  let start = 0;
  let end = duration;
  const pauses = [];
  for (const p of silences) {
    if (p.s < 0.05) start = p.e;
    else if (p.e > duration - 0.05) end = p.s;
    else pauses.push(p);
  }
  return { duration, start, end, pauses };
}

function speechTime(a, b, pauses) {
  return b - a - pauses.filter((p) => p.s > a && p.e < b).reduce((n, p) => n + (p.e - p.s), 0);
}

/** Maps a fraction of the speaking time in [a, b] to a real time, skipping pauses. */
function speechClock(a, b, pauses) {
  const inside = pauses.filter((p) => p.s > a && p.e < b);
  const talk = b - a - inside.reduce((n, p) => n + (p.e - p.s), 0);
  return (frac) => {
    let left = frac * talk;
    let t = a;
    for (const p of inside) {
      if (t + left <= p.s) break;
      left -= p.s - t;
      t = p.e;
    }
    return t + left;
  };
}

const weight = (w) => 1 + w.replace(/[^\p{L}\p{N}]/gu, "").length;

function align(text, { start, end, pauses }) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const sentences = [];
  let cur = [];
  for (const t of tokens) {
    cur.push(t);
    if (/[.?!]["”]?$/.test(t)) (sentences.push(cur), (cur = []));
  }
  if (cur.length) sentences.push(cur);

  // Pick which pauses are sentence breaks: the set whose spans best match each sentence's
  // share of the words (dynamic programming over start, pauses..., end).
  const total = tokens.reduce((n, t) => n + weight(t), 0);
  const talkAll = speechTime(start, end, pauses);
  const K = sentences.length;
  const nodes = [{ s: start, e: start }, ...pauses, { s: end, e: end }];
  const N = nodes.length;
  const share = sentences.map((sent) => (sent.reduce((n, t) => n + weight(t), 0) / total) * talkAll);
  const cost = Array.from({ length: K + 1 }, () => new Array(N).fill(Infinity));
  const prev = Array.from({ length: K + 1 }, () => new Array(N).fill(-1));
  cost[0][0] = 0;
  for (let k = 1; k <= K; k++) {
    for (let j = 1; j < N; j++) {
      if ((k === K) !== (j === N - 1)) continue;
      for (let i = 0; i < j; i++) {
        if (!isFinite(cost[k - 1][i])) continue;
        const talk = speechTime(nodes[i].e, nodes[j].s, pauses);
        const c = cost[k - 1][i] + Math.log(Math.max(talk, 0.05) / share[k - 1]) ** 2;
        if (c < cost[k][j]) (cost[k][j] = c), (prev[k][j] = i);
      }
    }
  }

  const bounds = new Array(K + 1);
  if (isFinite(cost[K][N - 1])) {
    for (let k = K, j = N - 1; k >= 0; j = prev[k][j], k--) bounds[k] = nodes[j];
  } else {
    // More sentences than pauses: fall back to proportional breaks.
    const clock = speechClock(start, end, pauses);
    let acc = 0;
    bounds[0] = nodes[0];
    sentences.forEach((sent, k) => {
      acc += sent.reduce((n, t) => n + weight(t), 0);
      const t = clock(acc / total);
      bounds[k + 1] = { s: t, e: t };
    });
  }

  const words = [];
  sentences.forEach((sent, k) => {
    const a = bounds[k].e;
    const b = bounds[k + 1].s;
    const local = speechClock(a, b, pauses);
    const sum = sent.reduce((n, t) => n + weight(t), 0);
    let w = 0;
    for (const t of sent) {
      const from = local(w / sum);
      w += weight(t);
      words.push({ text: t.replace(/[^\p{L}\p{N}'’-]/gu, ""), start: +from.toFixed(3), end: +local(w / sum).toFixed(3) });
    }
  });
  return words;
}

const scenes = [];
lines.forEach((text, i) => {
  const file = join(ROOT, "public/vo", `scene-${i + 1}.mp3`);
  if (!existsSync(file)) {
    console.log(`scene-${i + 1}.mp3  missing, skipped`);
    scenes.push({ text: "", duration: 0, words: [] });
    return;
  }
  const a = analyse(file);
  const words = align(text, a);
  scenes.push({ text, duration: +a.duration.toFixed(3), words });
  console.log(`scene-${i + 1}.mp3  ${a.duration.toFixed(2)}s  speech ${a.start.toFixed(2)}–${a.end.toFixed(2)}s  ${a.pauses.length} pauses  ${words.length} words`);
});

writeFileSync(join(ROOT, "src/vo-timings.json"), JSON.stringify({ source: "measured", scenes }, null, 1));
console.log("wrote src/vo-timings.json");
