(() => {
  'use strict';

  const PROFILE_KEY = 'meuCaminhoBeProfileV1';
  const DIARY_KEY = 'meuCaminhoBeDiaryV1';
  const POSTS_KEY = 'meuCaminhoBeSportsPostsV1';
  const PAGE_SIZE = 8;
  const postTypes = Object.freeze({
    photo: 'Momento esportivo',
    training: 'Treino concluído',
    result: 'Resultado',
    achievement: 'Conquista',
    evolution: 'Evolução',
    competition: 'Jogo ou competição',
    return: 'Retorno ao esporte',
    goal: 'Meta alcançada'
  });
  const typeIcons = Object.freeze({ photo: '📷', training: '🔥', result: '↗', achievement: '🏆', evolution: '📈', competition: '🏅', return: '↺', goal: '🎯' });
  let pendingPhoto = '';
  let visiblePosts = PAGE_SIZE;
  let activeTab = 'posts';

  const byId = id => document.getElementById(id);
  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  };
  const cleanText = (value, maximum = 600) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum);
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
  const dayKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const dateFromKey = value => new Date(`${value}T12:00:00`);
  const formatDate = value => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(dateFromKey(validDate(value) ? value : dayKey()));
  const formatNumber = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  const formatDuration = minutes => {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    if (total < 60) return `${total} min`;
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  };
  const formatPace = (minutes, distance) => {
    const pace = Number(minutes) / Number(distance);
    if (!Number.isFinite(pace) || pace <= 0) return '';
    const totalSeconds = Math.round(pace * 60);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}/km`;
  };

  function profile() {
    const value = readJson(PROFILE_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function diaryEntries() {
    const values = readJson(DIARY_KEY, []);
    return (Array.isArray(values) ? values : []).filter(entry => entry && validDate(entry.date) && Number(entry.duration) > 0).map(entry => ({
      id: cleanText(entry.id, 80),
      date: entry.date,
      type: cleanText(entry.type, 30) || 'outro',
      title: cleanText(entry.title, 80),
      duration: Math.min(1440, Math.max(1, Math.round(Number(entry.duration) || 0))),
      distance: Number(entry.distance) > 0 ? Math.min(10000, Number(entry.distance)) : null,
      result: cleanText(entry.result, 80),
      feeling: ['1', '2', '3', '4', '5'].includes(String(entry.feeling)) ? String(entry.feeling) : '',
      text: cleanText(entry.note, 600),
      imageDataUrl: validImageData(entry.imageDataUrl) ? String(entry.imageDataUrl) : '',
      visibility: entry.visibility === 'public' ? 'public' : 'private',
      publicStatus: cleanText(entry.publicStatus, 20),
      createdAt: cleanText(entry.createdAt, 40)
    })).sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));
  }

  function validImageData(value) {
    const image = String(value || '');
    return /^data:image\/(?:jpeg|webp);base64,[a-z0-9+/=]+$/i.test(image) && image.length <= 480000;
  }

  function sanitizePost(value = {}) {
    if (!value || typeof value !== 'object') return null;
    const postType = Object.prototype.hasOwnProperty.call(postTypes, value.postType) ? value.postType : 'photo';
    const text = cleanText(value.text, 600);
    const imageDataUrl = validImageData(value.imageDataUrl) ? String(value.imageDataUrl) : '';
    if (!text && !imageDataUrl) return null;
    const durationValue = Number(value.duration);
    const distanceValue = Number(value.distance);
    return {
      id: String(value.id || `sport-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`).replace(/[^A-Za-z0-9:_-]/g, '').slice(0, 100),
      postType,
      title: cleanText(value.title, 80),
      text,
      activity: cleanText(value.activity, 60),
      occurredAt: validDate(value.occurredAt) ? value.occurredAt : dayKey(),
      duration: Number.isFinite(durationValue) && durationValue > 0 ? Math.min(1440, Math.round(durationValue)) : null,
      distance: Number.isFinite(distanceValue) && distanceValue > 0 ? Math.min(10000, Math.round(distanceValue * 100) / 100) : null,
      result: cleanText(value.result, 80),
      feeling: ['1', '2', '3', '4', '5'].includes(String(value.feeling)) ? String(value.feeling) : '',
      personalBest: value.personalBest === true,
      imageDataUrl,
      visibility: value.visibility === 'public' ? 'public' : 'private',
      publicStatus: ['published', 'approved', 'hidden', 'failed', 'pending'].includes(value.publicStatus) ? value.publicStatus : '',
      createdAt: cleanText(value.createdAt, 40) || new Date().toISOString(),
      updatedAt: cleanText(value.updatedAt, 40) || new Date().toISOString()
    };
  }

  function localPosts() {
    const values = readJson(POSTS_KEY, []);
    return (Array.isArray(values) ? values : []).map(sanitizePost).filter(Boolean).sort((a, b) => `${b.occurredAt}${b.createdAt}`.localeCompare(`${a.occurredAt}${a.createdAt}`));
  }

  function saveLocalPosts(posts) {
    const safe = posts.map(sanitizePost).filter(Boolean).slice(0, 250);
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(safe));
      window.dispatchEvent(new CustomEvent('meuCaminhoBe:sports-posts-changed', { detail: { count: safe.length } }));
      return true;
    } catch {
      return false;
    }
  }

  function activityMetrics(entries = diaryEntries()) {
    const dates = [...new Set(entries.map(entry => entry.date))].sort();
    let bestStreak = dates.length ? 1 : 0;
    let running = dates.length ? 1 : 0;
    for (let index = 1; index < dates.length; index += 1) {
      const difference = Math.round((dateFromKey(dates[index]) - dateFromKey(dates[index - 1])) / 86400000);
      running = difference === 1 ? running + 1 : 1;
      bestStreak = Math.max(bestStreak, running);
    }
    const dateSet = new Set(dates);
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (!dateSet.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let currentStreak = 0;
    while (dateSet.has(dayKey(cursor))) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() || 7) - 1));
    const monthKey = dayKey(now).slice(0, 7);
    return {
      activities: entries.length,
      totalMinutes: entries.reduce((sum, entry) => sum + entry.duration, 0),
      totalDistance: entries.reduce((sum, entry) => sum + (entry.distance || 0), 0),
      currentStreak,
      bestStreak,
      weekCount: entries.filter(entry => dateFromKey(entry.date) >= weekStart).length,
      monthCount: entries.filter(entry => entry.date.startsWith(monthKey)).length
    };
  }

  function achievements(entries = diaryEntries(), posts = localPosts()) {
    const result = [];
    const metrics = activityMetrics(entries);
    const chronological = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const first = chronological[0];
    if (first) result.push({ icon: '🏁', title: 'Primeira atividade registrada', detail: first.title || first.activity || first.type || 'O começo da sua história esportiva.', date: first.date });
    if (metrics.bestStreak >= 7) result.push({ icon: '🔥', title: `${metrics.bestStreak} dias de atividade`, detail: 'Sua melhor sequência registrada até agora.', date: chronological.at(-1)?.date });
    const firstFive = chronological.find(entry => Number(entry.distance) >= 5);
    if (firstFive) result.push({ icon: '🏃', title: 'Primeiros 5 km registrados', detail: firstFive.title || 'Distância registrada em uma atividade.', date: firstFive.date });
    const firstTen = chronological.find(entry => Number(entry.distance) >= 10);
    if (firstTen) result.push({ icon: '🏃', title: 'Primeiros 10 km registrados', detail: firstTen.title || 'Distância registrada em uma atividade.', date: firstTen.date });
    const goals = Number(profile()?.gamificationStats?.goals?.total || 0);
    if (goals >= 50) result.push({ icon: '⚽', title: '50 gols registrados', detail: `Seu contador chegou a ${Math.trunc(goals)} gols.`, date: profile()?.gamificationStats?.goals?.updatedAt?.slice(0, 10) || dayKey() });
    posts.filter(post => post.personalBest).forEach(post => result.push({ icon: '🥇', title: post.title || 'Novo recorde pessoal', detail: post.result || post.text, date: post.occurredAt }));
    posts.filter(post => post.postType === 'goal').forEach(post => result.push({ icon: '🎯', title: post.title || 'Meta alcançada', detail: post.result || post.text, date: post.occurredAt }));
    posts.filter(post => post.postType === 'return').forEach(post => result.push({ icon: '↺', title: post.title || 'Retorno ao esporte', detail: post.text, date: post.occurredAt }));
    const unique = new Map();
    result.forEach(item => unique.set(`${item.title}:${item.date}`, item));
    return [...unique.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = String(value);
  }

  function renderSummary() {
    const entries = diaryEntries();
    const values = activityMetrics(entries);
    const wins = achievements(entries);
    setText('be-profile-stat-records', values.activities);
    setText('be-profile-stat-achievements', wins.length);
    setText('be-profile-metric-activities', values.activities);
    setText('be-profile-metric-time', formatDuration(values.totalMinutes));
    setText('be-profile-metric-distance', `${formatNumber(values.totalDistance)} km`);
    setText('be-profile-metric-streak', `${values.currentStreak} ${values.currentStreak === 1 ? 'dia' : 'dias'}`);
    setText('be-profile-total-activities', values.activities);
    setText('be-profile-total-time', formatDuration(values.totalMinutes));
    setText('be-profile-total-distance', `${formatNumber(values.totalDistance)} km`);
    setText('be-profile-best-streak', `${values.bestStreak} ${values.bestStreak === 1 ? 'dia' : 'dias'}`);
    setText('be-profile-week-count', values.weekCount);
    setText('be-profile-month-count', values.monthCount);
    renderWeekChart(entries);
    renderAchievements(wins);
  }

  function renderWeekChart(entries) {
    const mount = byId('be-profile-week-chart');
    if (!mount) return;
    const weeks = [];
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    for (let offset = 7; offset >= 0; offset -= 1) {
      const end = new Date(now);
      end.setDate(now.getDate() - offset * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const count = entries.filter(entry => {
        const date = dateFromKey(entry.date);
        return date >= start && date <= end;
      }).length;
      weeks.push({ label: offset ? `-${offset}S` : 'Agora', count });
    }
    const maximum = Math.max(1, ...weeks.map(week => week.count));
    mount.replaceChildren(...weeks.map(week => {
      const item = document.createElement('div');
      item.className = 'be-profile-chart-bar';
      item.setAttribute('aria-label', `${week.count} ${week.count === 1 ? 'atividade' : 'atividades'}, ${week.label}`);
      const bar = document.createElement('i');
      bar.style.height = `${Math.max(3, week.count / maximum * 100)}%`;
      const count = document.createElement('b');
      count.textContent = String(week.count);
      const label = document.createElement('small');
      label.textContent = week.label;
      item.append(bar, count, label);
      return item;
    }));
  }

  function renderAchievements(items = achievements()) {
    const mount = byId('be-profile-achievements-list');
    if (!mount) return;
    if (!items.length) {
      mount.replaceChildren(emptyState('Sua primeira conquista começa com um registro.', 'Registre uma atividade real para iniciar sua linha do tempo.', 'Registrar primeira atividade'));
      return;
    }
    mount.replaceChildren(...items.map(item => {
      const article = document.createElement('article');
      article.className = 'be-profile-achievement';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.icon;
      const copy = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const detail = document.createElement('p');
      detail.textContent = item.detail;
      const date = document.createElement('time');
      date.dateTime = item.date;
      date.textContent = formatDate(item.date);
      copy.append(title, detail, date);
      article.append(icon, copy);
      return article;
    }));
  }

  function diaryAsPosts() {
    return diaryEntries().map(entry => ({
      ...entry,
      source: 'diary',
      postType: entry.type === 'jogo' ? 'competition' : 'training',
      occurredAt: entry.date,
      activity: entry.title || entry.type,
      personalBest: false
    }));
  }

  function allFeedPosts() {
    return [...localPosts().map(post => ({ ...post, source: 'post' })), ...diaryAsPosts()]
      .sort((a, b) => `${b.occurredAt}${b.createdAt || ''}`.localeCompare(`${a.occurredAt}${a.createdAt || ''}`));
  }

  function emptyState(title, text, actionLabel = '') {
    const empty = document.createElement('div');
    empty.className = 'be-profile-empty';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const copy = document.createElement('p');
    copy.textContent = text;
    empty.append(strong, copy);
    if (actionLabel) {
      const action = document.createElement('button');
      action.type = 'button';
      action.dataset.profileEmptyAction = 'true';
      action.textContent = actionLabel;
      empty.append(action);
    }
    return empty;
  }

  function feedAvatar(user) {
    const avatar = document.createElement('span');
    avatar.className = 'be-profile-feed-avatar';
    const photo = validImageData(user.photoDataUrl) ? user.photoDataUrl : '';
    if (photo) {
      const image = document.createElement('img');
      image.src = photo;
      image.alt = '';
      avatar.append(image);
    } else avatar.textContent = cleanText(user.name, 40).charAt(0).toLocaleUpperCase('pt-BR') || 'BE';
    return avatar;
  }

  function feedCard(post, user) {
    const article = document.createElement('article');
    article.className = 'be-profile-feed-card';
    article.dataset.profilePost = post.id;
    const head = document.createElement('header');
    head.className = 'be-profile-feed-head';
    const identity = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = cleanText(user.name, 40) || 'Perfil Be';
    const meta = document.createElement('small');
    meta.textContent = `${post.activity || 'Esporte'} · ${formatDate(post.occurredAt)}`;
    identity.append(name, meta);
    const privacy = document.createElement('span');
    privacy.className = 'be-profile-feed-privacy';
    privacy.textContent = post.visibility === 'public' && ['published', 'approved'].includes(post.publicStatus) ? 'Público' : 'Privado';
    head.append(feedAvatar(user), identity, privacy);
    article.append(head);
    if (post.imageDataUrl) {
      const image = document.createElement('img');
      image.src = post.imageDataUrl;
      image.alt = post.title ? `Foto de ${post.title}` : `Foto de ${post.activity || 'momento esportivo'}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      article.append(image);
    }
    const body = document.createElement('div');
    body.className = 'be-profile-feed-body';
    const type = document.createElement('span');
    type.className = 'be-profile-feed-type';
    type.textContent = `${typeIcons[post.postType] || '●'} ${postTypes[post.postType] || 'Momento esportivo'}`.toLocaleUpperCase('pt-BR');
    body.append(type);
    if (post.title) {
      const title = document.createElement('h3');
      title.textContent = post.title;
      body.append(title);
    }
    if (post.text) {
      const text = document.createElement('p');
      text.textContent = post.text;
      body.append(text);
    }
    const metricValues = [
      post.duration ? formatDuration(post.duration) : '',
      post.distance ? `${formatNumber(post.distance)} km` : '',
      post.duration && post.distance ? formatPace(post.duration, post.distance) : '',
      post.result || '',
      post.feeling ? `Sensação ${post.feeling}/5` : ''
    ].filter(Boolean);
    if (metricValues.length) {
      const metrics = document.createElement('div');
      metrics.className = 'be-profile-feed-metrics';
      metrics.replaceChildren(...metricValues.map(value => {
        const span = document.createElement('span');
        span.textContent = value;
        return span;
      }));
      body.append(metrics);
    }
    if (post.personalBest) {
      const record = document.createElement('strong');
      record.className = 'be-profile-feed-record';
      record.textContent = '🏆 NOVO RECORDE PESSOAL';
      body.append(record);
    }
    article.append(body);
    const actions = document.createElement('footer');
    actions.className = 'be-profile-feed-actions';
    const share = document.createElement('button');
    share.type = 'button';
    share.dataset.profilePostShare = post.id;
    share.textContent = 'Compartilhar';
    actions.append(share);
    if (post.source === 'post') {
      const visibility = document.createElement('button');
      visibility.type = 'button';
      visibility.dataset.profilePostVisibility = post.id;
      visibility.dataset.currentVisibility = post.visibility;
      visibility.textContent = post.visibility === 'public' ? 'Tornar privado' : 'Publicar no Meu DiÃ¡rio BE';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.dataset.profilePostEdit = post.id;
      edit.textContent = 'Editar';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.profilePostDelete = post.id;
      remove.textContent = 'Excluir';
      actions.append(visibility, edit, remove);
    } else {
      const diary = document.createElement('button');
      diary.type = 'button';
      diary.dataset.profileOpenDiary = 'true';
      diary.textContent = 'Abrir no diário';
      actions.append(diary);
    }
    article.append(actions);
    return article;
  }

  function renderFeed() {
    const mount = byId('be-profile-feed');
    if (!mount) return;
    const posts = allFeedPosts();
    if (!posts.length) {
      mount.replaceChildren(emptyState('Seu caminho começa aqui.', 'Registre seu primeiro treino, resultado ou conquista.', 'Registrar primeira atividade'));
      byId('be-profile-load-more').hidden = true;
      return;
    }
    mount.replaceChildren(...posts.slice(0, visiblePosts).map(post => feedCard(post, profile())));
    byId('be-profile-load-more').hidden = posts.length <= visiblePosts;
  }

  function selectTab(tab, focus = false) {
    if (!['posts', 'evolution', 'achievements'].includes(tab)) return;
    activeTab = tab;
    document.querySelectorAll('[data-profile-tab]').forEach(button => {
      const selected = button.dataset.profileTab === tab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    ['posts', 'evolution', 'achievements'].forEach(name => {
      const panel = byId(`be-profile-panel-${name}`);
      if (panel) panel.hidden = name !== tab;
    });
  }

  function fieldsForType(type) {
    const metrics = ['training', 'evolution', 'competition', 'return'].includes(type);
    const result = ['result', 'achievement', 'competition', 'goal'].includes(type);
    const title = ['result', 'achievement', 'competition', 'return', 'goal'].includes(type);
    document.querySelectorAll('[data-compose-field="metrics"]').forEach(field => { field.hidden = !metrics; });
    document.querySelectorAll('[data-compose-field="result"]').forEach(field => { field.hidden = !result; });
    document.querySelectorAll('[data-compose-field="title"]').forEach(field => { field.hidden = !title; });
  }

  function renderPhotoPreview() {
    const preview = byId('be-public-compose-preview');
    const image = byId('be-public-compose-preview-image');
    const remove = byId('be-public-compose-photo-remove');
    if (preview) preview.hidden = !pendingPhoto;
    if (remove) remove.hidden = !pendingPhoto;
    if (image) {
      if (pendingPhoto) image.src = pendingPhoto;
      else image.removeAttribute('src');
    }
  }

  function renderVisibilityChoice() {
    const form = byId('be-public-compose-form');
    const selected = form?.querySelector('input[name="visibility"]:checked')?.value || 'private';
    const help = byId('be-public-compose-visibility-help');
    const publicEnabled = profile()?.publicEnabled === true;
    if (!help) return;
    help.dataset.state = selected === 'public' ? 'public' : 'private';
    help.textContent = selected === 'public'
      ? 'Ao salvar, esta publicaÃ§Ã£o tambÃ©m aparecerÃ¡ no seu Meu DiÃ¡rio BE pÃºblico.'
      : publicEnabled
        ? 'Esta publicaÃ§Ã£o ficarÃ¡ privada. VocÃª poderÃ¡ tornÃ¡-la pÃºblica depois pelo card.'
        : 'Esta publicaÃ§Ã£o ficarÃ¡ privada. Ative o Meu DiÃ¡rio BE quando quiser compartilhar.';
  }

  function openComposer(post = null) {
    const form = byId('be-public-compose-form');
    const dialog = byId('be-public-compose-dialog');
    if (!form || !dialog) return;
    form.reset();
    const value = post ? sanitizePost(post) : null;
    byId('be-public-compose-id').value = value?.id || '';
    byId('be-public-compose-type').value = value?.postType || 'training';
    byId('be-public-compose-date').value = value?.occurredAt || dayKey();
    byId('be-public-compose-sport').value = value?.activity || '';
    byId('be-public-compose-title-field').value = value?.title || '';
    byId('be-public-compose-duration').value = value?.duration || '';
    byId('be-public-compose-distance').value = value?.distance || '';
    byId('be-public-compose-result').value = value?.result || '';
    byId('be-public-compose-feeling').value = value?.feeling || '';
    byId('be-public-compose-text').value = value?.text || '';
    byId('be-public-compose-record').checked = value?.personalBest === true;
    const visibility = form.querySelector(`input[name="visibility"][value="${value?.visibility === 'public' ? 'public' : 'private'}"]`);
    if (visibility) visibility.checked = true;
    const publicControl = form.querySelector('input[name="visibility"][value="public"]');
    if (publicControl) publicControl.disabled = profile()?.publicEnabled !== true;
    pendingPhoto = value?.imageDataUrl || '';
    setText('be-public-compose-count', (value?.text || '').length);
    setText('be-public-compose-title', value ? 'Editar publicação' : 'Nova publicação');
    setText('be-public-compose-submit', value ? 'Salvar alterações' : 'Salvar momento');
    setText('be-public-compose-feedback', profile()?.publicEnabled ? '' : 'Publicações começam privadas. Para torná-las públicas, ative o Meu Diário BE no Perfil.');
    fieldsForType(value?.postType || 'training');
    renderVisibilityChoice();
    renderPhotoPreview();
    dialog.showModal();
    window.setTimeout(() => byId('be-public-compose-type')?.focus(), 30);
  }

  function closeComposer() {
    byId('be-public-compose-dialog')?.close();
    pendingPhoto = '';
    renderPhotoPreview();
  }

  async function imageMagicIsValid(file) {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    return jpeg || png || webp;
  }

  async function resizePhoto(file) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024 || !(await imageMagicIsValid(file))) {
      throw new Error('Escolha uma foto JPG, PNG ou WebP válida de até 10 MB.');
    }
    let bitmap;
    let objectUrl = '';
    try {
      if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file);
      else {
        objectUrl = URL.createObjectURL(file);
        bitmap = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = objectUrl;
        });
      }
      const maximum = 1440;
      const scale = Math.min(1, maximum / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [.82, .72, .62, .52]) {
        const result = canvas.toDataURL('image/jpeg', quality);
        if (result.length <= 480000) return result;
      }
      throw new Error('A foto ficou grande demais mesmo depois da otimização.');
    } finally {
      bitmap?.close?.();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  async function publishIfRequested(post) {
    if (post.visibility !== 'public') return post;
    if (!profile()?.publicEnabled) throw new Error('Ative o Meu Diário BE antes de tornar esta publicação pública.');
    if (!window.BePublicProfile?.publishEntry) throw new Error('A publicação pública está temporariamente indisponível.');
    const result = await window.BePublicProfile.publishEntry({
      id: post.id,
      note: post.text,
      imageDataUrl: post.imageDataUrl,
      title: post.activity || post.title,
      type: post.postType,
      date: post.occurredAt,
      postType: post.postType,
      duration: post.duration,
      distance: post.distance,
      result: post.result,
      feeling: post.feeling,
      personalBest: post.personalBest,
      achievementTitle: post.title
    });
    return { ...post, publicStatus: result.postStatus || 'published' };
  }

  async function togglePostVisibility(postId, button) {
    const current = localPosts();
    const post = current.find(item => item.id === postId);
    if (!post) return;
    const status = byId('be-profile-presentation-status');
    if (post.visibility !== 'public' && profile()?.publicEnabled !== true) {
      if (status) status.textContent = 'Para publicar, ative primeiro o Meu DiÃ¡rio BE. Levamos vocÃª atÃ© essa opÃ§Ã£o.';
      byId('be-profile-public-access-action')?.click();
      return;
    }
    button.disabled = true;
    try {
      let updatedPost;
      if (post.visibility === 'public') {
        if (!window.BePublicProfile?.unpublishEntry) throw new Error('NÃ£o foi possÃ­vel alterar a privacidade agora.');
        await window.BePublicProfile.unpublishEntry(post.id);
        updatedPost = { ...post, visibility: 'private', publicStatus: '', updatedAt: new Date().toISOString() };
      } else updatedPost = await publishIfRequested({ ...post, visibility: 'public', updatedAt: new Date().toISOString() });
      if (!saveLocalPosts(current.map(item => item.id === post.id ? updatedPost : item))) throw new Error('NÃ£o foi possÃ­vel salvar a nova privacidade neste aparelho.');
      if (status) status.textContent = updatedPost.visibility === 'public'
        ? 'PublicaÃ§Ã£o enviada para o Meu DiÃ¡rio BE.'
        : 'PublicaÃ§Ã£o retirada da pÃ¡gina pÃºblica e mantida no seu Perfil Be.';
      renderAll();
    } catch (error) {
      if (status) status.textContent = error.message || 'NÃ£o foi possÃ­vel alterar a privacidade.';
    } finally { button.disabled = false; }
  }

  async function submitComposer(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = localPosts();
    const id = cleanText(form.get('clientId'), 100);
    const previous = current.find(post => post.id === id);
    let post = sanitizePost({
      id: id || undefined,
      postType: form.get('postType'),
      occurredAt: form.get('occurredAt'),
      activity: form.get('activity'),
      title: form.get('title'),
      duration: form.get('duration'),
      distance: form.get('distance'),
      result: form.get('result'),
      feeling: form.get('feeling'),
      text: form.get('text'),
      imageDataUrl: pendingPhoto,
      visibility: form.get('visibility'),
      personalBest: form.get('personalBest') === 'on',
      createdAt: previous?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const feedback = byId('be-public-compose-feedback');
    if (!post || post.text.length < 3) {
      feedback.textContent = 'Conte este momento esportivo em pelo menos uma frase.';
      byId('be-public-compose-text')?.focus();
      return;
    }
    const submit = byId('be-public-compose-submit');
    submit.disabled = true;
    submit.textContent = post.visibility === 'public' ? 'Publicando…' : 'Salvando…';
    try {
      if (post.visibility === 'public') post = await publishIfRequested(post);
      else if (previous?.visibility === 'public') await window.BePublicProfile?.unpublishEntry?.(previous.id);
      const updated = previous ? current.map(item => item.id === post.id ? post : item) : [post, ...current];
      if (!saveLocalPosts(updated)) throw new Error('Não foi possível salvar. Libere espaço neste aparelho e tente novamente.');
      closeComposer();
      visiblePosts = PAGE_SIZE;
      renderAll();
      selectTab('posts');
      byId('be-profile-panel-posts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      feedback.textContent = error.message || 'Não foi possível salvar agora.';
    } finally {
      submit.disabled = false;
      submit.textContent = previous ? 'Salvar alterações' : 'Salvar publicação';
    }
  }

  async function sharePost(post) {
    const user = profile();
    const publicLink = byId('be-public-profile-link');
    const status = byId('be-profile-presentation-status');
    const url = post.visibility === 'public' && publicLink && !publicLink.hidden ? new URL(publicLink.href, location.origin) : null;
    if (url) url.searchParams.set('publicacao', post.id);
    if (!window.BeShareCard) {
      if (status) status.textContent = 'O compartilhamento ainda está carregando. Tente novamente.';
      return;
    }
    window.BeShareCard.open({ post, profile: user, url: url?.href || '', onStatus: message => { if (status) status.textContent = message; } });
  }

  async function shareProfile() {
    const link = byId('be-public-profile-link');
    const status = byId('be-profile-presentation-status');
    if (!link || link.hidden || !link.href) {
      if (status) status.textContent = 'Ative o Meu Diário BE para criar um link público do seu Perfil Be.';
      byId('be-profile-public-access')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      return;
    }
    const data = { title: `${profile().name || 'Perfil Be'} | Meu Caminho Be`, text: 'Esta é minha história no esporte.', url: new URL(link.href, location.origin).href };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (error) { if (error?.name === 'AbortError') return; }
    }
    await navigator.clipboard?.writeText(data.url);
    if (status) status.textContent = 'Link público do Perfil Be copiado.';
  }

  function renderAll() {
    if (!byId('be-profile-presentation') || byId('be-profile-presentation').hidden) return;
    renderSummary();
    renderFeed();
  }

  document.querySelectorAll('[data-profile-tab]').forEach(button => {
    button.addEventListener('click', () => selectTab(button.dataset.profileTab));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const order = ['posts', 'evolution', 'achievements'];
      let index = order.indexOf(activeTab);
      if (event.key === 'ArrowRight') index = (index + 1) % order.length;
      if (event.key === 'ArrowLeft') index = (index + order.length - 1) % order.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = order.length - 1;
      selectTab(order[index], true);
    });
  });
  byId('be-profile-create-post')?.addEventListener('click', () => openComposer());
  byId('be-profile-share')?.addEventListener('click', shareProfile);
  byId('be-profile-load-more')?.addEventListener('click', () => { visiblePosts += PAGE_SIZE; renderFeed(); });
  byId('be-public-compose-type')?.addEventListener('change', event => fieldsForType(event.currentTarget.value));
  byId('be-public-compose-form')?.addEventListener('change', event => {
    if (event.target.matches('input[name="visibility"]')) renderVisibilityChoice();
  });
  byId('be-public-compose-text')?.addEventListener('input', event => setText('be-public-compose-count', event.currentTarget.value.length));
  byId('be-public-compose-photo')?.addEventListener('change', async event => {
    const feedback = byId('be-public-compose-feedback');
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    feedback.textContent = 'Otimizando a foto…';
    try {
      pendingPhoto = await resizePhoto(file);
      renderPhotoPreview();
      feedback.textContent = 'Foto pronta para publicar.';
    } catch (error) {
      pendingPhoto = '';
      renderPhotoPreview();
      feedback.textContent = error.message;
    } finally { event.currentTarget.value = ''; }
  });
  byId('be-public-compose-photo-remove')?.addEventListener('click', () => { pendingPhoto = ''; renderPhotoPreview(); });
  byId('be-public-compose-close')?.addEventListener('click', closeComposer);
  byId('be-public-compose-cancel')?.addEventListener('click', closeComposer);
  byId('be-public-compose-form')?.addEventListener('submit', submitComposer);
  byId('be-profile-feed')?.addEventListener('click', event => {
    const empty = event.target.closest('[data-profile-empty-action]');
    if (empty) { document.querySelector('[data-be-new-entry]')?.click(); return; }
    if (event.target.closest('[data-profile-open-diary]')) { window.falaBemOpenView?.('progresso'); return; }
    const visibility = event.target.closest('[data-profile-post-visibility]');
    if (visibility) { togglePostVisibility(visibility.dataset.profilePostVisibility, visibility); return; }
    const edit = event.target.closest('[data-profile-post-edit]');
    if (edit) { openComposer(localPosts().find(post => post.id === edit.dataset.profilePostEdit)); return; }
    const remove = event.target.closest('[data-profile-post-delete]');
    if (remove) {
      if (!window.confirm('Excluir este momento esportivo?')) return;
      const target = localPosts().find(post => post.id === remove.dataset.profilePostDelete);
      if (target?.visibility === 'public') window.BePublicProfile?.unpublishEntry?.(target.id).catch(() => {});
      saveLocalPosts(localPosts().filter(post => post.id !== remove.dataset.profilePostDelete));
      renderAll();
      return;
    }
    const share = event.target.closest('[data-profile-post-share]');
    if (share) {
      const post = allFeedPosts().find(item => item.id === share.dataset.profilePostShare);
      if (post) sharePost(post).catch(() => {});
    }
  });
  byId('be-profile-achievements-list')?.addEventListener('click', event => {
    if (event.target.closest('[data-profile-empty-action]')) document.querySelector('[data-be-new-entry]')?.click();
  });
  window.addEventListener('meuCaminhoBe:profile-updated', () => window.setTimeout(renderAll, 60));
  window.addEventListener('meuCaminhoBe:diary-changed', renderAll);
  window.addEventListener('meuCaminhoBe:diary-imported', renderAll);
  window.addEventListener('meuCaminhoBe:new-public-post', () => openComposer());
  window.addEventListener('meuCaminhoBe:edit-public-post', event => {
    const post = event.detail || {};
    openComposer({
      ...post,
      id: post.clientId || post.id,
      postType: post.postType || 'photo',
      title: post.title || '',
      occurredAt: post.occurredAt,
      visibility: 'public'
    });
  });
  window.addEventListener('storage', event => { if ([PROFILE_KEY, DIARY_KEY, POSTS_KEY].includes(event.key)) renderAll(); });
  window.addEventListener('popstate', () => window.setTimeout(renderAll, 80));
  document.querySelectorAll('[data-fb-view="perfil"]').forEach(control => control.addEventListener('click', () => window.setTimeout(renderAll, 120)));

  window.BeSportsProfile = Object.freeze({ render: renderAll, openComposer, metrics: activityMetrics, achievements });
  selectTab('posts');
  window.setTimeout(renderAll, 0);
})();
