(() => {
  'use strict';
  const image = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem. Escolha a foto novamente.'));
    img.src = src;
  });
  async function build({ post, profile, format = 'feed' }) {
    await document.fonts.ready;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = format === 'story' ? 1920 : 1350;
    const ctx = canvas.getContext('2d');
    const height = canvas.height;
    const box = (x, y, w, h, radius, color) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
    };
    const lines = (text, size, width, weight = 500) => {
      ctx.font = `${weight} ${size}px Inter, Arial`;
      const result = [];
      for (const paragraph of String(text || '').split('\n')) {
        let line = '';
        for (const char of paragraph) {
          if (ctx.measureText(line + char).width > width && line) { result.push(line); line = ''; }
          line += char;
        }
        result.push(line);
      }
      return result;
    };
    const text = (value, x, y, size, color, weight = 500) => {
      ctx.fillStyle = color; ctx.font = `${weight} ${size}px Inter, Arial`;
      ctx.fillText(value, x, y);
    };
    box(0, 0, 1080, height, 0, '#11151c');
    box(40, 40, 1000, height - 80, 28, '#1e232c');
    const logo = await image('/img/Bem%20Esportivo%20Logo%20Laranja@33x.png');
    box(84, 90, 88, 88, 44, '#383f4b');
    if (profile.photoDataUrl) {
      const avatar = await image(profile.photoDataUrl);
      ctx.save(); ctx.beginPath(); ctx.arc(128, 134, 44, 0, Math.PI * 2); ctx.clip();
      const scale = Math.max(88 / avatar.width, 88 / avatar.height);
      ctx.drawImage(avatar, 128 - avatar.width * scale / 2, 134 - avatar.height * scale / 2, avatar.width * scale, avatar.height * scale);
      ctx.restore();
    } else text((profile.name || 'B').charAt(0).toUpperCase(), 112, 146, 34, '#ffb51b', 800);
    const name = lines(profile.name, 30, 650, 700);
    name.slice(0, 2).forEach((line, i) => text(line, 194, 119 + i * 34, 30, '#f6f7f9', 700));
    text([profile.handle, post.activity].filter(Boolean).join(' · '), 194, 181, 21, '#aeb7c5');
    ctx.drawImage(logo, 935, 103, 56, 48);
    let y = 255;
    const titleLines = lines(post.title, 40, 904, 800);
    titleLines.forEach(line => { text(line, 88, y, 40, '#fff', 800); y += 50; });
    y += 16;
    let size = 30;
    let body = lines(post.text, size, 904);
    const budget = post.imageDataUrl ? (format === 'story' ? 490 : 340) : 680;
    while (body.length * size * 1.45 > budget && size > 20) { size--; body = lines(post.text, size, 904); }
    body.forEach(line => { text(line, 88, y, size, '#e3e7ed'); y += size * 1.45; });
    y += 30;
    const metrics = [post.duration ? `${post.duration} min` : '', post.distance ? `${post.distance} km` : '', post.result, post.personalBest ? 'Conquista pessoal' : ''].filter(Boolean).join(' · ');
    if (metrics) {
      lines(metrics, 22, 904).forEach(line => { text(line, 88, y, 22, '#ffb51b', 700); y += 31; });
      y += 18;
    }
    const photoHeight = height - 190 - y;
    if (post.imageDataUrl && photoHeight > 0) {
      const photo = await image(post.imageDataUrl);
      box(88, y, 904, photoHeight, 20, '#353c47');
      const scale = Math.min(904 / photo.width, photoHeight / photo.height);
      ctx.save(); ctx.beginPath(); ctx.roundRect(88, y, 904, photoHeight, 20); ctx.clip();
      ctx.drawImage(photo, 88 + (904 - photo.width * scale) / 2, y + (photoHeight - photo.height * scale) / 2, photo.width * scale, photo.height * scale);
      ctx.restore();
    }
    ctx.fillStyle = '#3b424e'; ctx.fillRect(88, height - 149, 904, 1);
    text('O esporte começa com pessoas.', 88, height - 105, 24, '#f2f4f7', 700);
    text('bemesportivo.com', 88, height - 72, 20, '#aeb7c5');
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob
      ? resolve(new File([blob], `bem-esportivo-postagem-${format}.png`, { type: 'image/png' }))
      : reject(new Error('Não foi possível gerar a imagem.')), 'image/png'));
  }
  window.BeSocialCard = Object.freeze({ build });
})();
