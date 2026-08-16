(() => {
  'use strict';
  const slug = new URLSearchParams(location.search).get('perfil') || location.pathname.match(/^\/diario\/(be-[a-f0-9]{12})\/?$/)?.[1] || '';
  const loading = document.getElementById('be-public-loading');
  const content = document.getElementById('be-public-content');
  const escapeText = value => String(value || '');

  function postCard(post) {
    const article = document.createElement('article');
    article.className = 'be-public-post';
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
    label.textContent = escapeText(post.activity || 'REGISTRO ESPORTIVO').toLocaleUpperCase('pt-BR');
    const text = document.createElement('p');
    text.textContent = escapeText(post.text);
    const time = document.createElement('time');
    time.dateTime = post.occurredAt;
    time.textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${post.occurredAt}T12:00:00`));
    const report = document.createElement('button');
    report.type = 'button';
    report.className = 'be-public-report-post';
    report.dataset.postId = post.id;
    report.textContent = 'Denunciar publicação';
    copy.append(label, text, time, report);
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

  async function load() {
    if (!/^be-[a-f0-9]{12}$/.test(slug)) throw new Error('Este endereço de perfil não é válido.');
    const response = await fetch(`/api/public-profiles/${slug}`, { headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Perfil não encontrado.');
    const profile = payload.profile;
    document.title = `${profile.displayName} | Meu Caminho Be`;
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow');
    document.querySelector('meta[name="description"]')?.setAttribute('content', `Diário esportivo público de ${profile.displayName} no Meu Caminho Be.`);
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = new URL(`/diario/${payload.slug}`, location.origin).href;
    document.head.append(canonical);
    document.getElementById('be-public-name').textContent = profile.displayName;
    document.getElementById('be-public-handle').textContent = `@${payload.slug}`;
    document.getElementById('be-public-bio').textContent = profile.bio || 'O esporte faz parte da minha história.';
    document.getElementById('be-public-age').textContent = `${profile.age} anos`;
    document.getElementById('be-public-profession').textContent = profile.profession;
    document.getElementById('be-public-sport').textContent = profile.favoriteSport;
    document.getElementById('be-public-count').textContent = String(payload.posts.length);
    const photo = document.getElementById('be-public-photo');
    const fallback = document.getElementById('be-public-fallback');
    if (profile.photoDataUrl) {
      photo.src = profile.photoDataUrl;
      photo.hidden = false;
      fallback.hidden = true;
    } else fallback.textContent = profile.displayName.charAt(0).toLocaleUpperCase('pt-BR');
    const posts = document.getElementById('be-public-posts');
    if (payload.posts.length) posts.replaceChildren(...payload.posts.map(postCard));
    else {
      const empty = document.createElement('p');
      empty.className = 'be-public-empty';
      empty.textContent = 'Este diário ainda não tem publicações públicas.';
      posts.replaceChildren(empty);
    }
    loading.hidden = true;
    content.hidden = false;
  }

  document.getElementById('be-public-report-profile')?.addEventListener('click', event => {
    event.currentTarget.disabled = true;
    reportContent('profile').catch(error => {
      document.getElementById('be-public-report-feedback').textContent = error.message;
    }).finally(() => { event.currentTarget.disabled = false; });
  });
  document.getElementById('be-public-posts')?.addEventListener('click', event => {
    const button = event.target.closest('[data-post-id]');
    if (!button || button.disabled) return;
    button.disabled = true;
    reportContent('post', button.dataset.postId).catch(error => {
      document.getElementById('be-public-report-feedback').textContent = error.message;
    }).finally(() => { button.disabled = false; });
  });
  load().catch(error => {
    loading.querySelector('h1').textContent = 'Perfil indisponível';
    loading.querySelector('p').textContent = error.message;
    loading.classList.add('be-public-error');
  });
})();
