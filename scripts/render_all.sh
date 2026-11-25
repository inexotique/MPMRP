#!/usr/bin/env bash
# Render every chapter that has narration timing but no MP4 yet (sequential, resumable).
cd "$(dirname "$0")/.." || exit 1
for n in $(seq -w 1 13); do
  id="ch$n"; [ -f "src/generated/$id.json" ] || continue; [ -f "out/chapters/$id.mp4" ] && continue
  ids=$(ls src/generated/ch*.json | xargs -n1 basename | sed 's/.json//' | tr '\n' ' ')
  { for i in $ids; do echo "import $i from './$i.json';"; done; echo "export const CHAPTERS = [$(echo $ids | sed 's/ /, /g')];"; } > src/generated/index.ts
  echo "== $id $(date +%T)"
  npx remotion render src/index.ts "$id" "out/chapters/$id.tmp.mp4" --codec h265 --crf 22 --concurrency 4 --log=error >/dev/null 2>"out/render_$id.err" \
    && mv "out/chapters/$id.tmp.mp4" "out/chapters/$id.mp4" && echo "   done $(date +%T)"
done
