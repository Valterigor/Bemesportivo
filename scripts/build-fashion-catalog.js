'use strict';

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'img', 'moda-fitness', 'catalogo');
const dataFile = path.join(root, 'js', 'moda-fitness-catalog.js');
const collections = [
  { directory: 'Azul', slug: 'azul', label: 'Azul' },
  { directory: 'Roxa-lilas', slug: 'roxa-lilas', label: 'Roxa / lilás' },
  { directory: 'macacão', slug: 'macacao', label: 'Macacão' }
];

async function build() {
  await fs.mkdir(outputDirectory, { recursive: true });
  const catalog = [];

  for (const collection of collections) {
    const sourceDirectory = path.join(root, 'img', collection.directory);
    const entries = (await fs.readdir(sourceDirectory, { withFileTypes: true }))
      .filter(entry => entry.isFile() && /\.(?:jpe?g|png|webp|avif)$/i.test(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR', { numeric: true }));

    for (const [index, entry] of entries.entries()) {
      const number = String(index + 1).padStart(3, '0');
      const filename = `${collection.slug}-${number}.webp`;
      const target = path.join(outputDirectory, filename);
      const result = await sharp(path.join(sourceDirectory, entry.name))
        .rotate()
        .resize({ width: 1400, height: 1800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 76, effort: 5 })
        .toFile(target);

      catalog.push({
        category: collection.slug,
        categoryLabel: collection.label,
        src: `/img/moda-fitness/catalogo/${filename}${collection.slug === 'azul' && index === 32 ? '?v=20260919-2' : ''}`,
        width: result.width,
        height: result.height,
        alt: `Heloísa Gouvea veste look fitness ${collection.label.toLowerCase()} — foto ${index + 1}`
      });
    }
  }

  const javascript = `window.FASHION_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
  await fs.writeFile(dataFile, javascript, 'utf8');
  const totalBytes = (await Promise.all(catalog.map(photo => fs.stat(path.join(root, photo.src.slice(1).split('?')[0])))))
    .reduce((sum, stat) => sum + stat.size, 0);
  console.log(`Catálogo criado: ${catalog.length} fotos, ${(totalBytes / 1024 / 1024).toFixed(1)} MB.`);
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
