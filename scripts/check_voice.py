#!/usr/bin/env python3
"""Automatic narration QA: transcribe every generated line with Whisper and compare to the script.
Lines whose transcription differs too much are listed in out/voice_check.txt.
Usage: python3 scripts/check_voice.py ch01 [ch02 ...]   (or: all)"""
import difflib, json, os, pathlib, re, subprocess, sys
import numpy as np

os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
from faster_whisper import WhisperModel

ROOT = pathlib.Path(__file__).resolve().parent.parent
norm = lambda s: [w for w in re.sub(r"[^a-zàâçéèêëîïôûùüÿœ' ]", " ", s.lower().replace("’", "'")).split() if w]
ids = sorted(p.stem for p in (ROOT / "src/generated").glob("ch*.json")) if sys.argv[1:] == ["all"] else sys.argv[1:]
model = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
report, total, bad, flagged = [], 0, 0, []
for cid in ids:
    for s in json.loads((ROOT / f"src/generated/{cid}.json").read_text())["segments"]:
        if not s.get("file"):
            continue
        pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ROOT / "public" / s["file"]), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
        segs, _ = model.transcribe(np.frombuffer(pcm, np.int16).astype(np.float32) / 32768, language="fr", beam_size=1, vad_filter=False)
        heard = " ".join(x.text for x in segs).strip()
        r = difflib.SequenceMatcher(None, norm(s["text"]), norm(heard)).ratio()
        total += 1
        if r < 0.8:
            bad += 1
            if r < 0.7: flagged.append(str(ROOT / "public" / s["file"]))
            report.append(f"[{cid} {s['id']}] {r:.2f}\n  texte : {s['text']}\n  entendu: {heard}\n")
(ROOT / f"out/flagged_{'_'.join(ids)}.txt").write_text("\n".join(flagged))
(ROOT / f"out/voice_check_{'_'.join(ids)}.txt").write_text(f"{bad}/{total} lignes à vérifier\n\n" + "\n".join(report), encoding="utf-8")
print(f"{bad}/{total} lignes à vérifier")
