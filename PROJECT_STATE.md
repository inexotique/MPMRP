# PROJECT_STATE — Trading Academy

## Statut
- **TERMINÉ** (26/11, 7 h 17, heure de Paris). 18 chapitres, durée 1:11:06, 1,20 Go, H.265 1080p à 60 i/s, 18 chapitres intégrés au MP4. Fichier `out/Trading_Academy.mp4` avec ses sous-titres (`.srt`) et `SOMMAIRE.md`.
- Sur GitHub, le dossier `video/` contient un MP4 par chapitre, chacun sous 100 Mo. Le ch18 est en 3 morceaux. On y trouve aussi les sous-titres et `liste.txt`, qui permet de recréer le film complet avec ffmpeg (voir `video/LISEZMOI.md`).
- Envoi : la limite d'envoi est de 400 Mo. La vidéo est donc aussi découpée sans perte en 4 parties dans `out/parts/` (`python3 scripts/assemble.py --parts 1-7,8-13,14-17,18-18`).
- Contrôle de la narration du ch18 : 11 phrases sur 113 restent signalées après 2 nouvelles tentatives, surtout des écarts de transcription des nombres (« 8h30 » au lieu de « huit heures trente »). Aucune n'a été jugée bloquante.
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
