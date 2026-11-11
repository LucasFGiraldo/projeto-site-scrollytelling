# Projeto Site Scrollytelling: "Do grão à xícara"

Site pessoal com transições no estilo da Apple: scrollytelling, sequência de imagens ligada ao scroll e transições de vídeo com CSS sticky. Tema: o caminho do café, do fogo à xícara. Tom poético, somente português.

Site no ar (Vercel): https://projeto-site-scrollytelling.vercel.app/

## Estrutura

```
assets/videos/plano-sequencia.mp4   filme final (31 s, 1920x1080, 24 fps)
assets/images/frame_0001..0372.webp frames do filme (12 fps, 1600x900) para o scroll
video-editor/                       projeto Remotion que edita e une os vídeos originais
.claude/skills/                     skill Remotion usada na edição
```

Os vídeos originais baixados ficam em `assets/videos/` mas não vão para o Git (veja `.gitignore`).

## Refazer a edição do filme

Requer Node. Os vídeos originais devem estar em `assets/videos/`.

```bash
cd video-editor
npm install
npm run studio    # pré-visualização no Remotion Studio
npm run render    # gera out/plano-sequencia.mp4
```

A linha do tempo, os recortes e a correção de cor de cada clipe estão em `video-editor/src/clips.ts`;
o tema global (tinta, vinheta, grão, transição) em `video-editor/src/theme.ts`.

## Extrair os frames

```bash
video-editor/node_modules/ffmpeg-static/ffmpeg.exe -i assets/videos/plano-sequencia.mp4 \
  -vf "fps=12,scale=1600:-2" -c:v libwebp -quality 78 -compression_level 6 \
  assets/images/frame_%04d.webp
```

## Créditos dos vídeos
Vídeos de banco de imagens gratuito (Pexels e Mixkit). Confira a licença de cada vídeo antes de qualquer uso além do pessoal.
