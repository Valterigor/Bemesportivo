(() => {
  'use strict';
  const slug = new URLSearchParams(location.search).get('perfil') || '';
  const loading = document.getElementById('be-public-loading');
  const content = document.getElementById('be-public-content');
  const escapeText = value => String(value || '');

  function postCard(post) {
    const article = document.createElement('article');
    article.className = 'be-public-post';
    if (post.kind === 'photo' && post.imageDataUrl) {
      const image = document.createElement('img');
      image.src = post.imageDataUrl;
      image.alt = post.activity ? `Registro de ${post.activity}` : 'Foto compartilhada no diário esportivo';
      image.loading = 'lazy';
      article.append(image);
    }
    if (post.kind === 'video' && post.videoId) {
      const video = document.createElement('div');
      video.className = 'be-public-video';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${post.videoId}?rel=0&playsinline=1`;
      iframe.title = post.activity ? `Vídeo de ${post.activity}` : 'Vídeo do diário esportivo';
      iframe.loading = 'lazy';
      iframe.allowFullscreen = true;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      video.append(iframe);
      article.append(video);
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
    copy.append(label, text, time);
    article.append(copy);
    return article;
  }

  async function load() {
    if (!/^be-[a-f0-9]{12}$/.test(slug)) throw new Error('Este endereço de perfil não é válido.');
    const response = await fetch(`/api/public-profiles/${slug}`, { headers: { Accept: 'application/json' } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Perfil não encontrado.');
    const profile = payload.profile;
    document.title = `${profile.displayName} | Meu Caminho Be`;
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
      empty.textContent = 'Nenhuma publicação aprovada por enquanto.';
      posts.replaceChildren(empty);
    }
    loading.hidden = true;
    content.hidden = false;
  }

  load().catch(error => {
    loading.querySelector('h1').textContent = 'Perfil indisponível';
    loading.querySelector('p').textContent = error.message;
    loading.classList.add('be-public-error');
  });
})();
