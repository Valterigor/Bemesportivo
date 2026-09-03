(() => {
  'use strict';

  const formats = Object.freeze({
    story: { width: 1080, height: 1920, label: 'Stories e Status' },
    feed: { width: 1080, height: 1350, label: 'Feed e WhatsApp' }
  });

  const safe = value => String(value || '').trim();
  const titleFor = post => safe(post?.title || post?.activity) || 'Meu momento no esporte';
  const nameFor = profile => safe(profile?.displayName || profile?.name) || 'Meu Caminho Be';

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Não foi possível carregar a foto.'));
      image.src = source;
    });
  }

  function rounded(context, x, y, width, height, radius) {
    context.beginPath();
    if (typeof context.roundRect === 'function') context.roundRect(x, y, width, height, radius);
    else context.rect(x, y, width, height);
  }

  function wrap(context, text, x, y, maxWidth, lineHeight, maxLines, align = 'left') {
    const words = safe(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || context.measureText(candidate).width <= maxWidth) line = candidate;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines && visible.length) visible[visible.length - 1] = `${visible[visible.length - 1].replace(/[.,;:!?]?$/, '')}…`;
    context.textAlign = align;
    visible.forEach((value, index) => context.fillText(value, x, y + (index * lineHeight)));
    return y + (visible.length * lineHeight);
  }

  function drawContained(context, image, x, y, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.save();
    rounded(context, x, y, width, height, 34);
    context.clip();
    context.fillStyle = '#120f0d';
    context.fillRect(x, y, width, height);
    context.drawImage(image, x + ((width - drawWidth) / 2), y + ((height - drawHeight) / 2), drawWidth, drawHeight);
    context.restore();
  }

  function drawAvatar(context, image, x, y, size, initial) {
    context.save();
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    context.clip();
    const avatarGradient = context.createLinearGradient(x, y, x + size, y + size);
    avatarGradient.addColorStop(0, '#ff945c');
    avatarGradient.addColorStop(1, '#c94312');
    context.fillStyle = avatarGradient;
    context.fillRect(x, y, size, size);
    if (image) {
      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, x + ((size - width) / 2), y + ((size - height) / 2), width, height);
    } else {
      context.fillStyle = '#fff';
      context.font = `900 ${Math.round(size * .38)}px Manrope, Inter, Arial`;
      context.textAlign = 'center';
      context.fillText(initial, x + size / 2, y + size * .63);
    }
    context.restore();
    context.strokeStyle = '#fff';
    context.lineWidth = 12;
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2 - 6, 0, Math.PI * 2);
    context.stroke();
  }

  function canvasFile(canvas, name) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob
      ? resolve(new File([blob], name, { type: 'image/png' }))
      : reject(new Error('Não foi possível criar a imagem.')), 'image/png', .94));
  }

  async function build({ post, profile = {}, format = 'story', url = '', variant = 'post', stats = {} }) {
    const isProfile = variant === 'profile';
    if (!isProfile && !post) throw new Error('Publicação ainda não carregada.');
    const spec = formats[format] || formats.story;
    await document.fonts?.ready;
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Este navegador não conseguiu criar a imagem.');

    const gradient = context.createLinearGradient(0, 0, spec.width, spec.height);
    gradient.addColorStop(0, '#171311');
    gradient.addColorStop(.58, '#54281d');
    gradient.addColorStop(1, '#a83b08');
    context.fillStyle = gradient;
    context.fillRect(0, 0, spec.width, spec.height);
    context.fillStyle = '#f46d22';
    context.font = '900 72px Manrope, Inter, Arial';
    context.textAlign = 'left';
    context.fillText('Be', 72, 108);
    context.fillStyle = '#fff';
    context.font = '800 23px Inter, Arial';
    context.fillText(isProfile ? 'PERFIL ESPORTIVO · MEU CAMINHO BE' : 'MEU DIÁRIO BE', 72, 165);
    context.textAlign = 'right';
    context.fillStyle = 'rgba(255,255,255,.82)';
    context.font = '700 24px Inter, Arial';
    context.fillText(isProfile ? safe(profile.favoriteSport) || 'ESPORTE' : nameFor(profile), 1008, 165);

    if (isProfile) {
      const story = format === 'story';
      const avatarSize = story ? 250 : 190;
      const avatarTop = story ? 300 : 220;
      let avatarImage = null;
      if (safe(profile.photoDataUrl)) {
        try { avatarImage = await loadImage(profile.photoDataUrl); } catch (error) {}
      }
      drawAvatar(context, avatarImage, (spec.width - avatarSize) / 2, avatarTop, avatarSize, nameFor(profile).charAt(0).toLocaleUpperCase('pt-BR'));

      const sport = safe(profile.favoriteSport) || 'Minha modalidade';
      const sportY = avatarTop + avatarSize + (story ? 72 : 58);
      context.font = '850 24px Inter, Arial';
      const sportWidth = Math.min(520, context.measureText(sport.toLocaleUpperCase('pt-BR')).width + 58);
      context.fillStyle = 'rgba(255,255,255,.13)';
      rounded(context, (spec.width - sportWidth) / 2, sportY - 35, sportWidth, 58, 29);
      context.fill();
      context.fillStyle = '#ffb185';
      context.textAlign = 'center';
      context.fillText(sport.toLocaleUpperCase('pt-BR'), spec.width / 2, sportY + 3);

      context.fillStyle = '#fff';
      context.font = `900 ${story ? 68 : 58}px Manrope, Inter, Arial`;
      const nameEnd = wrap(context, nameFor(profile), spec.width / 2, sportY + (story ? 105 : 92), 900, story ? 76 : 64, 2, 'center');
      const bioTop = nameEnd + (story ? 42 : 30);
      const bioHeight = story ? 300 : 220;
      context.fillStyle = 'rgba(255,255,255,.11)';
      rounded(context, 72, bioTop, 936, bioHeight, 32);
      context.fill();
      context.fillStyle = '#fff';
      context.font = `650 ${story ? 34 : 30}px Inter, Arial`;
      wrap(context, safe(profile.bio) || 'O esporte faz parte da minha história.', spec.width / 2, bioTop + (story ? 82 : 64), 820, story ? 49 : 43, story ? 4 : 3, 'center');

      const statsTop = bioTop + bioHeight + (story ? 54 : 38);
      const statItems = [
        [Math.max(0, Number(stats.moments || 0)), 'MOMENTOS'],
        [Math.max(0, Number(stats.likes || 0)), 'CURTIDAS'],
        [Math.max(0, Number(stats.highlights || 0)), 'CONQUISTAS']
      ];
      statItems.forEach(([value, label], index) => {
        const x = 72 + index * 312;
        context.fillStyle = 'rgba(255,255,255,.09)';
        rounded(context, x, statsTop, 288, story ? 170 : 145, 24);
        context.fill();
        context.fillStyle = '#fff';
        context.font = `900 ${story ? 48 : 42}px Manrope, Inter, Arial`;
        context.textAlign = 'center';
        context.fillText(String(value), x + 144, statsTop + (story ? 72 : 62));
        context.fillStyle = 'rgba(255,255,255,.68)';
        context.font = '800 18px Inter, Arial';
        context.fillText(label, x + 144, statsTop + (story ? 122 : 108));
      });

      const footerY = spec.height - 118;
      context.textAlign = 'left';
      context.fillStyle = 'rgba(255,255,255,.7)';
      context.font = '700 21px Inter, Arial';
      context.fillText('CONHEÇA MINHA HISTÓRIA NO ESPORTE', 72, footerY - 46);
      context.fillStyle = '#fff';
      context.font = '800 25px Inter, Arial';
      let publicAddress = 'bemesportivo.com';
      try { if (url) publicAddress = new URL(url).host + new URL(url).pathname; } catch (error) {}
      context.fillText(publicAddress, 72, footerY);
      return canvasFile(canvas, `meu-caminho-be-perfil-${format}.png`);
    }

    const hasPhoto = post.kind === 'photo' && safe(post.imageDataUrl);
    let copyTop = format === 'story' ? 545 : 420;
    if (hasPhoto) {
      try {
        const photoHeight = format === 'story' ? 860 : 500;
        drawContained(context, await loadImage(post.imageDataUrl), 72, 220, 936, photoHeight);
        copyTop = 220 + photoHeight + 85;
      } catch (error) {}
    } else {
      context.fillStyle = 'rgba(255,255,255,.12)';
      context.beginPath();
      context.arc(540, format === 'story' ? 370 : 315, 116, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#fff';
      context.font = '900 92px Manrope, Inter, Arial';
      context.textAlign = 'center';
      context.fillText(nameFor(profile).charAt(0).toLocaleUpperCase('pt-BR'), 540, (format === 'story' ? 370 : 315) + 32);
    }

    context.fillStyle = '#fff';
    context.font = `850 ${format === 'story' ? 58 : 52}px Manrope, Inter, Arial`;
    const titleEnd = wrap(context, titleFor(post), 72, copyTop, 936, 65, 2, 'left');
    context.fillStyle = 'rgba(255,255,255,.12)';
    rounded(context, 72, titleEnd + 22, 936, format === 'story' ? 300 : 230, 30);
    context.fill();
    context.fillStyle = '#fff';
    context.font = `650 ${format === 'story' ? 34 : 31}px Inter, Arial`;
    wrap(context, safe(post.text) || 'Um registro do meu caminho no esporte.', 112, titleEnd + 88, 856, format === 'story' ? 49 : 44, format === 'story' ? 4 : 3, 'left');

    const footerY = spec.height - 118;
    context.textAlign = 'left';
    context.fillStyle = 'rgba(255,255,255,.72)';
    context.font = '700 21px Inter, Arial';
    context.fillText(url ? 'ABRA O LINK PARA VER A PUBLICAÇÃO' : 'CRIADO NO MEU CAMINHO BE', 72, footerY - 46);
    context.fillStyle = '#fff';
    context.font = '800 25px Inter, Arial';
    context.fillText(url ? safe(new URL(url).host + new URL(url).pathname) : 'bemesportivo.com', 72, footerY);
    return canvasFile(canvas, `meu-caminho-be-${safe(post.id) || 'publicacao'}-${format}.png`);
  }

  function download(file) {
    const href = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = href;
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1200);
  }

  function ensureDialog() {
    let dialog = document.getElementById('be-share-dialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'be-share-dialog';
    dialog.className = 'be-share-dialog';
    dialog.setAttribute('aria-labelledby', 'be-share-title');
    dialog.innerHTML = `<section class="be-share-sheet"><header><div><span>PRONTO PARA REPOSTAR</span><h2 id="be-share-title">Escolha o formato</h2><p>A imagem se ajusta ao Instagram e ao WhatsApp.</p></div><button class="be-share-close" type="button" aria-label="Fechar">×</button></header><div class="be-share-options"><button class="be-share-option" type="button" data-share-format="story"><i class="be-share-ratio story" aria-hidden="true">9:16</i><span><strong>Stories e Status</strong><small>Instagram Stories e WhatsApp Status</small></span></button><button class="be-share-option" type="button" data-share-format="feed"><i class="be-share-ratio feed" aria-hidden="true">4:5</i><span><strong>Feed e WhatsApp</strong><small>Feed do Instagram e conversas</small></span></button></div><div class="be-share-secondary"><button type="button" data-share-copy>Copiar link</button></div><p class="be-share-status" role="status" aria-live="polite"></p></section>`;
    document.body.append(dialog);
    dialog.querySelector('.be-share-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('cancel', () => { dialog.querySelector('.be-share-status').textContent = ''; });
    return dialog;
  }

  function open(options) {
    const dialog = ensureDialog();
    const status = dialog.querySelector('.be-share-status');
    const copy = dialog.querySelector('[data-share-copy]');
    const url = safe(options?.url);
    copy.hidden = !url;
    status.textContent = '';
    status.dataset.error = 'false';
    dialog.querySelectorAll('[data-share-format]').forEach(button => {
      button.disabled = false;
      button.onclick = async () => {
        button.disabled = true;
        status.textContent = `Criando imagem para ${formats[button.dataset.shareFormat].label}…`;
        try {
          const file = await build({ ...options, format: button.dataset.shareFormat });
          const profileVariant = options?.variant === 'profile';
          const data = {
            title: profileVariant ? `${nameFor(options.profile)} | Meu Caminho Be` : `${titleFor(options.post)} | Meu Diário BE`,
            text: profileVariant ? `Conheça minha história em ${safe(options.profile?.favoriteSport) || 'esporte'} no Meu Caminho Be.` : safe(options.post?.text) || 'Veja este momento no Meu Diário BE.',
            ...(url ? { url } : {}), files: [file]
          };
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share(data);
            status.textContent = 'Agora escolha Instagram ou WhatsApp.';
          } else {
            download(file);
            if (url) await navigator.clipboard?.writeText(url);
            status.textContent = url ? 'Imagem baixada e link copiado.' : 'Imagem baixada. Ela já está pronta para postar.';
          }
          options?.onStatus?.(status.textContent);
        } catch (error) {
          if (error?.name !== 'AbortError') {
            status.dataset.error = 'true';
            status.textContent = error?.message || 'Não foi possível preparar o compartilhamento.';
          }
        } finally { button.disabled = false; }
      };
    });
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(url); status.textContent = 'Link copiado.'; }
      catch (error) { status.dataset.error = 'true'; status.textContent = 'Não foi possível copiar o link.'; }
    };
    if (!dialog.open) dialog.showModal();
  }

  window.BeShareCard = Object.freeze({ formats, build, open });
})();
