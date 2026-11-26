# PROJECT_STATE — Trading Academy

## Statut
- 18 chapitres, environ 60 minutes de vidéo. Chapitres 1 à 16 rendus, 17 et 18 en cours, assemblage automatique à la fin (`scripts/produce.sh`).
- Voix : ch01 Edge Rémy · ch02 ElevenLabs Liam v3 (quota gratuit épuisé ensuite) · ch03 à ch18 XTTS-v2 « Viktor » (gratuite, locale). Choix validé par l'utilisateur.
- Style « moderne » à partir du ch10 : fonds colorés par scène, illustrations 3D, transitions par masque, rotation 3D et zoom, HUD, particules, effets sonores enrichis.
- Le ch18 « Une journée type » remplace le quiz : routine de la journée, démonstration en démo avec un plan d'exemple, conseils pour débuter.

## Décisions techniques
- Remotion 4, rendu H.265 avec CRF 22 (environ 2 Mb/s), assemblage sans réencodage (`assemble.py`, chapitres intégrés au MP4).
- Synchronisation : les éléments apparaissent environ 0,3 s après le début de la phrase correspondante. Sous-titres animés mot par mot (minutage par mot pour ElevenLabs).
- Contrôle de la narration : Whisper (faster-whisper small), avec 2 nouvelles tentatives automatiques pour les phrases mal prononcées.
- Effets sonores : ElevenLabs (11 sons, en cache dans `public/sfx`). Musiques de fond synthétisées par script (4 variantes).

## Points d'attention
- Les sorties XTTS-v2 sont soumises à la licence Coqui CPML, qui interdit l'usage commercial.
- La vidéo finale et les chapitres restent dans `out/` : ils ne sont pas versionnés.
