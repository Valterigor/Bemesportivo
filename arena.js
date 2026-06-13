(function(){
  const storageKeys = {
    poll: 'arenaBemPollVoteBrasilMarrocosPlacar',
    quiz: 'arenaBemQuizAnswer'
  };
  const matchLiveConfig = {
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
    summaryUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary',
    refreshMs: 30000,
    fallback: {
      date: '2026-06-13',
      time: '19:00',
      home: 'Brasil',
      away: 'Marrocos',
      venue: 'New York New Jersey Stadium',
      homeScore: null,
      awayScore: null,
      status: '',
      statusDetail: ''
    }
  };

  let liveState = {
    pollVotes: {},
    quizAnswers: {},
    comments: [],
    totals: {poll:0, quiz:0, comments:0}
  };
  let apiReady = false;
  let arenaDataOverride = null;
  let workingApiBase = '';
  let matchLiveTimer = null;

  function apiBases(){
    const bases = [''];
    if(['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '3100'){
      bases.push('http://127.0.0.1:3100');
    }
    return workingApiBase ? [workingApiBase, ...bases.filter(base => base !== workingApiBase)] : bases;
  }

  function getData(){
    if(arenaDataOverride) return arenaDataOverride;
    if(window.BemAiAgent) return window.BemAiAgent.toArenaData();
    return window.arenaBemData;
  }

  function escapeHtml(value){
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#039;'
    }[char]));
  }

  function getPercent(value, total){
    if(!total) return 0;
    return Math.round((value / total) * 100);
  }

  function cleanText(value){
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatTime(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return 'agora';
    return new Intl.DateTimeFormat('pt-BR', {
      day:'2-digit',
      month:'2-digit',
      hour:'2-digit',
      minute:'2-digit'
    }).format(date);
  }

  function getDateInSaoPaulo(date){
    return new Intl.DateTimeFormat('en-CA', {
      timeZone:'America/Sao_Paulo',
      year:'numeric',
      month:'2-digit',
      day:'2-digit'
    }).format(date);
  }

  function getTimeInSaoPaulo(date){
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone:'America/Sao_Paulo',
      hour:'2-digit',
      minute:'2-digit',
      hour12:false
    }).format(date);
  }

  function formatMatchDateTime(match){
    const isoDate = match?.isoDate || `${match?.date || matchLiveConfig.fallback.date}T${match?.time || matchLiveConfig.fallback.time}:00-03:00`;
    const date = new Date(isoDate);
    if(Number.isNaN(date.getTime())) return '13/06 - 19:00';
    const day = new Intl.DateTimeFormat('pt-BR', {
      day:'2-digit',
      month:'2-digit'
    }).format(date);
    return `${day} - ${getTimeInSaoPaulo(date)}`;
  }

  function getTeamKey(name){
    return cleanText(name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function translateTeamName(name){
    const map = {
      'Brazil':'Brasil',
      'Morocco':'Marrocos'
    };
    return map[name] || name;
  }

  function buildScoreboardUrl(date){
    const dateKey = getDateInSaoPaulo(date).replace(/-/g, '');
    return `${matchLiveConfig.scoreboardUrl}?dates=${dateKey}&limit=100`;
  }

  function getMatchDateTime(match){
    const isoDate = match?.isoDate || `${match?.date || matchLiveConfig.fallback.date}T${match?.time || matchLiveConfig.fallback.time}:00-03:00`;
    const date = new Date(isoDate);
    return Number.isNaN(date.getTime()) ? new Date(`${matchLiveConfig.fallback.date}T${matchLiveConfig.fallback.time}:00-03:00`) : date;
  }

  function getMatchStatus(match){
    if(match?.status) return match.status;

    const now = new Date();
    const matchDate = getMatchDateTime(match);
    const matchEnd = new Date(matchDate.getTime() + 130 * 60 * 1000);
    if(now >= matchDate && now <= matchEnd) return 'AO VIVO';
    if(getDateInSaoPaulo(now) === getDateInSaoPaulo(matchDate)){
      return now < matchDate ? 'HOJE' : 'ENCERRADO';
    }
    return matchDate > now ? 'AGENDADO' : 'ENCERRADO';
  }

  async function fetchExternalJson(url){
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);
    try{
      const response = await fetch(url, {signal:controller.signal, cache:'no-store'});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    }finally{
      window.clearTimeout(timeoutId);
    }
  }

  function normalizeEspnEvent(event){
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors || [];
    const home = competitors.find(item => item.homeAway === 'home') || competitors[0];
    const away = competitors.find(item => item.homeAway === 'away') || competitors[1];
    const eventDate = new Date(competition?.date || event.date);
    const statusType = competition?.status?.type || event.status?.type || {};
    const isLive = statusType.state === 'in';
    const isCompleted = Boolean(statusType.completed) || statusType.state === 'post';
    const hasOfficialScore = isLive || isCompleted;
    const homeScore = hasOfficialScore && home?.score !== undefined && home?.score !== '' ? Number(home.score) : null;
    const awayScore = hasOfficialScore && away?.score !== undefined && away?.score !== '' ? Number(away.score) : null;

    return {
      date:getDateInSaoPaulo(eventDate),
      time:getTimeInSaoPaulo(eventDate),
      isoDate:eventDate.toISOString(),
      home:translateTeamName(home?.team?.displayName || home?.team?.shortDisplayName || ''),
      away:translateTeamName(away?.team?.displayName || away?.team?.shortDisplayName || ''),
      homeScore:Number.isFinite(homeScore) ? homeScore : null,
      awayScore:Number.isFinite(awayScore) ? awayScore : null,
      status:isCompleted ? 'ENCERRADO' : isLive ? 'AO VIVO' : '',
      statusDetail:statusType.shortDetail || statusType.detail || '',
      liveClock:isLive ? (competition?.status?.displayClock || event.status?.displayClock || '') : '',
      period:isLive ? (competition?.status?.period || event.status?.period || '') : '',
      venue:competition?.venue?.fullName || event.venue?.fullName || '',
      espnEventId:event.id || competition?.id || ''
    };
  }

  function findBrazilMoroccoMatch(matches){
    return (Array.isArray(matches) ? matches : []).find(match => {
      if(match.date !== matchLiveConfig.fallback.date) return false;
      const teams = [getTeamKey(match.home), getTeamKey(match.away)];
      return teams.includes('brasil') && teams.includes('marrocos');
    });
  }

  function getBrazilMoroccoScore(match){
    const sides = [
      {key:getTeamKey(match?.home), score:match?.homeScore},
      {key:getTeamKey(match?.away), score:match?.awayScore}
    ];
    return {
      brazil:sides.find(side => side.key === 'brasil')?.score ?? null,
      morocco:sides.find(side => side.key === 'marrocos')?.score ?? null
    };
  }

  function extractMatchPlays(summary){
    const rawPlays = [
      ...(Array.isArray(summary?.commentary) ? summary.commentary : []),
      ...(Array.isArray(summary?.plays) ? summary.plays : [])
    ];

    return rawPlays
      .map(item => ({
        minute: cleanText(item.displayTime || item.time?.displayValue || item.clock?.displayValue || item.clock || item.minute || 'Lance'),
        text: cleanText(item.text || item.shortText || item.description || item.headline || item.type?.text || '')
      }))
      .filter(item => item.text)
      .slice(0, 5);
  }

  function setStatus(text, offline){
    const status = document.getElementById('arenaLiveStatus');
    if(!status) return;
    status.textContent = text;
    status.classList.toggle('is-offline', Boolean(offline));
  }

  function setCommentFeedback(text, type){
    const feedback = document.getElementById('arenaCommentFeedback');
    if(!feedback) return;
    feedback.textContent = text || '';
    feedback.classList.toggle('is-error', type === 'error');
    feedback.classList.toggle('is-success', type === 'success');
  }

  function updateLiveCounters(){
    const votes = document.getElementById('arenaLiveVotes');
    const answers = document.getElementById('arenaLiveAnswers');
    const comments = document.getElementById('arenaLiveComments');
    const data = getData();
    const baseVotes = data?.poll?.options?.reduce((sum, option) => sum + (Number(option.votes) || 0), 0) || 0;
    if(votes) votes.textContent = baseVotes + (liveState.totals?.poll || 0);
    if(answers) answers.textContent = liveState.totals?.quiz || 0;
    if(comments) comments.textContent = liveState.totals?.comments || 0;
  }

  async function api(path, options = {}){
    let lastError;
    for(const base of apiBases()){
      try{
        const fetchOptions = {
          ...options,
          headers: options.body ? {'Content-Type':'application/json', ...(options.headers || {})} : (options.headers || {})
        };
        const response = await fetch(`${base}${path}`, fetchOptions);
        const contentType = response.headers.get('content-type') || '';
        if(!contentType.includes('application/json')){
          throw new Error('API da Arena indisponível');
        }
        const payload = await response.json();
        if(!response.ok) throw new Error(payload.error || 'Falha na Arena');
        workingApiBase = base;
        return payload;
      }catch(error){
        lastError = error;
      }
    }
    throw lastError || new Error('API da Arena indisponível');
  }

  function eventSourceUrl(path){
    return `${workingApiBase || ''}${path}`;
  }

  function applyState(nextState){
    liveState = {
      pollVotes: nextState.pollVotes || {},
      quizAnswers: nextState.quizAnswers || {},
      comments: Array.isArray(nextState.comments) ? nextState.comments : [],
      totals: nextState.totals || {poll:0, quiz:0, comments:0}
    };
    apiReady = true;
    updateLiveCounters();
    renderPoll();
    renderQuiz();
    renderComments();
  }

  function applyArenaContent(content){
    if(!content?.poll || !content?.quiz || !content?.hotTopic) return;
    arenaDataOverride = content;
    renderPoll();
    renderQuiz();
    renderHotTopic();
    updateLiveCounters();
  }

  function setupArenaContent(){
    api('/api/arena/content')
      .then(applyArenaContent)
      .catch(() => {});
  }

  function renderPoll(){
    const data = getData();
    const root = document.getElementById('arenaPoll');
    if(!root || !data?.poll) return;

    const savedVote = apiReady ? localStorage.getItem(storageKeys.poll) : '';
    const totalVotes = data.poll.options.reduce((sum, option) => {
      const remoteVotes = Number(liveState.pollVotes[option.id]) || 0;
      return sum + option.votes + remoteVotes;
    }, 0);

    root.innerHTML = `
      <div class="arena-card-head">
        <span>Enquete</span>
        <strong>${escapeHtml(data.poll.title)}</strong>
      </div>
      <h2>${escapeHtml(data.poll.question)}</h2>
      <div class="arena-poll-options">
        ${data.poll.options.map(option => {
          const remoteVotes = Number(liveState.pollVotes[option.id]) || 0;
          const votes = option.votes + remoteVotes;
          const percent = getPercent(votes, totalVotes);
          return `
            <button class="arena-choice ${savedVote === option.id ? 'is-selected' : ''}" data-poll-option="${escapeHtml(option.id)}" ${savedVote ? 'disabled' : ''}>
              <span>${escapeHtml(option.label)}</span>
              <strong>${percent}%</strong>
              <i style="width:${percent}%"></i>
            </button>
          `;
        }).join('')}
      </div>
      <p class="arena-muted">${savedVote ? 'Voto registrado neste dispositivo.' : 'Vote para ver o clima da torcida.'}</p>
    `;

    root.querySelectorAll('[data-poll-option]').forEach(button => {
      button.addEventListener('click', async () => {
        const optionId = button.dataset.pollOption;
        root.querySelectorAll('[data-poll-option]').forEach(item => { item.disabled = true; });
        setStatus('Salvando voto...');
        try{
          applyState(await api('/api/arena/poll', {
            method:'POST',
            body:JSON.stringify({optionId})
          }));
          localStorage.setItem(storageKeys.poll, optionId);
          renderPoll();
          setStatus('Ao vivo');
        }catch(error){
          renderPoll();
          setStatus('Servidor offline', true);
        }
      });
    });
  }

  function renderQuiz(){
    const data = getData();
    const root = document.getElementById('arenaQuiz');
    if(!root || !data?.quiz) return;

    const savedAnswer = apiReady ? localStorage.getItem(storageKeys.quiz) : '';
    const hasAnswer = Boolean(savedAnswer);
    const correct = savedAnswer === data.quiz.correctOptionId;

    root.innerHTML = `
      <div class="arena-card-head">
        <span>Quiz</span>
        <strong>${escapeHtml(data.quiz.title)}</strong>
      </div>
      <h2>${escapeHtml(data.quiz.question)}</h2>
      <div class="arena-quiz-options">
        ${data.quiz.options.map(option => {
          const isCorrect = option.id === data.quiz.correctOptionId;
          const isSelected = savedAnswer === option.id;
          const state = hasAnswer && isCorrect ? 'is-correct' : hasAnswer && isSelected ? 'is-wrong' : '';
          return `<button class="arena-quiz-option ${state}" data-quiz-option="${escapeHtml(option.id)}" ${hasAnswer ? 'disabled' : ''}>${escapeHtml(option.label)}</button>`;
        }).join('')}
      </div>
      <p class="arena-feedback ${hasAnswer ? 'show' : ''}">
        ${hasAnswer ? `${correct ? 'Acertou!' : 'Quase.'} ${escapeHtml(data.quiz.explanation)}` : 'Responda para destravar o resultado.'}
      </p>
    `;

    root.querySelectorAll('[data-quiz-option]').forEach(button => {
      button.addEventListener('click', async () => {
        const optionId = button.dataset.quizOption;
        root.querySelectorAll('[data-quiz-option]').forEach(item => { item.disabled = true; });
        setStatus('Salvando resposta...');
        try{
          applyState(await api('/api/arena/quiz', {
            method:'POST',
            body:JSON.stringify({optionId})
          }));
          localStorage.setItem(storageKeys.quiz, optionId);
          renderQuiz();
          setStatus('Ao vivo');
        }catch(error){
          renderQuiz();
          setStatus('Servidor offline', true);
        }
      });
    });
  }

  function renderLiveMatch(match = matchLiveConfig.fallback, plays = [], sourceLabel = ''){
    const root = document.getElementById('arenaLiveMatch');
    if(!root) return;

    const status = getMatchStatus(match);
    const score = getBrazilMoroccoScore(match);
    const hasScore = score.brazil != null && score.morocco != null;
    const clock = match?.liveClock
      ? `${match.liveClock}${match.period ? ` - ${String(match.period)}T` : ''}`
      : formatMatchDateTime(match);
    const statusClass = status === 'AO VIVO' ? 'is-live' : '';
    const summary = status === 'AO VIVO'
      ? 'Tempo real ligado: acompanhe o cronômetro, o placar e os principais lances de Brasil x Marrocos.'
      : status === 'ENCERRADO'
        ? 'Jogo encerrado: placar final e lances principais ficam registrados na Arena.'
        : 'Pré-jogo: o placar, o tempo de jogo e os lances entram aqui assim que a transmissão liberar os dados.';
    const fallbackPlay = status === 'AO VIVO'
      ? 'Aguardando novos lances da transmissão.'
      : status === 'ENCERRADO'
        ? 'A partida foi encerrada. O resumo aparece quando a fonte disponibilizar os lances.'
        : 'Os lances aparecem aqui quando a partida começar.';

    root.innerHTML = `
      <div class="arena-card-head">
        <span>Placar ao vivo</span>
        <strong>${escapeHtml(sourceLabel || 'Brasil x Marrocos')}</strong>
      </div>
      <div class="arena-match-board">
        <div>
          <div class="arena-match-top">
            <span class="arena-match-status ${statusClass}">${escapeHtml(status)}</span>
            <span class="arena-match-clock">${escapeHtml(clock)}</span>
          </div>
          <div class="arena-match-score" aria-label="Placar Brasil contra Marrocos">
            <div class="arena-match-team">
              <span>Seleção</span>
              <strong>Brasil</strong>
            </div>
            <div class="arena-match-numbers">
              <span>${hasScore ? escapeHtml(score.brazil) : '--'}</span>
              <small>x</small>
              <span>${hasScore ? escapeHtml(score.morocco) : '--'}</span>
            </div>
            <div class="arena-match-team">
              <span>Adversário</span>
              <strong>Marrocos</strong>
            </div>
          </div>
          <p class="arena-match-summary">${escapeHtml(summary)}</p>
        </div>
        <ul class="arena-match-plays">
          ${plays.length
            ? plays.map(play => `<li><time>${escapeHtml(play.minute)}</time><span>${escapeHtml(play.text)}</span></li>`).join('')
            : `<li><time>Info</time><span>${escapeHtml(fallbackPlay)}</span></li>`}
        </ul>
      </div>
    `;
  }

  async function fetchLiveMatch(){
    const scoreboardDates = [
      new Date(`${matchLiveConfig.fallback.date}T12:00:00-03:00`),
      new Date()
    ];
    const payloads = await Promise.allSettled(
      scoreboardDates.map(date => fetchExternalJson(buildScoreboardUrl(date)))
    );
    const matches = payloads
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value?.events || [])
      .map(normalizeEspnEvent)
      .filter(match => match.home && match.away);

    return findBrazilMoroccoMatch(matches) || matchLiveConfig.fallback;
  }

  async function fetchLiveMatchPlays(match){
    if(!match?.espnEventId) return [];
    const status = getMatchStatus(match);
    if(status !== 'AO VIVO' && status !== 'ENCERRADO') return [];

    const summary = await fetchExternalJson(`${matchLiveConfig.summaryUrl}?event=${encodeURIComponent(match.espnEventId)}`);
    return extractMatchPlays(summary);
  }

  async function updateLiveMatch(){
    const root = document.getElementById('arenaLiveMatch');
    if(root && !root.innerHTML.trim()){
      renderLiveMatch(matchLiveConfig.fallback, [], 'Carregando');
    }
    try{
      const match = await fetchLiveMatch();
      renderLiveMatch(match, [], 'ESPN ao vivo');
      const plays = await fetchLiveMatchPlays(match);
      renderLiveMatch(match, plays, 'ESPN ao vivo');
    }catch(error){
      renderLiveMatch(matchLiveConfig.fallback, [], 'Tempo real indisponível');
    }
  }

  function setupLiveMatch(){
    updateLiveMatch();
    window.clearInterval(matchLiveTimer);
    matchLiveTimer = window.setInterval(updateLiveMatch, matchLiveConfig.refreshMs);
  }

  function renderHotTopic(){
    const data = getData();
    const root = document.getElementById('arenaHotTopic');
    if(!root || !data?.hotTopic) return;

    root.innerHTML = `
      <div class="arena-card-head">
        <span>${escapeHtml(data.hotTopic.tag)}</span>
        <strong>${escapeHtml(data.hotTopic.title)}</strong>
      </div>
      <h2>${escapeHtml(data.hotTopic.headline)}</h2>
      <p>${escapeHtml(data.hotTopic.summary)}</p>
      <div class="arena-prompts">
        ${data.hotTopic.prompts.map(prompt => `<span>${escapeHtml(prompt)}</span>`).join('')}
      </div>
    `;
  }

  function renderComments(){
    const list = document.getElementById('arenaCommentsList');
    if(!list) return;

    if(!liveState.comments.length){
      list.innerHTML = '<span class="arena-empty">Seja o primeiro a comentar na Arena.</span>';
      return;
    }

    list.innerHTML = liveState.comments.map(comment => `
      <article class="arena-comment">
        <strong>${escapeHtml(comment.name || 'Visitante')}</strong>
        <p>${escapeHtml(comment.text)}</p>
        <time>${escapeHtml(formatTime(comment.createdAt))}</time>
      </article>
    `).join('');
  }

  function setupCommentForm(){
    const form = document.getElementById('arenaCommentForm');
    if(!form) return;

    const textEl = document.getElementById('arenaCommentText');
    const counter = document.getElementById('arenaCommentCount');
    const updateCounter = () => {
      if(!textEl || !counter) return;
      const current = textEl.value.length;
      const max = Number(textEl.getAttribute('maxlength')) || 500;
      counter.textContent = `${current}/${max}`;
      counter.classList.toggle('is-near-limit', current >= max * .9);
    };

    textEl?.addEventListener('input', updateCounter);
    updateCounter();

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button');
      const name = document.getElementById('arenaCommentName')?.value || '';
      const text = textEl?.value || '';
      if(text.trim().length < 3){
        setCommentFeedback('Escreva pelo menos 3 caracteres antes de enviar.', 'error');
        textEl?.focus();
        return;
      }

      if(button) button.disabled = true;
      setCommentFeedback('Enviando comentário...', '');
      try{
        applyState(await api('/api/arena/comments', {
          method:'POST',
          body:JSON.stringify({name, text})
        }));
        form.reset();
        updateCounter();
        setStatus('Ao vivo');
        setCommentFeedback('Comentário publicado na Arena.', 'success');
      }catch(error){
        updateCounter();
        setStatus('Servidor offline', true);
        setCommentFeedback('Não foi possível salvar agora. Tente novamente em instantes.', 'error');
      }finally{
        if(button) button.disabled = false;
      }
    });
  }

  function setupLiveUpdates(){
    api('/api/arena/state')
      .then(state => {
        applyState(state);
        setStatus('Ao vivo');
      })
      .catch(() => {
        apiReady = false;
        updateLiveCounters();
        renderPoll();
        renderQuiz();
        renderComments();
        setStatus('Servidor offline', true);
      });

    if(!window.EventSource) return;
    const source = new EventSource(eventSourceUrl('/api/arena/events'));
    source.addEventListener('arena-state', event => {
      applyState(JSON.parse(event.data));
      setStatus('Ao vivo');
    });
    source.addEventListener('error', () => {
      if(!apiReady) setStatus('Servidor offline', true);
    });
  }

  function setupMoreMenu(){
    const toggle = document.getElementById('arenaMoreToggle');
    const menu = document.getElementById('arenaMoreMenu');
    if(!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('show');
      toggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', event => {
      if(menu.contains(event.target) || toggle.contains(event.target)) return;
      menu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', event => {
      if(event.key !== 'Escape') return;
      menu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderLiveMatch();
    renderPoll();
    renderQuiz();
    renderHotTopic();
    renderComments();
    setupLiveMatch();
    setupArenaContent();
    setupCommentForm();
    setupMoreMenu();
    setupLiveUpdates();
  });

  window.addEventListener('bemAiSuggestionsUpdated', () => {
    renderPoll();
    renderQuiz();
    renderHotTopic();
  });
})();
