'use strict';

const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const jobs = [
  { source: 'img/banner-treino-funcional-professores-v3.jpg', widths: [640, 960, 1440] },
  { source: 'img/fala-bem-hero-pessoas-optimized.jpg', widths: [480, 800, 1200] },
  { source: 'img/treinopersonalbracessoria.webp', widths: [640, 960, 1440] }
];

async function generate({ source, widths }) {
  const input = path.join(root, source);
  const extension = path.extname(source);
  const base = source.slice(0, -extension.length);
  const metadata = await sharp(input).metadata();
  const eligibleWidths = widths.filter(width => width <= metadata.width);

  await Promise.all(eligibleWidths.map(width => (
    sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 84, effort: 5, smartSubsample: true })
      .toFile(path.join(root, `${base}-${width}.webp`))
  )));
}

Promise.all(jobs.map(generate))
  .then(() => console.log(`Gerados ativos responsivos para ${jobs.length} imagens.`))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
