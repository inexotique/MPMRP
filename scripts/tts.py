#!/usr/bin/env python3
"""Narration pipeline (local Piper, free, cached).
content/<id>.json -> public/vo/<hash>.wav (only new/changed lines are synthesised)
                  -> src/generated/<id>.json (frame-accurate timing per beat/line)
                  -> out/<id>.srt
Usage: python3 scripts/tts.py content/ch01.json [content/ch02.json ...]
       python3 scripts/tts.py all
Chapter format: {"id","num","title","accent","music", "beats":[{"v":{...visual}, "lines":[str | {"text","say","pause"}]}]}
"""
import hashlib, json, re, subprocess, sys, wave, pathlib
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = ROOT / "tts/voices/fr_FR-tom-medium.onnx"
LENGTH_SCALE = "0.92"
CACHE = ROOT / "public/vo"
FPS = 60
LINE_GAP, BEAT_GAP, LEAD_IN, TAIL = 0.32, 0.75, 0.9, 1.6

# English trading vocabulary -> French phonetic spelling for Piper (longest match first, case-insensitive, whole words).
PRON = json.loads((ROOT / "content/pronunciation.json").read_text())
_keys = sorted(PRON, key=len, reverse=True)
_rx = re.compile(r"(?<![\w-])(" + "|".join(re.escape(k) for k in _keys) + r")(?![\w-])", re.I)


def phon(text: str) -> str:
    t = _rx.sub(lambda m: PRON[next(k for k in _keys if k.lower() == m.group(0).lower())], text)
    t = re.sub(r"(\d) (\d{3})", r"\1\2", t)           # 10 000 -> 10000 (espeak reads it as one number)
    t = t.replace("€", " euros").replace("$", " dollars").replace("%", " pour cent").replace("→", ",").replace("×", " fois ")
    t = t.replace("1:", "un pour ").replace(" = ", " égale ").replace("…", "...")
    return re.sub(r"\s+", " ", t).strip()


def synth(text: str) -> pathlib.Path:
    key = hashlib.sha1(f"{VOICE.name}|{LENGTH_SCALE}|{text}".encode()).hexdigest()[:16]
    out = CACHE / f"{key}.wav"
    if not out.exists():
        raw = CACHE / f"{key}.raw.wav"
        subprocess.run([sys.executable, "-m", "piper", "-m", str(VOICE), "-f", str(raw),
                        "--length-scale", LENGTH_SCALE, "--sentence-silence", "0.12"],
                       input=text.encode(), check=True, capture_output=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                        "highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,"
                        "loudnorm=I=-16:TP=-1.5:LRA=7,atrim=start=0", "-ar", "48000", str(out)], check=True)
        raw.unlink()
    return out


def dur(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def srt_t(s):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"


def build(path):
    doc = json.loads(pathlib.Path(path).read_text())
    lines = []
    for b in doc["beats"]:
        for l in b["lines"]:
            l = {"text": l} if isinstance(l, str) else l
            l["_say"] = l.get("say") or phon(l["text"])
            lines.append(l)
    with ThreadPoolExecutor(4) as ex:
        files = list(ex.map(lambda l: synth(l["_say"]), lines))
    t, beats, segs, srt, i = LEAD_IN, [], [], [], 0
    for bi, b in enumerate(doc["beats"]):
        bstart = t
        for li, _ in enumerate(b["lines"]):
            l, f = lines[i], files[i]; i += 1
            d = dur(f)
            segs.append({"id": f"b{bi}l{li}", "beat": bi, "line": li, "text": l["text"], "file": f"vo/{f.name}",
                         "from": round(t * FPS), "dur": round(d * FPS)})
            srt.append((t, t + d, l["text"]))
            t += d + l.get("pause", LINE_GAP)
        t += b.get("hold", 0) + BEAT_GAP
        beats.append({"v": b["v"], "from": round(bstart * FPS), "dur": round((t - bstart) * FPS)})
    total = round((t + TAIL) * FPS)
    beats[-1]["dur"] = total - beats[-1]["from"]
    out = {"id": doc["id"], "num": doc.get("num", 0), "title": doc.get("title", ""), "accent": doc.get("accent", "#2BFF88"),
           "music": doc.get("music", 0), "fps": FPS, "total": total, "beats": beats, "segments": segs}
    (ROOT / f"src/generated/{doc['id']}.json").write_text(json.dumps(out, ensure_ascii=False))
    (ROOT / "out").mkdir(exist_ok=True)
    (ROOT / f"out/{doc['id']}.srt").write_text("\n".join(f"{k}\n{srt_t(a)} --> {srt_t(b)}\n{x}\n" for k, (a, b, x) in enumerate(srt, 1)), encoding="utf-8")
    print(f"{doc['id']}: {total / FPS / 60:.2f} min, {len(segs)} lines")


if __name__ == "__main__":
    CACHE.mkdir(parents=True, exist_ok=True)
    paths = sorted(str(p) for p in (ROOT / "content").glob("ch*.json")) if sys.argv[1:] == ["all"] else sys.argv[1:]
    for p in paths:
        build(p)
    ids = sorted(p.stem for p in (ROOT / "src/generated").glob("ch*.json"))
    (ROOT / "src/generated/index.ts").write_text(
        "".join(f"import {i} from './{i}.json';\n" for i in ids) + f"export const CHAPTERS = [{', '.join(ids)}];\n")
