#!/usr/bin/env python3
"""Join rendered chapters (no re-encode) + global SRT + timestamped summary + MP4 chapter markers.
Output: out/Trading_Academy.mp4, out/Trading_Academy.srt, out/SOMMAIRE.md"""
import json, pathlib, re, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
chs = sorted(p for p in (OUT / "chapters").glob("ch[0-9][0-9].mp4"))


def probe(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))


def ts(s, srt=False):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}" if srt else f"{h:d}:{m:02}:{sec:02}"


t, lst, meta, summary, srt, n = 0.0, [], [";FFMETADATA1"], ["# Sommaire — Trading Academy\n"], [], 1
for p in chs:
    d = probe(p)
    info = json.loads((ROOT / f"src/generated/{p.stem}.json").read_text())
    lst.append(f"file '{p.resolve()}'")
    meta += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={int(t * 1000)}", f"END={int((t + d) * 1000)}", f"title=Chapitre {info['num']} — {info['title']}"]
    summary.append(f"- `{ts(t)}` — Chapitre {info['num']} : {info['title']}")
    for blk in (OUT / f"{p.stem}.srt").read_text(encoding="utf-8").strip().split("\n\n"):
        L = blk.split("\n")
        a, b = [sum(float(x) * k for x, k in zip(re.split("[:,]", v.strip())[:3], (3600, 60, 1))) + int(re.split("[:,]", v.strip())[3]) / 1000 for v in L[1].split("-->")]
        srt.append(f"{n}\n{ts(t + a, True)} --> {ts(t + b, True)}\n" + "\n".join(L[2:]) + "\n"); n += 1
    t += d
(OUT / "concat.txt").write_text("\n".join(lst))
(OUT / "chapters.meta").write_text("\n".join(meta))
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(OUT / "concat.txt"), "-i", str(OUT / "chapters.meta"),
                "-map_metadata", "1", "-map_chapters", "1", "-c", "copy", "-tag:v", "hvc1", "-movflags", "+faststart", str(OUT / "Trading_Academy.mp4")], check=True)
(OUT / "Trading_Academy.srt").write_text("\n".join(srt), encoding="utf-8")
(OUT / "SOMMAIRE.md").write_text("\n".join(summary) + f"\n\nDurée totale : {ts(t)}\n", encoding="utf-8")
(OUT / "concat.txt").unlink(); (OUT / "chapters.meta").unlink()
size = (OUT / "Trading_Academy.mp4").stat().st_size / 1e9
print(f"OK {len(chs)} chapitres · {ts(t)} · {size:.2f} Go")
