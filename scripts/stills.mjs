// Contact sheet: one still per beat (at 70% of the beat) -> out/stills/<id>.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execSync} from 'child_process';
import fs from 'fs';
const ids = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: 'src/index.ts'});
fs.mkdirSync('out/stills', {recursive: true});
for (const id of ids) {
  const ch = JSON.parse(fs.readFileSync(`src/generated/${id}.json`));
  const comp = await selectComposition({serveUrl, id, inputProps: {}});
  const files = [];
  for (const [i, b] of ch.beats.entries()) {
    const frame = Math.round(b.from + b.dur * (b.v.t === 'quiz' ? 0.9 : 0.72));
    const out = `out/stills/${id}_${String(i).padStart(2, '0')}.png`;
    await renderStill({composition: comp, serveUrl, output: out, frame, scale: 0.25});
    files.push(out);
  }
  execSync(`ffmpeg -v error -y ${files.map((f) => `-i ${f}`).join(' ')} -filter_complex "${files.map((_, i) => `[${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % 4) * 480}_${Math.floor(i / 4) * 270}`).join('|')}:fill=black" out/stills/${id}.png`);
  files.forEach((f) => fs.unlinkSync(f));
  console.log('sheet', id);
}
