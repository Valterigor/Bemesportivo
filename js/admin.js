const login = document.getElementById('adminLogin');
const dashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('adminLoginForm');
const loginFeedback = document.getElementById('adminLoginFeedback');
const feedback = document.getElementById('adminFeedback');
const exitButton = document.getElementById('adminExit');
const tokenKey = 'beAdminSessionToken';

function sessionToken() {
  try { return sessionStorage.getItem(tokenKey) || ''; } catch { return ''; }
}

function setFeedback(element, message = '', state = '') {
  element.textContent = message;
  element.dataset.state = state;
}

async function request(path, options = {}) {
  const response = await fetch(`/api/admin/${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-BE-Admin-Token': sessionToken(),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Não foi possível acessar o painel.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

function number(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0));
}

function dateTime(value) {
  if (!value) return 'sem atualização registrada';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function setMetric(id, value) {
  document.getElementById(id).textContent = number(value);
}

function moderationItem(item) {
  const article = document.createElement('article');
  article.className = 'admin-moderation-item';
  const content = document.createElement('div');
  const meta = document.createElement('div');
  meta.className = 'admin-comment-meta';
  const author = document.createElement('strong');
  author.textContent = item.name || 'Visitante';
  const channel = document.createElement('span');
  channel.textContent = item.channel;
  const created = document.createElement('span');
  created.textContent = dateTime(item.createdAt);
  const badge = document.createElement('span');
  badge.className = `admin-badge${item.hidden ? ' hidden' : ''}`;
  badge.textContent = item.disabled
    ? 'Desativado pela pessoa'
    : item.hidden
      ? 'Oculto'
      : item.pending
      ? 'Legado aguardando análise'
      : item.reportCount
        ? `${number(item.reportCount)} denúncia${item.reportCount === 1 ? '' : 's'}`
        : 'Publicado';
  meta.append(author, channel, created, badge);
  const text = document.createElement('p');
  text.className = 'admin-comment-text';
  text.textContent = item.text;
  content.append(meta, text);
  if (item.hasImage) {
    const media = document.createElement('div');
    media.className = 'admin-moderation-media';
    media.textContent = 'Carregando imagem protegida…';
    content.append(media);
    const profileId = item.type === 'public-profile' ? item.id : item.profileId;
    request(`media?profileId=${encodeURIComponent(profileId)}&itemId=${encodeURIComponent(item.id)}&type=${encodeURIComponent(item.type)}`)
      .then(payload => {
        const image = document.createElement('img');
        image.src = payload.imageDataUrl;
        image.alt = `Imagem enviada por ${item.name || 'pessoa usuária'}`;
        media.replaceChildren(image);
      })
      .catch(() => { media.textContent = 'Não foi possível carregar a imagem.'; });
  }
  if (item.videoId) {
    const link = document.createElement('a');
    link.className = 'admin-moderation-video';
    link.href = `https://www.youtube.com/watch?v=${item.videoId}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Abrir vídeo para análise →';
    content.append(link);
  }

  const actions = document.createElement('div');
  actions.className = 'admin-moderation-actions';
  const primary = document.createElement('button');
  primary.type = 'button';
  primary.dataset.action = item.hidden ? 'restore' : item.pending ? 'approve' : 'hide';
  primary.textContent = item.hidden ? 'Restaurar' : item.pending ? 'Aprovar' : 'Ocultar';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.dataset.action = 'delete';
  remove.textContent = 'Excluir';
  actions.append(primary, remove);
  actions.addEventListener('click', event => moderate(event, item, actions));
  article.append(content, actions);
  return article;
}

function render(data) {
  setMetric('metricComments', data.community.comments);
  setMetric('metricReplies', data.community.replies);
  document.getElementById('metricReplies').textContent = `${number(data.community.replies)} respostas`;
  setMetric('metricReported', data.community.reported);
  document.getElementById('metricHidden').textContent = `${number(data.community.hidden)} ocultos`;
  setMetric('metricContinuity', data.services.continuity.count);
  setMetric('metricNotifications', data.services.notifications.count);
  setMetric('metricAnalytics', data.services.analytics.count);
  setMetric('metricRanking', data.services.ranking.count);
  setMetric('metricPublicProfiles', data.publicProfiles?.profiles);
  document.getElementById('metricPublicPending').textContent = `${number(data.publicProfiles?.pending)} exigem atenção`;
  document.getElementById('adminUpdated').textContent = `Atualizado em ${dateTime(data.generatedAt)}`;

  const items = data.community.moderation || [];
  document.getElementById('moderationCount').textContent = `${number(items.length)} ${items.length === 1 ? 'item' : 'itens'}`;
  const list = document.getElementById('moderationList');
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'Nenhum conteúdo público ou comentário encontrado.';
    list.append(empty);
  } else {
    items.forEach(item => list.append(moderationItem(item)));
  }
}

async function loadDashboard() {
  setFeedback(feedback, 'Atualizando dados…');
  try {
    const data = await request('overview');
    render(data);
    login.hidden = true;
    dashboard.hidden = false;
    exitButton.hidden = false;
    setFeedback(feedback, 'Painel atualizado.', 'success');
  } catch (error) {
    if (error.status === 401) logout(false);
    else setFeedback(login.hidden ? feedback : loginFeedback, error.message, 'error');
    throw error;
  }
}

async function moderate(event, item, container) {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'delete' && !confirm('Excluir definitivamente este conteúdo? Esta ação não pode ser desfeita.')) return;
  container.querySelectorAll('button').forEach(control => { control.disabled = true; });
  setFeedback(feedback, 'Aplicando moderação…');
  try {
    await request('moderate', {
      method: 'POST',
      body: JSON.stringify(item.type?.startsWith('public-')
        ? { action, type: item.type, profileId: item.type === 'public-profile' ? item.id : item.profileId, itemId: item.id }
        : { action, channel: item.channel, commentId: item.id })
    });
    await loadDashboard();
    setFeedback(feedback, action === 'delete' ? 'Conteúdo excluído.' : action === 'approve' ? 'Conteúdo aprovado.' : action === 'restore' ? 'Conteúdo restaurado.' : 'Conteúdo ocultado.', 'success');
  } catch (error) {
    setFeedback(feedback, error.message, 'error');
    container.querySelectorAll('button').forEach(control => { control.disabled = false; });
  }
}

function logout(showMessage = true) {
  try { sessionStorage.removeItem(tokenKey); } catch {}
  dashboard.hidden = true;
  exitButton.hidden = true;
  login.hidden = false;
  loginForm.reset();
  if (showMessage) setFeedback(loginFeedback, 'Sessão encerrada neste navegador.', 'success');
  document.getElementById('adminToken').focus();
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const token = String(new FormData(loginForm).get('token') || '').trim();
  if (token.length < 32) {
    setFeedback(loginFeedback, 'A chave precisa ter pelo menos 32 caracteres.', 'error');
    return;
  }
  const submit = loginForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Verificando…';
  try {
    sessionStorage.setItem(tokenKey, token);
    await loadDashboard();
    loginForm.reset();
  } catch {
    try { sessionStorage.removeItem(tokenKey); } catch {}
  } finally {
    submit.disabled = false;
    submit.textContent = 'Entrar no painel';
  }
});

document.getElementById('adminRefresh').addEventListener('click', () => loadDashboard().catch(() => {}));
exitButton.addEventListener('click', () => logout());
if (sessionToken()) loadDashboard().catch(() => {});
