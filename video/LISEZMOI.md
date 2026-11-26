# Trading Academy — la vidéo

GitHub refuse les fichiers de plus de 100 Mo : la vidéo est donc rangée **par chapitre**. Chaque fichier se lit directement, il suffit de les regarder dans l'ordre. Le chapitre 18 est découpé en 3 morceaux (`ch18_1`, `ch18_2`, `ch18_3`).

- `chapitres/chXX.mp4` + `chXX.srt` : la vidéo et les sous-titres de chaque chapitre.
- `Trading_Academy.srt` : les sous-titres de la vidéo complète.
- `SOMMAIRE.md` : l'heure de début de chaque chapitre dans la vidéo complète.

## Recréer la vidéo complète en un seul fichier (1 h 11, sans perte)
Il faut [ffmpeg](https://ffmpeg.org/download.html). Depuis ce dossier `video/` :
```bash
ffmpeg -f concat -safe 0 -i liste.txt -c copy -tag:v hvc1 -movflags +faststart Trading_Academy.mp4
```
L'opération prend quelques secondes, car rien n'est réencodé.

Format : 1920 × 1080, 60 images/s, H.265 (HEVC), son AAC 48 kHz.
Contenu éducatif : pas un conseil personnalisé en investissement.
