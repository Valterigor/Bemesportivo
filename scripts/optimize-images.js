'use strict';

const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const images = [
  { source: 'img/IMG_0957.jpg', output: 'img/IMG_0957-optimized' },
  { source: 'img/IMG_0905.jpg', output: 'img/IMG_0905-optimized' }
];

async function optimize({ source, output }) {
  const input = path.join(root, source);
  const target = path.join(root, output);
  const base = sharp(input).rotate().resize({ width: 1600, withoutEnlargement: true });

  await Promise.all([
    base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${target}.jpg`),
    base.clone().webp({ quality: 76, effort: 5 }).toFile(`${target}.webp`),
    base.clone().avif({ quality: 55, effort: 5 }).toFile(`${target}.avif`)
  ]);
}

Promise.all(images.map(optimize))
  .then(() => console.log(`Optimized ${images.length} source images to JPEG, WebP and AVIF.`))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
