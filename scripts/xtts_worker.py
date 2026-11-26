#!/usr/bin/env python3
"""XTTS-v2 worker (run with the /opt/xtts venv). Reads a JSON list of [text, out_wav] from argv[1],
synthesises each missing file sentence by sentence (XTTS reads trailing periods aloud otherwise)."""
import json, re, sys, pathlib, subprocess
import numpy as np, soundfile as sf, torch

torch.set_num_threads(2)
from TTS.api import TTS

SPEAKER = "Viktor Menelaos"
jobs = [j for j in json.loads(pathlib.Path(sys.argv[1]).read_text()) if not pathlib.Path(j[1]).exists()]
if not jobs:
    sys.exit(0)
m = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
for k, (text, out) in enumerate(jobs, 1):
    parts = []
    for s in re.split(r"(?<=[.?!…])\s+", text.strip()):
        s = s.strip().rstrip(".").strip()
        if not s:
            continue
        w = m.tts(text=s, speaker=SPEAKER, language="fr", split_sentences=False, temperature=0.65)
        parts += [np.array(w, dtype=np.float32), np.zeros(int(24000 * 0.22), dtype=np.float32)]
    raw = out + ".raw.wav"
    sf.write(raw, np.concatenate(parts[:-1]), 24000)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                    "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90,loudnorm=I=-16:TP=-1.5:LRA=9",
                    "-ar", "48000", "-ac", "1", out], check=True)
    pathlib.Path(raw).unlink()
    print(f"{k}/{len(jobs)}", flush=True)
