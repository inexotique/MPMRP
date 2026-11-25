#!/usr/bin/env python3
"""Narration pipeline: content/<id>.json -> cached Piper WAVs + timing JSON + SRT.
Cache key = hash(voice + say text + speed). Unchanged sentences are never regenerated.
Usage: python3 scripts/tts.py content/demo_spread.json
"""
import hashlib, json, subprocess, sys, wave, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = ROOT / "tts/voices/fr_FR-tom-medium.onnx"
LENGTH_SCALE = "0.92"  # <1 = slightly faster, more dynamic delivery
CACHE = ROOT / "public/vo"
FPS = 60


def synth(text: str) -> pathlib.Path:
    key = hashlib.sha1(f"{VOICE.name}|{LENGTH_SCALE}|{text}".encode()).hexdigest()[:16]
    out = CACHE / f"{key}.wav"
    if not out.exists():
        raw = out.with_suffix(".raw.wav")
        subprocess.run([sys.executable, "-m", "piper", "-m", str(VOICE), "-f", str(raw),
                        "--length-scale", LENGTH_SCALE, "--sentence-silence", "0.1"],
                       input=text.encode(), check=True, capture_output=True)
        # light broadcast polish: highpass, gentle compression, loudness normalisation
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                        "highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,"
                        "loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", "48000", str(out)], check=True)
        raw.unlink()
        print("  generated", out.name, "<-", text[:50])
    return out


def dur(p: pathlib.Path) -> float:
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def srt_t(s: float) -> str:
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"


def main(path: str, start: float = 0.6):
    doc = json.loads(pathlib.Path(path).read_text())
    CACHE.mkdir(parents=True, exist_ok=True)
    t, segs, srt = start, [], []
    for i, s in enumerate(doc["segments"], 1):
        f = synth(s.get("say", s["text"]))
        d = dur(f)
        segs.append({"id": s["id"], "text": s["text"], "file": f"vo/{f.name}",
                     "from": round(t * FPS), "dur": round(d * FPS)})
        srt.append(f"{i}\n{srt_t(t)} --> {srt_t(t + d)}\n{s['text']}\n")
        t += d + s.get("pause", doc.get("gap", 0.35))
    out = {"id": doc["id"], "fps": FPS, "total": round((t + 1.2) * FPS), "segments": segs}
    (ROOT / f"src/generated/{doc['id']}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    (ROOT / "out").mkdir(exist_ok=True)
    (ROOT / f"out/{doc['id']}.srt").write_text("\n".join(srt), encoding="utf-8")
    print(f"{doc['id']}: {t:.1f}s narration, {len(segs)} segments")


if __name__ == "__main__":
    main(sys.argv[1])
