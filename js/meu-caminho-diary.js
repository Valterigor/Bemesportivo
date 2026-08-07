(() => {
  'use strict';

  const STORAGE_KEY = 'meuCaminhoBeDiaryV1';
  const MEALS_STORAGE_KEY = 'meuCaminhoBeMealsV1';
  const PROFILE_KEY = 'meuCaminhoBeProfileV1';
  const types = {
    corrida: { label: 'Corrida', icon: '🏃' },
    treino: { label: 'Treino', icon: '🏋️' },
    jogo: { label: 'Jogo', icon: '🏐' },
    caminhada: { label: 'Caminhada', icon: '🚶' },
    ciclismo: { label: 'Ciclismo', icon: '🚲' },
    natacao: { label: 'Natação', icon: '🏊' },
    outro: { label: 'Outro esporte', icon: '＋' }
  };
  const feelingIcons = { 1: '😣', 2: '😕', 3: '🙂', 4: '😄', 5: '🔥' };
  const mealTypes = {
    breakfast: { label: 'Café da manhã', icon: '☕', single: true },
    snack: { label: 'Lanche extra', icon: '🍎', single: false },
    lunch: { label: 'Almoço', icon: '🍽️', single: true },
    dinner: { label: 'Jantar', icon: '🌙', single: true }
  };
  const legacyTypes = {
    caminhada: 'caminhada', corrida: 'corrida', musculacao: 'treino', funcional: 'treino',
    futebol: 'jogo', ciclismo: 'ciclismo', natacao: 'natacao', outra: 'outro'
  };
  let entries = [];
  let meals = [];

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const dayKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const dateFromKey = key => new Date(`${key}T12:00:00`);
  const round = value => Math.round(Number(value) * 100) / 100;
  const formatNumber = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
  const formatDuration = minutes => {
    const total = Math.max(0, Number(minutes) || 0);
    if (total < 60) return `${total} min`;
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  };
  const titleFor = entry => entry.title || types[entry.type]?.label || types.outro.label;

  function sanitize(entry) {
    if (!entry || typeof entry !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || ''))) return null;
    const type = types[entry.type] ? entry.type : 'outro';
    const rawDuration = Math.round(Number(entry.duration));
    if (!Number.isFinite(rawDuration) || rawDuration < 1) return null;
    const duration = Math.min(1440, rawDuration);
    const distanceValue = Number(entry.distance);
    return {
      id: String(entry.id || `be-${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0, 80),
      date: String(entry.date),
      type,
      title: String(entry.title || '').trim().slice(0, 60),
      duration,
      distance: Number.isFinite(distanceValue) && distanceValue > 0 ? round(Math.min(distanceValue, 10000)) : null,
      result: String(entry.result || '').trim().slice(0, 60),
      feeling: ['1', '2', '3', '4', '5'].includes(String(entry.feeling)) ? String(entry.feeling) : '3',
      note: String(entry.note || '').trim().slice(0, 280),
      createdAt: String(entry.createdAt || new Date().toISOString()).slice(0, 40),
      updatedAt: String(entry.updatedAt || new Date().toISOString()).slice(0, 40)
    };
  }

  function migrateLegacy() {
    let profile = null;
    try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch {}
    if (!Array.isArray(profile?.dailyLogs)) return [];
    return profile.dailyLogs.filter(log => log?.activity && log.activity !== 'none' && Number(log.minutes) > 0).map(log => sanitize({
      id: `legacy-${log.date}`,
      date: log.date,
      type: legacyTypes[log.activity] || 'outro',
      title: log.activity === 'musculacao' ? 'Musculação' : log.activity === 'funcional' ? 'Treino funcional' : '',
      duration: log.minutes,
      feeling: log.feeling || '3',
      note: log.note || '',
      createdAt: log.updatedAt,
      updatedAt: log.updatedAt
    })).filter(Boolean);
  }

  function readEntries() {
    let stored = [];
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      stored = Array.isArray(value) ? value.map(sanitize).filter(Boolean) : [];
    } catch {}
    const ids = new Set(stored.map(entry => entry.id));
    migrateLegacy().forEach(entry => { if (!ids.has(entry.id)) stored.push(entry); });
    return stored.sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`)).slice(0, 3000);
  }

  function saveEntries() {
    entries.sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 3000)));
    } catch {
      return false;
    }
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:diary-changed', { detail: { count: entries.length } }));
    renderAll();
    return true;
  }

  function sanitizeMeal(record) {
    if (!record || typeof record !== 'object' || !mealTypes[record.type] || !/^\d{4}-\d{2}-\d{2}$/.test(String(record.date || ''))) return null;
    return {
      id: String(record.id || `meal-${Date.now()}-${Math.random().toString(16).slice(2)}`).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80),
      type: record.type,
      date: String(record.date),
      description: String(record.description || '').trim().slice(0, 240),
      createdAt: String(record.createdAt || new Date().toISOString()).slice(0, 40)
    };
  }

  function readMeals() {
    try {
      const value = JSON.parse(localStorage.getItem(MEALS_STORAGE_KEY) || '[]');
      if (!Array.isArray(value)) return [];
      const seen = new Set();
      return value.map(sanitizeMeal).filter(Boolean).filter(meal => {
        if (!mealTypes[meal.type].single) return true;
        const key = `${meal.date}:${meal.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(-1200);
    } catch {
      return [];
    }
  }

  function saveMeals() {
    try {
      localStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(meals.slice(-1200)));
    } catch {
      return false;
    }
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:meals-changed', { detail: { count: meals.length } }));
    renderMeals();
    return true;
  }

  function parseQuickText(raw) {
    const text = String(raw || '').trim();
    const normalized = text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const aliases = [
      ['natacao', /\b(nadei|natacao|natacao)\b/], ['ciclismo', /\b(pedalei|bike|bicicleta|ciclismo)\b/],
      ['caminhada', /\b(caminhei|caminhada|andei)\b/], ['corrida', /\b(corri|corrida|running)\b/],
      ['treino', /\b(academia|musculacao|treinei|treino|funcional|crossfit)\b/],
      ['jogo', /\b(joguei|jogo|futebol|futsal|volei|volei|tenis|beach tennis|beaty tennis|basquete|padel)\b/]
    ];
    const type = aliases.find(([, pattern]) => pattern.test(normalized))?.[0] || 'outro';
    const hours = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hora|horas)\b/);
    const mins = normalized.match(/(\d+)\s*(?:min|minuto|minutos)\b/);
    const distance = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:km|quilometro|quilometros)\b/);
    const duration = Math.round((hours ? Number(hours[1].replace(',', '.')) * 60 : 0) + (mins ? Number(mins[1]) : 0));
    let title = '';
    if (/beach tennis|beaty tennis/.test(normalized)) title = 'Beach tennis';
    else if (/academia|musculacao/.test(normalized)) title = 'Treino na academia';
    else if (/futebol|futsal|volei|volei|tenis|basquete|padel/.test(normalized)) {
      const sport = normalized.match(/futebol|futsal|volei|volei|tenis|basquete|padel/)?.[0] || '';
      title = sport.charAt(0).toUpperCase() + sport.slice(1);
    }
    return {
      text, type, title, duration,
      distance: distance ? Number(distance[1].replace(',', '.')) : null
    };
  }

  function openEntry(seed = {}) {
    const dialog = $('#be-entry-dialog');
    const form = $('#be-entry-form');
    if (!dialog || !form) return;
    form.reset();
    const entry = seed.id ? entries.find(item => item.id === seed.id) : null;
    const values = entry || seed;
    $('#be-entry-id').value = values.id || '';
    $('#be-entry-date').value = values.date || dayKey();
    $('#be-entry-type').value = types[values.type] ? values.type : 'corrida';
    $('#be-entry-title').value = values.title || '';
    $('#be-entry-duration').value = values.duration || '';
    $('#be-entry-distance').value = values.distance || '';
    $('#be-entry-result').value = values.result || '';
    $('#be-entry-note').value = values.note || '';
    const feeling = form.querySelector(`input[name="feeling"][value="${values.feeling || '3'}"]`);
    if (feeling) feeling.checked = true;
    $('#be-entry-delete').hidden = !entry;
    $('#be-entry-feedback').textContent = '';
    $('#be-entry-dialog-title').textContent = entry ? 'Editar atividade' : 'Registrar atividade';
    dialog.showModal();
    setTimeout(() => (values.duration ? $('#be-entry-title') : $('#be-entry-duration'))?.focus(), 60);
  }

  function closeEntry() {
    $('#be-entry-dialog')?.close();
  }

  function metrics(source = entries) {
    const totalMinutes = source.reduce((sum, entry) => sum + entry.duration, 0);
    const totalDistance = round(source.reduce((sum, entry) => sum + (entry.distance || 0), 0));
    const dates = [...new Set(source.map(entry => entry.date))].sort();
    let bestStreak = dates.length ? 1 : 0;
    let current = dates.length ? 1 : 0;
    for (let index = 1; index < dates.length; index += 1) {
      const before = dateFromKey(dates[index - 1]);
      const after = dateFromKey(dates[index]);
      const difference = Math.round((after - before) / 86400000);
      current = difference === 1 ? current + 1 : 1;
      bestStreak = Math.max(bestStreak, current);
    }
    const counts = source.reduce((map, entry) => ({ ...map, [entry.type]: (map[entry.type] || 0) + 1 }), {});
    const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    return { totalMinutes, totalDistance, bestStreak, dates, favorite };
  }

  function contextualFeedback(entry, wasNew) {
    const previous = entries.filter(item => item.id !== entry.id && item.type === entry.type);
    const priorDistance = Math.max(0, ...previous.map(item => item.distance || 0));
    const sameWeek = entries.filter(item => {
      const difference = (dateFromKey(entry.date) - dateFromKey(item.date)) / 86400000;
      return difference >= 0 && difference < 7;
    }).length;
    const previousEntry = entries
      .filter(item => item.id !== entry.id && item.date <= entry.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const gapDays = previousEntry ? Math.round((dateFromKey(entry.date) - dateFromKey(previousEntry.date)) / 86400000) : 0;
    let interaction = 'activity_saved';
    const context = {
      activityLabel: titleFor(entry), duration: entry.duration, gapDays, weekCount: sameWeek,
      milestone: entry.distance ? `${formatNumber(entry.distance)} km em ${types[entry.type].label.toLocaleLowerCase('pt-BR')}` : ''
    };
    if (!wasNew) interaction = 'activity_updated';
    else if (entries.length === 1) interaction = 'first_activity';
    else if (entry.feeling === '1' || entry.feeling === '2') interaction = 'low_feeling_activity';
    else if (gapDays >= 14) interaction = 'return_after_pause';
    else if (entry.distance && entry.distance > priorDistance) interaction = 'personal_milestone';
    else if (sameWeek >= 3) interaction = 'consistent_week';
    const fallback = {
      title: wasNew ? 'Isso já faz parte da sua história.' : 'Seu registro foi atualizado.',
      message: wasNew
        ? `${titleFor(entry)} por ${formatDuration(entry.duration)}. Mais uma página real da sua história esportiva.`
        : 'Sua história continua organizada.'
    };
    return window.BeKnowledgeLibrary?.buildInteraction?.(interaction, context) || fallback;
  }

  function emitFeedback(interaction, options = {}) {
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:feedback', {
      detail: {
        type: interaction.tone === 'care' ? 'info' : 'success',
        title: interaction.title,
        message: interaction.message,
        detail: interaction.detail || '',
        ...options
      }
    }));
  }

  function entryCard(entry) {
    const details = [
      formatDuration(entry.duration),
      entry.distance ? `${formatNumber(entry.distance)} km` : '',
      entry.result
    ].filter(Boolean).join(' · ');
    return `<article class="be-entry-card"><span class="be-entry-icon" aria-hidden="true">${types[entry.type].icon}</span><div><h4>${escapeHtml(titleFor(entry))}</h4><p>${escapeHtml(details)}${entry.note ? ` · ${escapeHtml(entry.note)}` : ''}</p></div><span class="be-entry-feeling" aria-label="Como se sentiu: ${entry.feeling} de 5">${feelingIcons[entry.feeling]}</span><button type="button" data-be-edit="${escapeHtml(entry.id)}" aria-label="Editar ${escapeHtml(titleFor(entry))}">•••</button></article>`;
  }

  function emptyState(title, text, action = '') {
    return `<div class="be-empty-state"><span>📖</span><strong>${title}</strong><p>${text}</p>${action ? '<button type="button" data-be-new-entry>Fazer primeiro registro</button>' : ''}</div>`;
  }

  function renderToday() {
    const today = dayKey();
    const todayEntries = entries.filter(entry => entry.date === today);
    $('#be-today-count').textContent = String(todayEntries.length);
    $('#be-diary-date-label').textContent = `MEU CAMINHO BE · ${new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}`.toLocaleUpperCase('pt-BR');
    $('#be-today-list').innerHTML = todayEntries.length
      ? todayEntries.map(entryCard).join('')
      : emptyState('Seu dia começa aqui.', 'A primeira atividade registrada aparecerá nesta página.');
  }

  function renderMeals() {
    const list = $('#be-meals-list');
    const summary = $('#be-meals-summary');
    if (!list || !summary) return;
    const today = dayKey();
    const todayMeals = meals.filter(meal => meal.date === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    summary.textContent = todayMeals.length
      ? `${todayMeals.length} ${todayMeals.length === 1 ? 'registro incluído' : 'registros incluídos'} hoje.`
      : 'Nenhuma refeição incluída hoje.';
    list.innerHTML = todayMeals.length ? todayMeals.map(meal => {
      const type = mealTypes[meal.type];
      const created = new Date(meal.createdAt);
      const time = Number.isNaN(created.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(created);
      return `<article><span aria-hidden="true">${type.icon}</span><div><strong>${type.label}</strong><p>${escapeHtml(meal.description || 'Sem descrição')}</p><small>${time ? `Incluído às ${time}` : 'Incluído hoje'}</small></div><button type="button" data-be-meal-remove="${escapeHtml(meal.id)}" aria-label="Remover ${type.label}">×</button></article>`;
    }).join('') : '<div class="be-meals-empty"><span aria-hidden="true">＋</span><p>Use <strong>Incluir</strong> para registrar uma refeição.</p></div>';

    const used = new Set(todayMeals.map(meal => meal.type));
    $$('[data-be-meal]').forEach(button => {
      const unavailable = mealTypes[button.dataset.beMeal]?.single && used.has(button.dataset.beMeal);
      button.hidden = Boolean(unavailable);
      button.disabled = Boolean(unavailable);
    });
  }

  function openMealDialog() {
    renderMeals();
    $('#be-meal-feedback').textContent = '';
    $('#be-meal-detail-form')?.reset();
    $('#be-meal-detail-form').hidden = true;
    $('.be-meal-options').hidden = false;
    $('#be-meal-description-count').textContent = '0';
    $('#be-meal-dialog')?.showModal();
    window.setTimeout(() => $('#be-meal-dialog [data-be-meal]:not([hidden])')?.focus(), 40);
  }

  function selectMealType(type) {
    const definition = mealTypes[type];
    if (!definition) return;
    $('#be-meal-type').value = type;
    $('#be-meal-selected-icon').textContent = definition.icon;
    $('#be-meal-selected-label').textContent = definition.label;
    $('.be-meal-options').hidden = true;
    $('#be-meal-detail-form').hidden = false;
    $('#be-meal-feedback').textContent = '';
    window.setTimeout(() => $('#be-meal-description')?.focus(), 40);
  }

  function includeMeal(type, description) {
    const definition = mealTypes[type];
    if (!definition) return;
    const detail = String(description || '').trim();
    if (detail.length < 2) {
      $('#be-meal-feedback').textContent = 'Escreva o que você comeu antes de salvar.';
      $('#be-meal-description')?.focus();
      return;
    }
    const today = dayKey();
    if (definition.single && meals.some(meal => meal.date === today && meal.type === type)) {
      $('#be-meal-feedback').textContent = `${definition.label} já foi incluído hoje.`;
      renderMeals();
      return;
    }
    const record = sanitizeMeal({ type, description: detail, date: today, createdAt: new Date().toISOString() });
    if (!record) return;
    meals.push(record);
    if (!saveMeals()) {
      meals = meals.filter(meal => meal.id !== record.id);
      $('#be-meal-feedback').textContent = 'Não foi possível salvar neste aparelho. Libere espaço e tente novamente.';
      return;
    }
    $('#be-meal-dialog')?.close();
    const interaction = window.BeKnowledgeLibrary?.buildInteraction?.('meal_saved', { mealLabel: definition.label });
    if (interaction) emitFeedback(interaction);
  }

  function currentStreak() {
    const dates = new Set(entries.map(entry => entry.date));
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    if (!dates.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (dates.has(dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function renderDashboardOverview() {
    const greeting = $('#be-dashboard-greeting');
    if (!greeting) return;
    let profile = null;
    try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch {}
    const hour = new Date().getHours();
    const salutation = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const name = String(profile?.name || '').trim().split(/\s+/)[0];
    greeting.textContent = `${salutation}${name ? `, ${name}` : ''}!`;
    $('#be-dashboard-records').textContent = String(entries.length);
    const streak = currentStreak();
    $('#be-dashboard-streak').textContent = `${streak} ${streak === 1 ? 'dia' : 'dias'}`;

    const startedAt = profile?.identityCreatedAt || profile?.createdAt || entries.at(-1)?.date;
    if (startedAt) {
      const start = new Date(/^\d{4}-\d{2}-\d{2}$/.test(startedAt) ? `${startedAt}T12:00:00` : startedAt);
      const elapsedDays = Number.isNaN(start.getTime()) ? 0 : Math.max(0, Math.floor((new Date() - start) / 86400000));
      const months = Math.floor(elapsedDays / 30);
      $('#be-dashboard-since').textContent = months
        ? `Você registra sua jornada há ${months} ${months === 1 ? 'mês' : 'meses'}.`
        : 'Sua jornada esportiva está começando agora. Não existe começo pequeno.';
    } else {
      $('#be-dashboard-since').textContent = 'Seu caminho não precisa ser perfeito. Precisa fazer sentido para você.';
    }

    const goals = {
      comecar: ['Criar ritmo', 'Comece com uma atividade possível.'],
      saude: ['Cuidar de você', 'Movimento também é autocuidado.'],
      emagrecer: ['Criar hábitos', 'A constância vale mais que a pressa.'],
      performance: ['Evoluir', 'Observe seu ritmo e avance com método.'],
      modalidade: ['Descobrir', 'Experimente uma prática que combine com você.'],
      recuperacao: ['Voltar bem', 'Retome com calma e segurança.']
    };
    const goal = goals[profile?.objective] || ['Começar', 'Um passo possível hoje.'];
    $('#be-dashboard-goal').textContent = goal[0];
    $('#be-dashboard-goal-note').textContent = goal[1];
    const avatar = $('#be-dashboard-avatar');
    avatar.textContent = name ? name.slice(0, 2).toLocaleUpperCase('pt-BR') : 'BE';
    if (String(profile?.photoDataUrl || '').startsWith('data:image/')) {
      avatar.style.backgroundImage = `url("${profile.photoDataUrl}")`;
      avatar.style.backgroundPosition = 'center';
      avatar.style.backgroundSize = 'cover';
      avatar.textContent = '';
    } else {
      avatar.style.removeProperty('background-image');
    }
  }

  function renderDiaryFilters() {
    const periods = [...new Set(entries.map(entry => entry.date.slice(0, 7)))].sort().reverse();
    const sports = [...new Set(entries.map(entry => entry.type))].sort((a, b) => types[a].label.localeCompare(types[b].label, 'pt-BR'));
    const period = $('#be-diary-period');
    const sport = $('#be-diary-sport');
    const selectedPeriod = period.value;
    const selectedSport = sport.value;
    period.innerHTML = '<option value="all">Todo o histórico</option>' + periods.map(value => `<option value="${value}">${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(dateFromKey(`${value}-15`))}</option>`).join('');
    sport.innerHTML = '<option value="all">Todos os esportes</option>' + sports.map(value => `<option value="${value}">${types[value].label}</option>`).join('');
    if ([...period.options].some(option => option.value === selectedPeriod)) period.value = selectedPeriod;
    if ([...sport.options].some(option => option.value === selectedSport)) sport.value = selectedSport;
  }

  function renderDiary() {
    renderDiaryFilters();
    const selectedPeriod = $('#be-diary-period').value;
    const selectedSport = $('#be-diary-sport').value;
    const filtered = entries.filter(entry => (selectedPeriod === 'all' || entry.date.startsWith(selectedPeriod)) && (selectedSport === 'all' || entry.type === selectedSport));
    const timeline = $('#be-diary-timeline');
    if (!filtered.length) {
      timeline.innerHTML = emptyState(entries.length ? 'Nenhum registro neste filtro.' : 'Seu diário está pronto.', entries.length ? 'Escolha outro período ou esporte.' : 'Registre sua primeira atividade para começar sua história.', !entries.length);
      return;
    }
    const grouped = filtered.reduce((map, entry) => {
      const month = entry.date.slice(0, 7);
      if (!map[month]) map[month] = [];
      map[month].push(entry);
      return map;
    }, {});
    timeline.innerHTML = Object.entries(grouped).map(([month, monthEntries]) => {
      const monthDate = dateFromKey(`${month}-15`);
      const byDay = monthEntries.reduce((map, entry) => {
        if (!map[entry.date]) map[entry.date] = [];
        map[entry.date].push(entry);
        return map;
      }, {});
      return `<section class="be-month-group"><div class="be-month-label"><strong>${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(monthDate)}</strong><span>${monthDate.getFullYear()}</span></div><div class="be-month-entries">${Object.entries(byDay).map(([date, dayEntries]) => `<div class="be-day-label">${new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric' }).format(dateFromKey(date)).toLocaleUpperCase('pt-BR')}</div>${dayEntries.map(entryCard).join('')}`).join('')}</div></section>`;
    }).join('');
  }

  function evolutionEntries() {
    const value = $('#be-evolution-period')?.value || '28';
    if (value === 'all') return entries;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - Number(value) + 1);
    return entries.filter(entry => dateFromKey(entry.date) >= cutoff);
  }

  function renderEvolution() {
    const source = evolutionEntries();
    const data = metrics(source);
    $('#be-stat-activities').textContent = String(source.length);
    $('#be-stat-time').textContent = formatDuration(data.totalMinutes);
    $('#be-stat-distance').textContent = `${formatNumber(data.totalDistance)} km`;
    $('#be-stat-streak').textContent = `${data.bestStreak} ${data.bestStreak === 1 ? 'dia' : 'dias'}`;
    $('#be-stat-frequency').textContent = source.length ? `${data.dates.length} dias ativos` : 'Comece hoje';
    const recentFourteen = entries.filter(entry => (new Date() - dateFromKey(entry.date)) / 86400000 <= 14).length;
    const previousFourteen = entries.filter(entry => {
      const days = (new Date() - dateFromKey(entry.date)) / 86400000;
      return days > 14 && days <= 28;
    }).length;
    let insight = 'Seu primeiro registro vai revelar o começo da sua evolução.';
    let detail = 'A evolução aparece conforme você pratica e registra.';
    if (entries.length) {
      insight = `Você já escreveu ${entries.length} ${entries.length === 1 ? 'página' : 'páginas'} da sua história esportiva.`;
      detail = data.favorite ? `${types[data.favorite].label} é a prática que mais aparece no período.` : detail;
      if (recentFourteen > previousFourteen && previousFourteen > 0) detail = `Seu ritmo cresceu: ${recentFourteen} atividades nos últimos 14 dias, contra ${previousFourteen} no período anterior.`;
      if (recentFourteen === 0) detail = 'Seu diário mostra uma pausa recente. Quando voltar, registre até uma prática curta: ela também conta.';
    }
    $('#be-main-insight').textContent = insight;
    $('#be-main-insight-detail').textContent = detail;

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
      weeks.push({ label: offset ? `${offset}S` : 'Agora', count });
    }
    const maxWeek = Math.max(1, ...weeks.map(week => week.count));
    $('#be-week-chart').innerHTML = weeks.map(week => `<div class="be-week-bar" title="${week.count} atividades"><i style="height:${Math.max(3, week.count / maxWeek * 100)}%"></i><b>${week.count}</b><span>${week.label}</span></div>`).join('');

    const longestDuration = [...source].sort((a, b) => b.duration - a.duration)[0];
    const longestDistance = [...source].filter(entry => entry.distance).sort((a, b) => b.distance - a.distance)[0];
    $('#be-records-list').innerHTML = source.length ? [
      `<div class="be-record-row"><span>Maior duração</span><strong>${formatDuration(longestDuration.duration)}</strong></div>`,
      `<div class="be-record-row"><span>Maior distância</span><strong>${longestDistance ? `${formatNumber(longestDistance.distance)} km` : 'Ainda não registrada'}</strong></div>`,
      `<div class="be-record-row"><span>Prática mais frequente</span><strong>${data.favorite ? types[data.favorite].label : '—'}</strong></div>`
    ].join('') : '<p>Seus destaques aparecerão aqui.</p>';
    const weekdayCounts = source.reduce((counts, entry) => {
      const day = dateFromKey(entry.date).getDay();
      counts[day] = (counts[day] || 0) + 1;
      return counts;
    }, {});
    const topDay = Object.entries(weekdayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const positive = source.filter(entry => Number(entry.feeling) >= 4).length;
    const patterns = [];
    if (data.favorite) patterns.push(`${types[data.favorite].label} representa ${Math.round(source.filter(entry => entry.type === data.favorite).length / source.length * 100)}% das atividades do período.`);
    if (topDay !== undefined) patterns.push(`${new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date(2026, 7, 2 + Number(topDay)))} é o dia em que você mais costuma praticar.`);
    if (source.length >= 3) patterns.push(`${Math.round(positive / source.length * 100)}% dos registros tiveram sensação ótima ou incrível.`);
    $('#be-patterns-list').innerHTML = patterns.length ? patterns.map(pattern => `<li>${escapeHtml(pattern)}</li>`).join('') : '<li>Continue registrando para encontrar padrões reais no seu caminho.</li>';
  }

  function renderHistory() {
    const chronological = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const first = chronological[0];
    const data = metrics(entries);
    if (first) {
      $('#be-history-since').textContent = `Sua história começou em ${new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateFromKey(first.date))}`;
      $('#be-history-summary').textContent = `${entries.length} atividades, ${formatDuration(data.totalMinutes)} em movimento${data.totalDistance ? ` e ${formatNumber(data.totalDistance)} km registrados` : ''}.`;
    } else {
      $('#be-history-since').textContent = 'Uma história pronta para começar';
      $('#be-history-summary').textContent = 'Seu primeiro registro será o início desta linha do tempo.';
    }
    const milestones = [];
    if (first) milestones.push({ icon: '🏁', title: 'Primeiro registro', note: `${titleFor(first)} · ${new Intl.DateTimeFormat('pt-BR').format(dateFromKey(first.date))}` });
    if (entries.length >= 10) milestones.push({ icon: '🔟', title: '10 atividades', note: 'Um hábito começou a ganhar história.' });
    if (data.bestStreak >= 3) milestones.push({ icon: '🔥', title: `${data.bestStreak} dias seguidos`, note: 'Sua melhor sequência registrada.' });
    const distanceRecord = [...entries].filter(entry => entry.distance).sort((a, b) => b.distance - a.distance)[0];
    if (distanceRecord) milestones.push({ icon: '↗', title: `${formatNumber(distanceRecord.distance)} km`, note: `Maior distância em ${titleFor(distanceRecord)}.` });
    $('#be-milestones-list').innerHTML = milestones.length ? milestones.map(item => `<article class="be-milestone"><span>${item.icon}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note)}</small></article>`).join('') : emptyState('Seu primeiro marco está próximo.', 'Registre uma atividade para iniciar sua linha do tempo.');

    const years = chronological.reduce((map, entry) => {
      const year = entry.date.slice(0, 4);
      const month = entry.date.slice(0, 7);
      map[year] ||= {};
      map[year][month] ||= [];
      map[year][month].push(entry);
      return map;
    }, {});
    $('#be-history-timeline').innerHTML = Object.keys(years).length ? Object.entries(years).reverse().map(([year, months]) => `<section class="be-year-block"><strong>${year}</strong><div class="be-year-months">${Object.entries(months).reverse().map(([month, monthEntries]) => `<article class="be-history-month"><h4>${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(dateFromKey(`${month}-15`))}</h4><p>${monthEntries.length} ${monthEntries.length === 1 ? 'atividade' : 'atividades'} · ${formatDuration(monthEntries.reduce((sum, entry) => sum + entry.duration, 0))}${monthEntries.some(entry => entry.distance) ? ` · ${formatNumber(monthEntries.reduce((sum, entry) => sum + (entry.distance || 0), 0))} km` : ''}</p></article>`).join('')}</div></section>`).join('') : emptyState('Sua linha do tempo está vazia.', 'O que você fizer hoje pode ser o primeiro capítulo.');
  }

  function renderAll() {
    renderToday();
    renderMeals();
    renderDashboardOverview();
    renderDiary();
    renderEvolution();
    renderHistory();
  }

  $('#be-quick-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const parsed = parseQuickText($('#be-quick-text').value);
    if (!parsed.duration) {
      $('#be-quick-feedback').textContent = 'Só falta o tempo. Complete no formulário para registrar.';
      openEntry({ ...parsed, date: dayKey() });
      return;
    }
    const entry = sanitize({ ...parsed, date: dayKey(), feeling: '3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    entries.unshift(entry);
    if (!saveEntries()) {
      entries = entries.filter(item => item.id !== entry.id);
      $('#be-quick-feedback').textContent = 'Não foi possível salvar neste aparelho. Libere espaço e tente novamente.';
      return;
    }
    $('#be-quick-form').reset();
    $('#be-quick-feedback').textContent = '';
    const interaction = contextualFeedback(entry, true);
    emitFeedback(interaction);
  });

  $$('[data-be-activity]').forEach(button => button.addEventListener('click', () => openEntry({ type: button.dataset.beActivity, date: dayKey() })));
  $('#be-entry-close')?.addEventListener('click', closeEntry);
  $('#be-entry-cancel')?.addEventListener('click', closeEntry);
  $('#be-entry-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = String(form.get('id') || '');
    const previous = entries.find(entry => entry.id === id);
    const entry = sanitize({
      id: id || undefined, date: form.get('date'), type: form.get('type'), title: form.get('title'),
      duration: form.get('duration'), distance: form.get('distance'), result: form.get('result'),
      feeling: form.get('feeling'), note: form.get('note'),
      createdAt: previous?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    if (!entry) {
      $('#be-entry-feedback').textContent = 'Informe a atividade, a data e quanto tempo ela durou.';
      return;
    }
    const previousEntries = [...entries];
    entries = previous ? entries.map(item => item.id === entry.id ? entry : item) : [entry, ...entries];
    if (!saveEntries()) {
      entries = previousEntries;
      $('#be-entry-feedback').textContent = 'Não foi possível salvar neste aparelho. Libere espaço e tente novamente.';
      return;
    }
    closeEntry();
    const interaction = contextualFeedback(entry, !previous);
    emitFeedback(interaction);
  });
  $('#be-entry-delete')?.addEventListener('click', () => {
    const id = $('#be-entry-id').value;
    if (!id || !window.confirm('Excluir esta atividade do seu diário?')) return;
    const previousEntries = [...entries];
    entries = entries.filter(entry => entry.id !== id);
    if (!saveEntries()) {
      entries = previousEntries;
      $('#be-entry-feedback').textContent = 'Não foi possível excluir agora. Seus dados foram mantidos.';
      return;
    }
    closeEntry();
  });
  document.addEventListener('click', event => {
    const edit = event.target.closest('[data-be-edit]');
    if (edit) openEntry({ id: edit.dataset.beEdit });
    const create = event.target.closest('[data-be-new-entry]');
    if (create) openEntry({ date: dayKey(), type: 'corrida' });
    const mealChoice = event.target.closest('[data-be-meal]');
    if (mealChoice) selectMealType(mealChoice.dataset.beMeal);
    const removeMeal = event.target.closest('[data-be-meal-remove]');
    if (removeMeal && window.confirm('Remover este registro de alimentação?')) {
      const previousMeals = [...meals];
      meals = meals.filter(meal => meal.id !== removeMeal.dataset.beMealRemove);
      if (!saveMeals()) {
        meals = previousMeals;
        renderMeals();
        $('#be-meals-summary').textContent = 'Não foi possível remover agora. O registro foi mantido.';
      }
    }
  });
  $('#be-meal-add')?.addEventListener('click', openMealDialog);
  $('#be-meal-close')?.addEventListener('click', () => $('#be-meal-dialog')?.close());
  $('#be-meal-back')?.addEventListener('click', () => {
    $('#be-meal-detail-form').hidden = true;
    $('.be-meal-options').hidden = false;
    $('#be-meal-feedback').textContent = '';
    window.setTimeout(() => $('#be-meal-dialog [data-be-meal]:not([hidden])')?.focus(), 40);
  });
  $('#be-meal-description')?.addEventListener('input', event => {
    $('#be-meal-description-count').textContent = String(event.currentTarget.value.length);
  });
  $('#be-meal-detail-form')?.addEventListener('submit', event => {
    event.preventDefault();
    includeMeal(event.currentTarget.elements.type.value, event.currentTarget.elements.description.value);
  });
  $('#be-diary-period')?.addEventListener('change', renderDiary);
  $('#be-diary-sport')?.addEventListener('change', renderDiary);
  $('#be-evolution-period')?.addEventListener('change', renderEvolution);
  window.addEventListener('meuCaminhoBe:diary-imported', () => {
    entries = readEntries();
    renderAll();
  });
  window.addEventListener('meuCaminhoBe:meals-imported', () => {
    meals = readMeals();
    renderMeals();
  });
  window.addEventListener('meuCaminhoBe:reset', () => {
    meals = [];
    renderMeals();
  });
  window.addEventListener('meuCaminhoBe:profile-updated', renderDashboardOverview);
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      entries = readEntries();
      renderAll();
    }
    if (event.key === MEALS_STORAGE_KEY) {
      meals = readMeals();
      renderMeals();
    }
  });
  window.addEventListener('focus', renderMeals);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderMeals(); });

  entries = readEntries();
  meals = readMeals();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    localStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(meals));
  } catch {}
  renderAll();
})();
