"""
Generates the voiceover with Microsoft's neural TTS (edge-tts, free, needs internet).

Reads every `vo: "..."` line from src/script.ts in scene order, writes
public/vo/scene-N.mp3, and records real word timings in src/vo-timings.json so
captions highlight each word exactly when it is spoken.

    python -m pip install edge-tts
    python scripts/make_vo.py [--voice en-IN-NeerjaExpressiveNeural] [--rate=+18%]
"""

import argparse
import asyncio
import json
import os
import re

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "src", "script.ts")
OUT_DIR = os.path.join(ROOT, "public", "vo")
TIMINGS = os.path.join(ROOT, "src", "vo-timings.json")

# edge-tts returns 48 kbps mono MP3, so byte count gives the duration.
BYTES_PER_SEC = 48_000 / 8
TICKS = 10_000_000  # boundary offsets are in 100 ns units


def read_lines():
    src = open(SCRIPT, encoding="utf-8").read()
    body = src.split("export const SCENES", 1)[1].split("export const COPY", 1)[0]
    return re.findall(r'^\s*vo:\s*"([^"]*)"', body, flags=re.M)


async def speak(text, voice, rate, path):
    words = []
    size = 0
    tts = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    with open(path, "wb") as f:
        async for chunk in tts.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
                size += len(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / TICKS
                words.append({"text": chunk["text"], "start": round(start, 3), "end": round(start + chunk["duration"] / TICKS, 3)})
    return {"text": text, "duration": round(size / BYTES_PER_SEC, 3), "words": words}


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="en-IN-NeerjaExpressiveNeural")
    ap.add_argument("--rate", default="+18%")
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    lines = read_lines()
    timings = {"voice": args.voice, "rate": args.rate, "scenes": []}
    for i, line in enumerate(lines, 1):
        info = await speak(line, args.voice, args.rate, os.path.join(OUT_DIR, f"scene-{i}.mp3"))
        timings["scenes"].append(info)
        print(f"scene-{i}.mp3  {info['duration']:5.2f}s  {len(info['words'])} words")

    with open(TIMINGS, "w", encoding="utf-8") as f:
        json.dump(timings, f, indent=1, ensure_ascii=False)
    print(f"wrote {os.path.relpath(TIMINGS, ROOT)}")


asyncio.run(main())
