(function(){
  const storageKeys = {
    poll: 'arenaBemPollVote',
    quiz: 'arenaBemQuizAnswer'
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
    renderPoll();
    renderQuiz();
    renderHotTopic();
    renderComments();
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
