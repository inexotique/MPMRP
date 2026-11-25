#!/usr/bin/env python3
"""Narration pipeline (Edge neural voice "Remy Multilingual" — free, no account; cached per sentence).
content/<id>.json -> public/vo/<hash>.wav (only new/changed lines are synthesised)
                  -> src/generated/<id>.json (frame-accurate timing per beat/line)
                  -> out/<id>.srt
Usage: python3 scripts/tts.py content/ch01.json [content/ch02.json ...]
       python3 scripts/tts.py all
Chapter format: {"id","num","title","accent","music", "beats":[{"v":{...visual}, "lines":[str | {"text","say","pause"}]}]}
"""
import hashlib, json, os, re, subprocess, sys, time, wave, pathlib
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = "fr-FR-RemyMultilingualNeural"
RATE = "+0%"
CACHE = ROOT / "public/vo"
FPS = 60
LINE_GAP, BEAT_GAP, LEAD_IN, TAIL = 0.42, 0.95, 0.9, 1.6

# Light text normalisation for speech (English terms are left as-is: the voice is multilingual).
FIX = [(r"\bEUR/USD\b", "euro dollar"), (r"\bXAU/USD\b", "or contre dollar"), (r"\b1:(\d+)", r"un pour \1"), (r"P&L", "P and L"),
       (r"S&P", "S and P"), (r"→", ","), (r"×", " fois "), (r"÷", " divisé par "), (r" = ", " égale "), (r"CySEC", "Cysec"),
       (r"\bspréd\b", "spread"), (r"\bbide\b", "Bid"), (r"\basque\b", "Ask"), (r"\bpipes\b", "pips"), (r"\bpipe\b", "pip")]


def phon(text: str) -> str:
    t = text
    for a, b in FIX:
        t = re.sub(a, b, t)
    return re.sub(r"\s+", " ", t).strip()


def synth(text: str) -> pathlib.Path:
    key = hashlib.sha1(f"{VOICE}|{RATE}|{text}".encode()).hexdigest()[:16]
    out = CACHE / f"e{key}.wav"
    if not out.exists():
        raw = CACHE / f"e{key}.mp3"
        for attempt in range(4):
            r = subprocess.run(["edge-tts", "--proxy", os.environ.get("HTTPS_PROXY", ""), "--voice", VOICE, f"--rate={RATE}",
                                "--text", text, "--write-media", str(raw)], capture_output=True)
            if r.returncode == 0 and raw.exists() and raw.stat().st_size > 1000:
                break
            time.sleep(2 + attempt * 3)
        else:
            raise RuntimeError(f"edge-tts failed: {text[:60]}")
        # trim leading/trailing silence, gentle broadcast polish, loudness normalisation
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,"
                        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,"
                        "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90,loudnorm=I=-16:TP=-1.5:LRA=7",
                        "-ar", "48000", "-ac", "1", str(out)], check=True)
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
            l["_say"] = phon(l.get("say") or l["text"])
            lines.append(l)
    with ThreadPoolExecutor(6) as ex:
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


# ───────── ElevenLabs engine (TTS_ENGINE=eleven): one request per paragraph → natural prosody + char timestamps ─────────
EL_VOICE, EL_MODEL = "TX3LPaxmHKxFdv7VOQHJ", "eleven_v3"   # Liam · v3


def synth_eleven(text):
    import base64, urllib.request
    key = hashlib.sha1(f"{EL_VOICE}|{EL_MODEL}|{text}".encode()).hexdigest()[:16]
    out, meta = CACHE / f"x{key}.wav", CACHE / f"x{key}.json"
    if not out.exists():
        body = json.dumps({"text": text, "model_id": EL_MODEL, "language_code": "fr",
                           "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "use_speaker_boost": True}}).encode()
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{EL_VOICE}/with-timestamps?output_format=mp3_44100_128",
                                     data=body, headers={"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
        for attempt in range(4):
            try:
                d = json.loads(urllib.request.urlopen(req, timeout=180).read()); break
            except urllib.error.HTTPError as e:
                msg = e.read().decode()[:300]
                if e.code in (401, 402, 403) or "quota" in msg: raise RuntimeError(f"ElevenLabs {e.code}: {msg}")
                time.sleep(3 + 5 * attempt)
        mp3 = CACHE / f"x{key}.mp3"; mp3.write_bytes(base64.b64decode(d["audio_base64"]))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-af",
                        "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90,loudnorm=I=-16:TP=-1.5:LRA=9",
                        "-ar", "48000", "-ac", "1", str(out)], check=True)
        mp3.unlink(); meta.write_text(json.dumps(d["alignment"]))
    return out, json.loads(meta.read_text())


def build_eleven(path):
    doc = json.loads(pathlib.Path(path).read_text())
    t, beats, segs, srt = LEAD_IN, [], [], []
    for bi, b in enumerate(doc["beats"]):
        bstart = t
        lines = [{"text": l} if isinstance(l, str) else dict(l) for l in b["lines"]]
        groups, cur = [], []
        for li, l in enumerate(lines):
            cur.append(li)
            if "pause" in l or li == len(lines) - 1: groups.append(cur); cur = []
        for g in groups:
            says = [phon(lines[li].get("say") or lines[li]["text"]) for li in g]
            text, offs, o = "", [], 0
            for sy in says:
                offs.append((len(text), len(text) + len(sy))); text += sy + " "
            f, al = synth_eleven(text.strip())
            cs, ce = al["character_start_times_seconds"], al["character_end_times_seconds"]
            ad = dur(f)
            for k, li in enumerate(g):
                a, z = offs[k]; z = min(z, len(ce)) - 1
                ls, le = cs[min(a, len(cs) - 1)], ce[max(z, 0)]
                l = lines[li]
                seg = {"id": f"b{bi}l{li}", "beat": bi, "line": li, "text": l["text"], "from": round((t + ls) * FPS), "dur": max(1, round((le - ls) * FPS))}
                dw, sw = l["text"].split(), says[k].split()
                if len(dw) == len(sw):  # exact per-word timing for captions
                    pos, words = a, []
                    for w in sw:
                        idx = text.find(w, pos); words.append(round((t + cs[min(idx, len(cs) - 1)]) * FPS)); pos = idx + len(w)
                    seg["words"] = words
                if k == 0: seg["audio"] = {"file": f"vo/{f.name}", "from": round(t * FPS), "dur": round(ad * FPS) + 2}
                segs.append(seg); srt.append((t + ls, t + le, l["text"]))
            last = lines[g[-1]]
            t += ad + (last.get("pause", 0.15))
        t += b.get("hold", 0) + BEAT_GAP
        beats.append({"v": b["v"], "from": round(bstart * FPS), "dur": round((t - bstart) * FPS)})
    total = round((t + TAIL) * FPS)
    beats[-1]["dur"] = total - beats[-1]["from"]
    out = {"id": doc["id"], "num": doc.get("num", 0), "title": doc.get("title", ""), "accent": doc.get("accent", "#2BFF88"),
           "music": doc.get("music", 0), "fps": FPS, "total": total, "beats": beats, "segments": segs}
    (ROOT / f"src/generated/{doc['id']}.json").write_text(json.dumps(out, ensure_ascii=False))
    (ROOT / f"out/{doc['id']}.srt").write_text("\n".join(f"{k}\n{srt_t(a)} --> {srt_t(b)}\n{x}\n" for k, (a, b, x) in enumerate(srt, 1)), encoding="utf-8")
    print(f"{doc['id']}: {total / FPS / 60:.2f} min, {len(segs)} lines (ElevenLabs)")


if __name__ == "__main__":
    CACHE.mkdir(parents=True, exist_ok=True)
    paths = sorted(str(p) for p in (ROOT / "content").glob("ch*.json")) if sys.argv[1:] == ["all"] else sys.argv[1:]
    for p in paths:
        (build_eleven if os.environ.get("TTS_ENGINE") == "eleven" else build)(p)
    ids = sorted(p.stem for p in (ROOT / "src/generated").glob("ch*.json"))
    (ROOT / "src/generated/index.ts").write_text(
        "".join(f"import {i} from './{i}.json';\n" for i in ids) + f"export const CHAPTERS = [{', '.join(ids)}];\n")
