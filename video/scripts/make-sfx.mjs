// Synthesises the four tiny SFX into public/sfx so the project renders with sound out of the box.
// Replace any of them with your own .wav of the same name.
import { mkdirSync, writeFileSync } from "node:fs";

const RATE = 44100;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const make = (secs, fn) => Array.from({ length: Math.floor(RATE * secs) }, (_, i) => fn(i / RATE, i));

const sounds = {
  // Band-passed noise that sweeps up then fades.
  whoosh: (() => {
    let lp = 0;
    let lp2 = 0;
    return make(0.45, (t) => {
      const env = Math.sin(Math.PI * Math.min(1, t / 0.45)) ** 2;
      const k = 0.02 + 0.25 * (t / 0.45);
      lp += k * (rnd() - lp);
      lp2 += k * (lp - lp2);
      return (lp - lp2) * env * 3.2;
    });
  })(),
  pop: make(0.12, (t) => Math.sin(2 * Math.PI * (700 - 2600 * t) * t) * Math.exp(-t * 38) * 0.8),
  tick: make(0.04, (t) => (Math.sin(2 * Math.PI * 2400 * t) > 0 ? 0.4 : -0.4) * Math.exp(-t * 120)),
  ding: make(0.6, (t) => (Math.sin(2 * Math.PI * 1320 * t) * 0.5 + Math.sin(2 * Math.PI * 1980 * t) * 0.2) * Math.exp(-t * 7)),
};

mkdirSync("public/sfx", { recursive: true });
mkdirSync("public/vo", { recursive: true });
for (const [name, s] of Object.entries(sounds)) writeFileSync(`public/sfx/${name}.wav`, wav(s));
console.log("wrote", Object.keys(sounds).map((n) => `public/sfx/${n}.wav`).join(", "));
