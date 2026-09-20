# Prévia do card com Remotion

Animação de câmera sobre a foto original: aproximação lenta, deslocamento suave e luz discreta. Não anima os membros das pessoas. O ciclo tem 10 segundos, 30 fps e resolução de 1200 × 800.

Nesta pasta, execute `npm ci` e `npm run render` para gerar `videos/hero-remotion-preview.mp4`. A foto de entrada em `public/runners.jpg` é uma cópia de `img/fala-bem-hero-pessoas-optimized.jpg`.

Com o servidor do site ativo, abra `http://localhost:3100/?hero=remotion`. A home normal mantém a foto. A prévia respeita movimento reduzido e permite pausar o vídeo ou comparar com a imagem original.

Referência: https://www.remotion.dev/docs/cli/render
