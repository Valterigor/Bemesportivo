(function(){
  const storageKeys = {
    poll: 'arenaBemPollVote',
    quiz: 'arenaBemQuizAnswer',
    comments: 'arenaBemLocalComments'
  };

  let liveState = {
    pollVotes: {},
    quizAnswers: {},
    comments: [],
    totals: {poll:0, quiz:0, comments:0}
  };
  let apiReady = false;

  function getData(){
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

  async function api(path, options){
    const response = await fetch(path, {
      headers:{'Content-Type':'application/json'},
      ...options
    });
    const contentType = response.headers.get('content-type') || '';
    if(!contentType.includes('application/json')){
      throw new Error('API da Arena indisponivel');
    }
    const payload = await response.json();
    if(!response.ok) throw new Error(payload.error || 'Falha na Arena');
    return payload;
  }

  function getLocalComments(){
    try{
      const comments = JSON.parse(localStorage.getItem(storageKeys.comments) || '[]');
      return Array.isArray(comments) ? comments : [];
    }catch(error){
      return [];
    }
  }

  function saveLocalComments(comments){
    localStorage.setItem(storageKeys.comments, JSON.stringify(comments.slice(0, 80)));
  }

  function applyLocalState(){
    const comments = getLocalComments();
    liveState = {
      ...liveState,
      comments,
      totals: {
        ...liveState.totals,
        comments: comments.length
      }
    };
    apiReady = false;
    updateLiveCounters();
    renderComments();
  }

  function addLocalComment(name, text){
    const comments = getLocalComments();
    comments.unshift({
      id: `local-${Date.now()}`,
      name: String(name || '').trim().slice(0, 40) || 'Visitante',
      text: String(text || '').trim().slice(0, 500),
      createdAt: new Date().toISOString()
    });
    saveLocalComments(comments);
    applyLocalState();
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

  function renderPoll(){
    const data = getData();
    const root = document.getElementById('arenaPoll');
    if(!root || !data?.poll) return;

    const savedVote = localStorage.getItem(storageKeys.poll);
    const totalVotes = data.poll.options.reduce((sum, option) => {
      const remoteVotes = Number(liveState.pollVotes[option.id]) || 0;
      const localFallback = !apiReady && savedVote === option.id ? 1 : 0;
      return sum + option.votes + remoteVotes + localFallback;
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
          const localFallback = !apiReady && savedVote === option.id ? 1 : 0;
          const votes = option.votes + remoteVotes + localFallback;
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
        localStorage.setItem(storageKeys.poll, optionId);
        renderPoll();
        try{
          applyState(await api('/api/arena/poll', {
            method:'POST',
            body:JSON.stringify({optionId})
          }));
          setStatus('Ao vivo');
        }catch(error){
          setStatus('Modo local', true);
        }
      });
    });
  }

  function renderQuiz(){
    const data = getData();
    const root = document.getElementById('arenaQuiz');
    if(!root || !data?.quiz) return;

    const savedAnswer = localStorage.getItem(storageKeys.quiz);
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
        localStorage.setItem(storageKeys.quiz, optionId);
        renderQuiz();
        try{
          applyState(await api('/api/arena/quiz', {
            method:'POST',
            body:JSON.stringify({optionId})
          }));
          setStatus('Ao vivo');
        }catch(error){
          setStatus('Modo local', true);
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

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button');
      const name = document.getElementById('arenaCommentName')?.value || '';
      const textEl = document.getElementById('arenaCommentText');
      const text = textEl?.value || '';
      if(text.trim().length < 3) return;

      if(button) button.disabled = true;
      try{
        applyState(await api('/api/arena/comments', {
          method:'POST',
          body:JSON.stringify({name, text})
        }));
        form.reset();
        setStatus('Ao vivo');
      }catch(error){
        addLocalComment(name, text);
        form.reset();
        setStatus('Salvo neste aparelho', true);
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
        applyLocalState();
        setStatus('Modo local', true);
      });

    if(!window.EventSource) return;
    const source = new EventSource('/api/arena/events');
    source.addEventListener('arena-state', event => {
      applyState(JSON.parse(event.data));
      setStatus('Ao vivo');
    });
    source.addEventListener('error', () => {
      if(!apiReady) setStatus('Modo local', true);
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
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderPoll();
    renderQuiz();
    renderHotTopic();
    renderComments();
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
