#!/usr/bin/env python3
"""ElevenLabs sound effects (cached: a file that exists is never regenerated).
Key is injected by the environment proxy; no key in code."""
import json, pathlib, subprocess, urllib.request

OUT = pathlib.Path(__file__).resolve().parent.parent / "public/sfx"
SFX = {
    "whoosh": ("fast clean airy whoosh transition, modern tech commercial, no music", 1.0),
    "sweep": ("smooth cinematic transition sweep, soft filtered noise rising then falling", 1.5),
    "impact": ("soft deep cinematic impact with subtle sub bass boom, clean, tech trailer", 2.0),
    "riser": ("short tension riser, electronic, clean, ends abruptly", 2.0),
    "click": ("crisp digital UI click, single, short, modern app interface", 0.5),
    "pop": ("soft bubbly UI pop, short, satisfying app interface element appearing", 0.5),
    "ding": ("gentle digital notification chime, modern app, single note", 1.0),
    "validate": ("positive success confirmation sound, two quick ascending digital tones, UI", 1.0),
    "bass": ("subtle low sub bass pulse hit, short, clean electronic", 1.0),
    "tick": ("soft clock tick, single, clean digital", 0.5),
    "type": ("short burst of soft keyboard typing, clean", 1.0),
}


def gen(name, prompt, dur):
    out = OUT / f"{name}.wav"
    if out.exists() and (OUT / f"{name}.eleven").exists():
        return
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
                                 data=json.dumps({"text": prompt, "duration_seconds": dur, "prompt_influence": 0.6}).encode(),
                                 headers={"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
    mp3 = OUT / f"{name}.mp3"
    mp3.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-af", "loudnorm=I=-18:TP=-1.5",
                    "-ar", "48000", "-ac", "2", str(out)], check=True)
    mp3.unlink(); (OUT / f"{name}.eleven").write_text(prompt)
    print("generated", name)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for k, (p, d) in SFX.items():
        try:
            gen(k, p, d)
        except Exception as e:  # keep the procedural fallback file if the API refuses
            print("FAILED", k, e)
