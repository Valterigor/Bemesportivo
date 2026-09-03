(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  const previewMode = ['localhost', '127.0.0.1'].includes(location.hostname) && query.get('preview') === '1';
  const slug = query.get('perfil') || location.pathname.match(/^\/diario\/(be-[a-f0-9]{12})\/?$/)?.[1] || (previewMode ? 'be-000000000000' : '');
  const loading = document.getElementById('be-public-loading');
  const content = document.getElementById('be-public-content');
  const escapeText = value => String(value || '');
  const OWNER_CODE_KEYS = ['meuCaminhoBePublicCodeV1', 'meuCaminhoBeContinuityCodeV1'];
  const encoder = new TextEncoder();
  let loadedProfile = null;
  let loadedPosts = [];
  let ownerDevice = false;
  const postShareFeedbackTimers = new WeakMap();
  const postTypeLabels = Object.freeze({
    photo: 'Momento esportivo', training: 'Treino concluído', result: 'Resultado', achievement: 'Conquista',
    evolution: 'Evolução', competition: 'Jogo ou competição', return: 'Retorno ao esporte', goal: 'Meta alcançada'
  });
  const formatSportsNumber = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  const formatSportsPace = (minutes, distance) => {
    const pace = Number(minutes) / Number(distance);
    if (!Number.isFinite(pace) || pace <= 0) return '';
    const totalSeconds = Math.round(pace * 60);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}/km`;
  };

  function postDisplayTitle(post) {
    const title = String(post?.activity || '').trim();
    return !title || title.toLocaleLowerCase('pt-BR') === 'publicação'
      ? 'O meu momento Bem esportivo'
      : title;
  }

  async function hashHex(value) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function isOwnerDevice() {
    for (const key of OWNER_CODE_KEYS) {
      const code = String(localStorage.getItem(key) || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
      if (code.length !== 32) continue;
      const id = await hashHex(`be-sync-id:${code}`);
      if (`be-${id.slice(0, 12)}` === slug) return true;
    }
    return false;
  }

  function showPostShareFeedback(button, message) {
    const feedback = button.closest('.be-public-post')?.querySelector('.be-public-post-share-feedback');
    if (!feedback) return;
    window.clearTimeout(postShareFeedbackTimers.get(feedback));
    feedback.textContent = message;
    postShareFeedbackTimers.set(feedback, window.setTimeout(() => {
      feedback.textContent = '';
      postShareFeedbackTimers.delete(feedback);
    }, 3200));
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 4) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines) visible[maxLines - 1] = `${visible[maxLines - 1].replace(/[.,;:!?]?$/, '')}…`;
    visible.forEach((value, index) => context.fillText(value, x, y + (index * lineHeight)));
    return y + (visible.length * lineHeight);
  }

  function loadCanvasImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }

  function drawCoverImage(context, image, x, y, size) {
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.save();
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height);
    context.restore();
    context.strokeStyle = '#ffffff';
    context.lineWidth = 12;
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2 - 6, 0, Math.PI * 2);
    context.stroke();
  }

  function drawStoryImage(context, image, x, y, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.save();
    context.beginPath();
    context.roundRect(x, y, width, height, 34);
    context.clip();
    context.fillStyle = 'rgba(12,10,9,.72)';
    context.fillRect(x, y, width, height);
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    context.restore();
    context.strokeStyle = 'rgba(255,255,255,.36)';
    context.lineWidth = 3;
    context.beginPath();
    context.roundRect(x, y, width, height, 34);
    context.stroke();
  }

  async function buildStoryCover(post) {
    if (!loadedProfile || !post) throw new Error('Publicação ainda não carregada.');
    await document.fonts?.ready;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, '#171311');
    gradient.addColorStop(.52, '#5f2a1d');
    gradient.addColorStop(1, '#ff5a1f');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1080, 1920);
    context.strokeStyle = 'rgba(255,255,255,.15)';
    context.lineWidth = 3;
    [220, 340, 470].forEach(radius => { context.beginPath(); context.arc(940, 140, radius, 0, Math.PI * 2); context.stroke(); });
    context.fillStyle = '#ff6a25';
    context.font = '900 74px Manrope, Inter, Arial';
    context.textAlign = 'left';
    context.fillText('Be', 78, 122);
    context.fillStyle = '#ffffff';
    context.font = '800 25px Inter, Arial';
    context.fillText('PUBLICAÇÃO · MEU DIÁRIO BE', 78, 205);
    context.textAlign = 'right';
    context.fillStyle = 'rgba(255,255,255,.76)';
    context.font = '700 24px Inter, Arial';
    context.fillText(loadedProfile.displayName, 1000, 205);

    let contentTop = 350;
    if (post.kind === 'photo' && post.imageDataUrl) {
      try {
        drawStoryImage(context, await loadCanvasImage(post.imageDataUrl), 80, 280, 920, 780);
        contentTop = 1170;
      } catch (error) {}
    }
    if (contentTop === 350) {
      const photoSize = 230;
      const photoX = (1080 - photoSize) / 2;
      let photoDrawn = false;
      if (loadedProfile.photoDataUrl) {
        try {
          drawCoverImage(context, await loadCanvasImage(loadedProfile.photoDataUrl), photoX, 290, photoSize);
          photoDrawn = true;
        } catch (error) {}
      }
      if (!photoDrawn) {
        context.fillStyle = '#ff672d';
        context.beginPath();
        context.arc(540, 405, 115, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#ffffff';
        context.font = '900 90px Inter, Arial';
        context.textAlign = 'center';
        context.fillText(String(loadedProfile.displayName || 'B').charAt(0).toLocaleUpperCase('pt-BR'), 540, 437);
      }
      contentTop = 660;
    }

    context.textAlign = 'center';
    const displayTitle = postDisplayTitle(post);
    context.fillStyle = '#ffffff';
    context.font = '850 57px Manrope, Inter, Arial';
    const titleEnd = drawWrappedText(context, displayTitle, 540, contentTop + 30, 860, 66, 2);
    context.fillStyle = 'rgba(255,255,255,.12)';
    context.beginPath();
    context.roundRect(80, titleEnd + 28, 920, 280, 32);
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = '650 34px Inter, Arial';
    drawWrappedText(context, post.text || 'Um registro do meu caminho no esporte.', 540, titleEnd + 100, 790, 49, 4);

    context.fillStyle = 'rgba(255,255,255,.78)';
    context.font = '600 24px Inter, Arial';
    context.fillText('Veja a publicação completa', 540, 1720);
    context.fillStyle = '#ffffff';
    context.font = '800 27px Inter, Arial';
    context.fillText(`bemesportivo.com/diario/${slug}`, 540, 1770);
    context.fillStyle = 'rgba(255,255,255,.55)';
    context.font = '600 20px Inter, Arial';
    context.fillText('BEM ESPORTIVO · ESPORTE, HISTÓRIA E COMUNIDADE', 540, 1860);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob
      ? resolve(new File([blob], `meu-diario-be-${post.id || 'publicacao'}.png`, { type: 'image/png' }))
      : reject(new Error('Não foi possível criar a capa.')), 'image/png', .94));
  }

  function downloadStoryCover(file) {
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(file);
    link.href = objectUrl;
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function sharePublication(post, button) {
    const url = new URL(`/diario/${slug}`, location.origin);
    url.searchParams.set('publicacao', post.id);
    if (!window.BeShareCard) {
      showPostShareFeedback(button, 'O compartilhamento ainda está carregando. Tente novamente.');
      return;
    }
    window.BeShareCard.open({ post, profile: loadedProfile, slug, url: url.href, onStatus: message => showPostShareFeedback(button, message) });
  }

  function shareProfile() {
    const feedback = document.getElementById('be-public-profile-share-feedback');
    if (!window.BeShareCard || !loadedProfile) {
      if (feedback) feedback.textContent = 'O compartilhamento ainda está carregando. Tente novamente.';
      return;
    }
    const likes = loadedPosts.reduce((total, post) => total + Math.max(0, Number(post.likes || 0)), 0);
    const highlights = loadedPosts.filter(post => post.personalBest || ['achievement', 'goal'].includes(post.postType)).length;
    const url = new URL(`/diario/${slug}`, location.origin).href;
    window.BeShareCard.open({
      variant: 'profile',
      profile: loadedProfile,
      slug,
      stats: { moments: loadedPosts.length, likes, highlights },
      url,
      onStatus: message => { if (feedback) feedback.textContent = message; }
    });
  }

  function postCard(post) {
    const article = document.createElement('article');
    article.className = 'be-public-post';
    article.id = `publicacao-${post.id}`;
    article.dataset.watermark = `Meu Diário BE · @${slug}`;
    if (post.kind === 'photo' && post.imageDataUrl) {
      const image = document.createElement('img');
      image.src = post.imageDataUrl;
      image.alt = post.activity ? `Registro de ${post.activity}` : 'Foto compartilhada no diário esportivo';
      image.loading = 'lazy';
      image.draggable = false;
      image.addEventListener('contextmenu', event => event.preventDefault());
      article.append(image);
    }
    const copy = document.createElement('div');
    copy.className = 'be-public-post-copy';
    const label = document.createElement('span');
    label.textContent = escapeText(postTypeLabels[post.postType] || post.activity || 'REGISTRO ESPORTIVO').toLocaleUpperCase('pt-BR');
    const text = document.createElement('p');
    text.textContent = escapeText(post.text);
    copy.append(label);
    if (post.title) {
      const title = document.createElement('h3');
      title.textContent = escapeText(post.title);
      copy.append(title);
    }
    copy.append(text);
    const sportsData = [
      post.activity || '',
      post.duration ? `${formatSportsNumber(post.duration)} min` : '',
      post.distance ? `${formatSportsNumber(post.distance)} km` : '',
      post.duration && post.distance ? formatSportsPace(post.duration, post.distance) : '',
      post.result || '',
      post.feeling ? `Sensação ${post.feeling}/5` : ''
    ].filter(Boolean);
    if (sportsData.length) {
      const metrics = document.createElement('div');
      metrics.className = 'be-public-sports-data';
      sportsData.forEach(value => {
        const item = document.createElement('span');
        item.textContent = value;
        metrics.append(item);
      });
      copy.append(metrics);
    }
    if (post.personalBest) {
      const record = document.createElement('strong');
      record.className = 'be-public-personal-best';
      record.textContent = 'NOVO RECORDE PESSOAL';
      copy.append(record);
    }
    const time = document.createElement('time');
    time.dateTime = post.occurredAt;
    time.textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${post.occurredAt}T12:00:00`));
    const origin = document.createElement('span');
    origin.className = 'be-public-post-origin';
    origin.textContent = `Meu Diário BE · @${slug}`;
    const report = document.createElement('button');
    report.type = 'button';
    report.className = 'be-public-report-post';
    report.dataset.postId = post.id;
    report.textContent = 'Denunciar publicação';
    const meta = document.createElement('div');
    meta.className = 'be-public-post-meta';
    meta.append(time, report, origin);
    if (ownerDevice) {
      const share = document.createElement('button');
      share.type = 'button';
      share.className = 'be-public-share-post';
      share.dataset.publicSharePost = post.id;
      share.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"></path></svg><span>Compartilhar publicação</span>';
      const shareFeedback = document.createElement('span');
      shareFeedback.className = 'be-public-post-share-feedback';
      shareFeedback.setAttribute('role', 'status');
      shareFeedback.setAttribute('aria-live', 'polite');
      meta.append(share, shareFeedback);
    }
    const interactions = document.createElement('div');
    interactions.className = 'be-public-interactions';
    const like = document.createElement('button');
    like.type = 'button';
    like.dataset.publicLikePost = post.id;
    like.setAttribute('aria-pressed', 'false');
    like.textContent = `Curtir${post.likes ? ` - ${post.likes}` : ''}`;
    const commentToggle = document.createElement('button');
    commentToggle.type = 'button';
    commentToggle.dataset.publicCommentToggle = post.id;
    commentToggle.textContent = `Comentar${post.comments?.length ? ` - ${post.comments.length}` : ''}`;
    interactions.append(like, commentToggle);
    const comments = document.createElement('div');
    comments.className = 'be-public-comments';
    comments.dataset.publicComments = post.id;
    comments.hidden = true;
    (post.comments || []).forEach(item => {
      const row = document.createElement('p');
      const author = document.createElement('strong');
      author.textContent = item.name;
      row.append(author, document.createTextNode(` ${item.text}`));
      comments.append(row);
    });
    const form = document.createElement('form');
    form.dataset.publicCommentForm = post.id;
    const name = document.createElement('input');
    name.name = 'name'; name.maxLength = 40; name.required = true; name.placeholder = 'Seu nome'; name.setAttribute('aria-label', 'Seu nome');
    const commentText = document.createElement('input');
    commentText.name = 'text'; commentText.maxLength = 400; commentText.required = true; commentText.placeholder = 'Comente este momento esportivo'; commentText.setAttribute('aria-label', 'Comentário');
    const trap = document.createElement('input');
    trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.className = 'be-public-honeypot'; trap.setAttribute('aria-hidden', 'true');
    const send = document.createElement('button'); send.type = 'submit'; send.textContent = 'Enviar';
    const commentFeedback = document.createElement('small'); commentFeedback.setAttribute('role', 'status');
    form.append(name, commentText, trap, send, commentFeedback);
    comments.append(form);
    copy.append(interactions, comments, meta);
    article.append(copy);
    return article;
  }

  async function reportContent(targetType, postId = '') {
    const feedback = document.getElementById('be-public-report-feedback');
    if (!window.confirm('Deseja enviar esta denúncia para a fiscalização do BeMEsportivo?')) return false;
    if (feedback) feedback.textContent = 'Enviando denúncia…';
    const response = await fetch(`/api/public-profiles/${slug}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, postId, reason: 'Conteúdo denunciado por visitante' })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Não foi possível enviar a denúncia.');
    if (feedback) feedback.textContent = payload.hidden
      ? 'Denúncia recebida. O conteúdo foi ocultado preventivamente.'
      : 'Denúncia recebida. Obrigado por ajudar a cuidar da comunidade.';
    return true;
  }

  async function toggleLike(postId, button) {
    button.disabled = true;
    try {
      const response = await fetch(`/api/public-profiles/${slug}/posts/${encodeURIComponent(postId)}/like`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Não foi possível registrar sua curtida.');
      button.setAttribute('aria-pressed', String(payload.liked));
      button.textContent = `Curtir${payload.likes ? ` - ${payload.likes}` : ''}`;
      const post = loadedPosts.find(item => item.id === postId);
      if (post) post.likes = payload.likes;
    } finally { button.disabled = false; }
  }

  async function sendComment(form) {
    const postId = form.dataset.publicCommentForm;
    const feedback = form.querySelector('[role="status"]');
    const submit = form.querySelector('button[type="submit"]');
    const values = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    feedback.textContent = 'Enviando...';
    try {
      const response = await fetch(`/api/public-profiles/${slug}/posts/${encodeURIComponent(postId)}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Não foi possível enviar o comentário.');
      const post = loadedPosts.find(item => item.id === postId);
      if (post) post.comments = [...(post.comments || []), payload.comment];
      const comments = form.closest('.be-public-comments');
      const row = document.createElement('p');
      const author = document.createElement('strong');
      author.textContent = payload.comment.name;
      row.append(author, document.createTextNode(` ${payload.comment.text}`));
      comments.insertBefore(row, form);
      form.reset();
      feedback.textContent = 'Comentário publicado.';
      const toggle = comments.closest('.be-public-post')?.querySelector('[data-public-comment-toggle]');
      if (toggle && post) toggle.textContent = `Comentar - ${post.comments.length}`;
    } catch (error) { feedback.textContent = error.message; }
    finally { submit.disabled = false; }
  }

  async function load() {
    if (!/^be-[a-f0-9]{12}$/.test(slug)) throw new Error('Este endereço de perfil não é válido.');
    let payload;
    if (previewMode) {
      payload = {
        slug,
        profile: {
          displayName: 'Marina em Movimento',
          favoriteSport: 'Corrida',
          bio: 'Corro para cuidar de mim, superar meus limites e celebrar cada novo passo.',
          photoDataUrl: ''
        },
        posts: [
          { id: 'preview-conquista', kind: 'text', text: 'Primeiros cinco quilômetros concluídos. Uma conquista construída passo a passo.', activity: 'Corrida', occurredAt: '2026-08-20', postType: 'achievement', personalBest: true, likes: 18, comments: [] },
          { id: 'preview-treino', kind: 'text', text: 'Treino leve no parque para recuperar, respirar e manter a constância.', activity: 'Corrida', occurredAt: '2026-08-25', postType: 'training', duration: 36, distance: 5.2, personalBest: false, likes: 9, comments: [] }
        ]
      };
    } else {
      const response = await fetch(`/api/public-profiles/${slug}`, { headers: { Accept: 'application/json' } });
      payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Perfil não encontrado.');
    }
    const profile = payload.profile;
    loadedProfile = profile;
    loadedPosts = Array.isArray(payload.posts) ? payload.posts : [];
    ownerDevice = previewMode || await isOwnerDevice();
    document.title = `${profile.displayName} | Meu Caminho Be`;
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow');
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Diário esportivo público de ${profile.displayName} no Meu Caminho Be.`);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${profile.displayName} | Perfil esportivo`);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', `${profile.displayName} compartilha sua história em ${profile.favoriteSport} no Meu Caminho Be.`);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', new URL(`/diario/${payload.slug}`, location.origin).href);
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = new URL(`/diario/${payload.slug}`, location.origin).href;
    document.head.append(canonical);
    document.getElementById('be-public-name').textContent = profile.displayName;
    document.getElementById('be-public-handle').textContent = `@${payload.slug}`;
    document.getElementById('be-public-bio').textContent = profile.bio || 'O esporte faz parte da minha história.';
    document.getElementById('be-public-sport').textContent = profile.favoriteSport;
    document.getElementById('be-public-count').textContent = String(loadedPosts.length);
    const likes = loadedPosts.reduce((total, post) => total + Math.max(0, Number(post.likes || 0)), 0);
    const highlights = loadedPosts.filter(post => post.personalBest || ['achievement', 'goal'].includes(post.postType)).length;
    document.getElementById('be-public-likes').textContent = String(likes);
    document.getElementById('be-public-highlights').textContent = String(highlights);
    const shareProfileButton = document.getElementById('be-public-share-profile');
    if (shareProfileButton) shareProfileButton.hidden = !ownerDevice;
    const profileDestination = document.getElementById('be-public-profile-destination');
    if (profileDestination && ownerDevice) {
      profileDestination.href = '/meu-caminho-be/perfil';
      profileDestination.textContent = 'Gerenciar meu perfil';
    }
    const photo = document.getElementById('be-public-photo');
    const fallback = document.getElementById('be-public-fallback');
    if (profile.photoDataUrl) {
      photo.src = profile.photoDataUrl;
      photo.hidden = false;
      fallback.hidden = true;
    } else fallback.textContent = profile.displayName.charAt(0).toLocaleUpperCase('pt-BR');
    const posts = document.getElementById('be-public-posts');
    if (loadedPosts.length) posts.replaceChildren(...loadedPosts.map(postCard));
    else {
      const empty = document.createElement('p');
      empty.className = 'be-public-empty';
      empty.textContent = 'Este diário ainda não tem publicações públicas.';
      posts.replaceChildren(empty);
    }
    loading.hidden = true;
    content.hidden = false;
    const sharedPostId = new URLSearchParams(location.search).get('publicacao');
    if (sharedPostId && loadedPosts.some(post => post.id === sharedPostId)) {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(`publicacao-${sharedPostId}`);
        target?.classList.add('is-shared-target');
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  document.getElementById('be-public-report-profile')?.addEventListener('click', event => {
    event.currentTarget.disabled = true;
    reportContent('profile').catch(error => {
      document.getElementById('be-public-report-feedback').textContent = error.message;
    }).finally(() => { event.currentTarget.disabled = false; });
  });
  document.getElementById('be-public-share-profile')?.addEventListener('click', shareProfile);
  document.getElementById('be-public-posts')?.addEventListener('click', event => {
    const likeButton = event.target.closest('[data-public-like-post]');
    if (likeButton && !likeButton.disabled) {
      toggleLike(likeButton.dataset.publicLikePost, likeButton).catch(error => {
        document.getElementById('be-public-report-feedback').textContent = error.message;
      });
      return;
    }
    const commentButton = event.target.closest('[data-public-comment-toggle]');
    if (commentButton) {
      const comments = document.querySelector(`[data-public-comments="${CSS.escape(commentButton.dataset.publicCommentToggle)}"]`);
      if (comments) {
        comments.hidden = !comments.hidden;
        commentButton.setAttribute('aria-expanded', String(!comments.hidden));
        if (!comments.hidden) comments.querySelector('input')?.focus();
      }
      return;
    }
    const shareButton = event.target.closest('[data-public-share-post]');
    if (shareButton && !shareButton.disabled) {
      const post = loadedPosts.find(item => item.id === shareButton.dataset.publicSharePost);
      if (post) sharePublication(post, shareButton);
      return;
    }
    const button = event.target.closest('[data-post-id]');
    if (!button || button.disabled) return;
    button.disabled = true;
    reportContent('post', button.dataset.postId).catch(error => {
      document.getElementById('be-public-report-feedback').textContent = error.message;
    }).finally(() => { button.disabled = false; });
  });
  document.getElementById('be-public-posts')?.addEventListener('submit', event => {
    const form = event.target.closest('[data-public-comment-form]');
    if (!form) return;
    event.preventDefault();
    sendComment(form);
  });
  load().catch(error => {
    loading.querySelector('h1').textContent = 'Perfil indisponível';
    loading.querySelector('p').textContent = error.message;
    loading.classList.add('be-public-error');
  });
})();
