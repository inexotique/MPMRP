# PROJECT_STATE — Trading Academy
## Statut
- Phase 1 (architecture) : faite. Phase 2 : démo rendue (demo/demo_spread.mp4, 33 s, 12,8 Mo), en attente de validation. Rendu ici ~0,35 s/image.
- Référence : fond noir pur, petits éléments GUI centrés, lueur verte, révélation de texte.
## Décisions
- Remotion 4 + React/TS. Thème : src/theme.ts. Composants : src/components/{core,chart}.tsx.
- Script : content/<id>.json → `python3 scripts/tts.py content/<id>.json` (Piper fr_FR-tom-medium, cache public/vo, timing src/generated, SRT out/).
- SFX + musique synthétisés : `python3 scripts/sfx.py` → public/sfx.
- Scènes pilotées par les repères de narration (makeCues).
## À faire
- Rendu test démo ; validation utilisateur ; chapitres 1–13 ; polices embarquées (Inter, JetBrains Mono) pour Windows ; rendu NVENC/HEVC.
