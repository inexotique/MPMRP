#!/usr/bin/env bash
# Full automatic production: XTTS narration per chapter (+ Whisper QA, one automatic retry of bad lines),
# rendering in parallel as soon as a chapter is validated (out/ready/<id>), then final assembly.
cd "$(dirname "$0")/.." || exit 1
export HF_HUB_DISABLE_XET=1
mkdir -p out/ready; touch out/ready/ch01 out/ready/ch02
( while :; do scripts/render_all.sh >> out/render_all.log 2>&1
    [ "$(ls out/chapters/ch[0-9][0-9].mp4 2>/dev/null | wc -l)" -ge 18 ] && break; sleep 30; done
  python3 scripts/assemble.py > out/assemble.log 2>&1; echo "ASSEMBLED $(date +%T)" >> out/produce.log ) &
for n in $(seq -w 3 18); do
  id="ch$n"; [ -f "out/ready/$id" ] && continue
  echo "== voice $id $(date +%T)"
  TTS_ENGINE=xtts nice -n 19 python3 scripts/tts.py "content/$id.json" 2>&1 | grep -E "min,|Error" 
  nice -n 5 python3 scripts/check_voice.py "$id" 2>/dev/null | tail -1
  for retry in 1 2; do
    [ -s "out/flagged_$id.txt" ] || break
    echo "   retry $retry: $(wc -l < out/flagged_$id.txt) lines"; xargs rm -f < "out/flagged_$id.txt"
    TTS_ENGINE=xtts nice -n 19 python3 scripts/tts.py "content/$id.json" 2>&1 | grep -E "min,|Error"
    nice -n 5 python3 scripts/check_voice.py "$id" 2>/dev/null | tail -1
  done
  touch "out/ready/$id"
done
wait
echo "ALL DONE $(date +%T)"
