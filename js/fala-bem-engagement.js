(() => {
  const key = 'bemEsportivoFalaBemSelecaoV1';
  const title = 'Sem um meia armador, o Brasil perde a conversa do jogo';
  const state = JSON.parse(localStorage.getItem(key) || '{"liked":false,"likes":0,"comments":[]}');
  const like = document.querySelector('#opinion-like');
  const likes = document.querySelector('#like-count');
  const likeMessage = document.querySelector('#like-message');
  const form = document.querySelector('#comment-form');
  const name = document.querySelector('#comment-name');
  const text = document.querySelector('#comment-text');
  const remaining = document.querySelector('#comment-remaining');
  const feedback = document.querySelector('#comment-feedback');
  const list = document.querySelector('#comments-list');
  const counter = document.querySelector('#comment-count');

  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const renderLikes = () => {
    likes.textContent = state.likes;
    like.setAttribute('aria-pressed', String(state.liked));
    like.classList.toggle('is-liked', state.liked);
  };
  const renderComments = () => {
    const total = state.comments.length;
    counter.textContent = total ? `${total} comentário${total === 1 ? '' : 's'}` : 'Seja o primeiro a comentar.';
    list.replaceChildren();
    state.comments.slice().reverse().forEach((comment) => {
      const item = document.createElement('article');
      item.className = 'comment-item';
      const heading = document.createElement('strong');
      heading.textContent = comment.name;
      const body = document.createElement('p');
      body.textContent = comment.text;
      item.append(heading, body);
      list.append(item);
    });
  };
  like.addEventListener('click', () => {
    state.liked = !state.liked;
    state.likes = Math.max(0, state.likes + (state.liked ? 1 : -1));
    likeMessage.textContent = state.liked ? 'Obrigado por reagir.' : 'Reação removida.';
    save(); renderLikes();
  });
  text.addEventListener('input', () => { remaining.textContent = `${text.value.length}/500`; });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const person = name.value.trim(); const message = text.value.trim();
    if (!person || !message) return;
    state.comments.push({ name: person, text: message });
    save(); renderComments(); form.reset(); remaining.textContent = '0/500';
    feedback.textContent = 'Comentário publicado neste navegador.';
  });
  document.querySelectorAll('[data-share]').forEach((button) => button.addEventListener('click', async () => {
    const url = window.location.href;
    if (button.dataset.share === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`, '_blank', 'noopener');
    else if (button.dataset.share === 'instagram') { await navigator.clipboard.writeText(url); document.querySelector('#share-feedback').textContent = 'Link copiado. Abra o Instagram, crie um Story e cole o link.'; }
    else if (button.dataset.share === 'x') window.open(`https://x.com/intent/post?text=${encodeURIComponent(`${title} — ${url}`)}`, '_blank', 'noopener');
    else if (button.dataset.share === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener');
    else if (navigator.share) await navigator.share({ title, url });
    else { await navigator.clipboard.writeText(url); button.textContent = 'Link copiado'; }
  }));
  renderLikes(); renderComments();
})();
