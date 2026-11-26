# Trading Academy — vidéo de formation (Remotion)

Une formation d'environ 60 minutes sur les fondamentaux du trading, en 1080p à 60 images par seconde, en 18 chapitres. Tout est généré par du code : animations, narration, sous-titres et montage.

## Structure
- `content/chXX.json` : le script de chaque chapitre (texte de narration et description des visuels).
- `content/pronunciation.json` : le dictionnaire phonétique des termes anglais.
- `src/engine/` : le moteur (`Chapter.tsx`, `visuals.tsx`, `gui.tsx` pour l'interface MT5, la carte et le calendrier, `Captions.tsx` pour les sous-titres animés, `icons.tsx`).
- `scripts/tts.py` : la narration, avec cache par phrase et sous-titres SRT.
  - `TTS_ENGINE=xtts` : XTTS-v2, voix « Viktor », dans un environnement Python isolé situé dans `/opt/xtts`.
  - `TTS_ENGINE=eleven` : voix Liam v3 d'ElevenLabs (clé API requise).
  - Sans variable : voix Edge « Rémy ».
- `scripts/check_voice.py` : le contrôle automatique de la narration par Whisper.
- `scripts/sfx_eleven.py` : génère les effets sonores avec ElevenLabs. `scripts/sfx.py` : génère les musiques de fond.
- `scripts/render_all.sh` : rend les chapitres manquants. `scripts/produce.sh` : lance toute la chaîne. `scripts/assemble.py` : assemble la vidéo finale.

## Relancer le rendu
```bash
npm install
TTS_ENGINE=xtts python3 scripts/tts.py content/ch05.json   # régénère la narration d'un chapitre (seules les phrases modifiées)
npx remotion studio src/index.ts                           # prévisualisation
npx remotion render src/index.ts ch05 out/chapters/ch05.mp4 --codec h265 --crf 22
python3 scripts/assemble.py                                # assemble la vidéo sans réencodage → out/Trading_Academy.mp4 + .srt + SOMMAIRE.md
```

## Livrables
- `out/Trading_Academy.mp4`, `out/Trading_Academy.srt` et `out/SOMMAIRE.md`.
- `GLOSSAIRE.md` et `FICHE_REVISION.md`.

Contenu éducatif, sans conseil personnalisé en investissement.
