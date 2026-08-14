const API_ROOT = location.protocol === 'file:' ? '' : '/api/community';
const CLIENT_KEY = 'bemEsportivoCommunityClientId';
const NAME_KEY = 'bemEsportivoCommunityName';
const mounted = new Map();

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function clientId() {
  try {
    let value = localStorage.getItem(CLIENT_KEY);
    if (!value) {
      value = crypto.randomUUID?.() || `be-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(CLIENT_KEY, value);
    }
    return value;
  } catch {
    return `be-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function savedName() {
  try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
}

async function request(path, options = {}) {
  if (!API_ROOT) throw new Error('Abra o site pelo servidor local para usar os comentários.');
  const response = await fetch(`${API_ROOT}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'A comunidade está temporariamente indisponível.');
  return payload;
}

function formatDate(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function initials(name) {
  return String(name || 'V').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'V';
}

function commentTemplate(comment) {
  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  return `<article class="be-community-comment" data-comment-id="${escapeHtml(comment.id)}">
    <span class="be-community-avatar" aria-hidden="true">${escapeHtml(initials(comment.name))}</span>
    <div class="be-community-comment-body">
      <header><strong>${escapeHtml(comment.name || 'Visitante')}</strong><time datetime="${escapeHtml(comment.createdAt)}">${escapeHtml(formatDate(comment.createdAt))}</time></header>
      <p>${escapeHtml(comment.text)}</p>
      <div class="be-community-actions">
        <button type="button" data-community-action="like" aria-label="Curtir comentário">♡ <span>${Number(comment.likes || 0)}</span></button>
        <button type="button" data-community-action="reply">Responder</button>
        <button type="button" data-community-action="report">Denunciar</button>
      </div>
      <form class="be-community-reply-form" hidden>
        <label>Seu nome ou apelido<input name="name" maxlength="40" autocomplete="nickname" value="${escapeHtml(savedName())}" required></label>
        <label>Sua resposta<textarea name="text" maxlength="400" rows="2" required></textarea></label>
        <label class="be-community-consent"><input type="checkbox" name="adult" required> Confirmo que tenho 18 anos ou mais.</label>
        <div><button type="button" data-community-reply-cancel>Cancelar</button><button type="submit">Publicar resposta</button></div>
      </form>
      ${replies.length ? `<div class="be-community-replies">${replies.map(reply => `<article><strong>${escapeHtml(reply.name || 'Visitante')}</strong><p>${escapeHtml(reply.text)}</p><time>${escapeHtml(formatDate(reply.createdAt))}</time></article>`).join('')}</div>` : ''}
    </div>
  </article>`;
}

class CommunityComments {
  constructor(root, scope, id) {
    this.root = root;
    this.scope = scope;
    this.id = id;
    this.comments = [];
    this.loading = false;
    this.renderShell();
    this.bind();
    this.load();
  }

  renderShell() {
    const heading = this.scope === 'beplay' ? 'Converse sobre este vídeo' : 'Participe da conversa';
    this.root.dataset.communityStandard = 'true';
    this.root.className = `${this.root.className} be-community`.trim();
    this.root.innerHTML = `<header class="be-community-heading">
      <div><span>COMUNIDADE BEM ESPORTIVO</span><h2>${heading}</h2><p>Comentários públicos e visíveis para todas as pessoas que acessarem esta página.</p></div>
      <button type="button" data-community-refresh aria-label="Atualizar comentários">↻ Atualizar</button>
    </header>
    <form class="be-community-form">
      <div class="be-community-fields">
        <label>Seu nome ou apelido<input name="name" maxlength="40" autocomplete="nickname" value="${escapeHtml(savedName())}" placeholder="Como quer aparecer?" required></label>
        <label class="be-community-message">Seu comentário<textarea name="text" maxlength="500" rows="3" placeholder="Compartilhe uma experiência, dúvida ou incentivo..." required></textarea></label>
      </div>
      <input class="be-community-honeypot" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <footer><label class="be-community-consent"><input type="checkbox" name="adult" required> Tenho 18 anos ou mais e aceito as <a href="/diretrizes-da-comunidade" target="_blank" rel="noopener noreferrer">Diretrizes da Comunidade</a>.</label><button type="submit">Publicar comentário</button></footer>
    </form>
    <p class="be-community-feedback" role="status" aria-live="polite"></p>
    <div class="be-community-list" aria-live="polite"><div class="be-community-loading">Carregando a conversa…</div></div>`;
  }

  bind() {
    this.root.querySelector('[data-community-refresh]').addEventListener('click', () => this.load(true));
    this.root.querySelector('.be-community-form').addEventListener('submit', event => this.publish(event));
    this.root.addEventListener('click', event => this.action(event));
    this.root.addEventListener('submit', event => {
      if (event.target.matches('.be-community-reply-form')) this.reply(event);
    });
  }

  feedback(message, tone = '') {
    const target = this.root.querySelector('.be-community-feedback');
    target.textContent = message;
    target.dataset.tone = tone;
  }

  render() {
    const list = this.root.querySelector('.be-community-list');
    list.innerHTML = this.comments.length
      ? [...this.comments].reverse().map(commentTemplate).join('')
      : '<div class="be-community-empty"><span>✦</span><strong>Comece esta conversa</strong><p>Uma pergunta ou experiência sua pode ajudar outra pessoa a continuar.</p></div>';
  }

  async load(announce = false) {
    if (this.loading) return;
    this.loading = true;
    try {
      const payload = await request(`/comments?scope=${encodeURIComponent(this.scope)}&id=${encodeURIComponent(this.id)}`);
      this.comments = Array.isArray(payload.comments) ? payload.comments : [];
      this.render();
      if (announce) this.feedback('Comentários atualizados.', 'success');
    } catch (error) {
      this.feedback(error.message, 'error');
      this.root.querySelector('.be-community-list').innerHTML = '<div class="be-community-empty"><strong>Não foi possível carregar agora.</strong><p>Tente atualizar em alguns instantes.</p></div>';
    } finally {
      this.loading = false;
    }
  }

  async publish(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const button = form.querySelector('[type="submit"]');
    const name = String(data.get('name') || '').trim().slice(0, 40) || 'Visitante';
    button.disabled = true;
    button.textContent = 'Publicando…';
    this.feedback('Enviando seu comentário para a comunidade…');
    try {
      const payload = await request('/comment', { method: 'POST', body: JSON.stringify({
        scope: this.scope, id: this.id, name, text: String(data.get('text') || '').trim().slice(0, 500),
        website: String(data.get('website') || ''), adultConfirmed: data.get('adult') === 'on', clientId: clientId()
      }) });
      try { localStorage.setItem(NAME_KEY, name); } catch (error) {}
      this.comments = payload.comments || [];
      form.elements.text.value = '';
      form.elements.adult.checked = false;
      this.render();
      this.feedback('Comentário publicado. Ele já está visível para todos.', 'success');
    } catch (error) {
      this.feedback(error.message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Publicar comentário';
    }
  }

  async action(event) {
    const button = event.target.closest('[data-community-action], [data-community-reply-cancel]');
    if (!button) return;
    const comment = button.closest('[data-comment-id]');
    if (button.hasAttribute('data-community-reply-cancel')) {
      button.closest('form').hidden = true;
      return;
    }
    const action = button.dataset.communityAction;
    if (action === 'reply') {
      const form = comment.querySelector('.be-community-reply-form');
      form.hidden = !form.hidden;
      if (!form.hidden) form.elements.text.focus();
      return;
    }
    if (action === 'report' && !confirm('Enviar este comentário para análise?')) return;
    button.disabled = true;
    try {
      const payload = await request('/comment-action', { method: 'POST', body: JSON.stringify({
        scope: this.scope, id: this.id, commentId: comment.dataset.commentId, action, clientId: clientId()
      }) });
      this.comments = payload.comments || [];
      this.render();
      this.feedback(action === 'like' ? 'Curtida atualizada.' : 'Denúncia recebida para análise.', 'success');
    } catch (error) {
      button.disabled = false;
      this.feedback(error.message, 'error');
    }
  }

  async reply(event) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.target;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim().slice(0, 40) || 'Visitante';
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'Publicando…';
    try {
      const payload = await request('/comment-action', { method: 'POST', body: JSON.stringify({
        scope: this.scope, id: this.id, commentId: form.closest('[data-comment-id]').dataset.commentId,
        action: 'reply', name, text: String(data.get('text') || '').trim().slice(0, 400), adultConfirmed: data.get('adult') === 'on', clientId: clientId()
      }) });
      try { localStorage.setItem(NAME_KEY, name); } catch (error) {}
      this.comments = payload.comments || [];
      this.render();
      this.feedback('Resposta publicada para todos.', 'success');
    } catch (error) {
      this.feedback(error.message, 'error');
      button.disabled = false;
      button.textContent = 'Publicar resposta';
    }
  }

  changeId(id) {
    if (!id || id === this.id) return;
    this.id = id;
    this.comments = [];
    this.root.querySelector('.be-community-list').innerHTML = '<div class="be-community-loading">Carregando a conversa deste vídeo…</div>';
    this.load();
  }
}

function mount(root, scope, id) {
  if (!root || !scope || !id) return null;
  const existing = mounted.get(root);
  if (existing) {
    existing.changeId(id);
    return existing;
  }
  const instance = new CommunityComments(root, scope, id);
  mounted.set(root, instance);
  return instance;
}

export function initCommunityComments() {
  if (!document.querySelector('link[href*="community-comments.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/css/components/community-comments.css?v=20260813-1';
    document.head.append(stylesheet);
  }
  document.querySelectorAll('[data-report-comments]').forEach(root => mount(root, 'report', root.dataset.reportComments));
  document.querySelectorAll('[data-community-scope][data-community-id]').forEach(root => mount(root, root.dataset.communityScope, root.dataset.communityId));
  window.BemCommunityComments = { mount };
  window.addEventListener('beplay:video-change', event => {
    const root = document.getElementById('videoComments');
    if (root) mount(root, 'beplay', event.detail?.id);
  });
  window.setInterval(() => {
    if (!document.hidden) mounted.forEach(instance => instance.load());
  }, 30000);
}
