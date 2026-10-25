/**
 * Re-encodes a Remotion master into what YouTube ingests best: H.264 limited-range
 * BT.709 yuv420p, capped at 45 Mbps (the film grain otherwise pushes 4K past 130 Mbps),
 * audio copied as-is, and faststart so processing begins while uploading.
 *
 *     node scripts/youtube-encode.mjs <master.mp4> <out.mp4>
 */
import { execSync } from "node:child_process";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/youtube-encode.mjs <master.mp4> <out.mp4>");
  process.exit(1);
}

execSync(
  [
    "npx remotion ffmpeg -hide_banner -loglevel error -stats -y",
    `-i "${input}"`,
    "-c:v libx264 -preset slow -crf 17 -maxrate 45M -bufsize 90M",
    '-vf "scale=in_range=full:out_range=tv,format=yuv420p"',
    "-color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709",
    "-c:a copy -movflags +faststart",
    `"${output}"`,
  ].join(" "),
  { stdio: "inherit" },
);
console.log(`wrote ${output}`);
