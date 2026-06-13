(function(){
  const storageKey = 'arenaBemPollVoteBrasilMarrocosPlacar';

  let arenaContentOverride = null;
  let workingApiBase = '';
  let liveState = {
    pollVotes: {},
    totals: {poll:0}
  };
  let statusText = '';
  let isSaving = false;

  function apiBases(){
    const bases = [''];
    if(['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '3100'){
      bases.push('http://127.0.0.1:3100');
    }
    return workingApiBase ? [workingApiBase, ...bases.filter(base => base !== workingApiBase)] : bases;
  }

  function getData(){
    if(arenaContentOverride) return arenaContentOverride;
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

  function applyState(nextState){
    liveState = {
      pollVotes: nextState.pollVotes || {},
      totals: nextState.totals || {poll:0}
    };
    render();
  }

  function applyArenaContent(content){
    if(!content?.poll) return;
    arenaContentOverride = content;
    render();
  }

  function render(){
    const root = document.getElementById('homeAiArena');
    const data = getData();
    if(!root || !data) return;

    const poll = data.poll || {};
    const options = Array.isArray(poll.options) ? poll.options : [];
    const savedVoteRaw = localStorage.getItem(storageKey);
    const savedVote = options.some(option => option.id === savedVoteRaw) ? savedVoteRaw : '';
    const totalVotes = options.reduce((sum, option) => {
      return sum + (Number(option.votes) || 0) + (Number(liveState.pollVotes[option.id]) || 0);
    }, 0);
    const feedback = statusText || (savedVote
      ? 'Voto registrado e somado ao placar da Arena.'
      : 'Escolha uma opção para salvar no placar online.');

    root.innerHTML = `
      <div class="home-ai-head">
        <span>Enquete da Arena</span>
        <h2>Vote na home</h2>
        <p>Participe em poucos segundos e acompanhe o resultado online da torcida.</p>
      </div>
      <div class="home-poll-card">
        <div class="home-poll-copy">
          <span>${escapeHtml(poll.title || 'Enquete do Dia')}</span>
          <strong>${escapeHtml(poll.question || 'Qual assunto merece mais destaque agora?')}</strong>
          <small>${escapeHtml(feedback)}</small>
        </div>
        <div class="home-poll-options">
          ${options.map(option => {
            const votes = (Number(option.votes) || 0) + (Number(liveState.pollVotes[option.id]) || 0);
            const percent = getPercent(votes, totalVotes);
            return `
              <button class="home-poll-option ${savedVote === option.id ? 'is-selected' : ''}" type="button" data-home-poll-option="${escapeHtml(option.id)}" ${(savedVote || isSaving) ? 'disabled' : ''}>
                <span>${escapeHtml(option.label)}</span>
                <strong>${percent}%</strong>
                <i style="width:${percent}%"></i>
              </button>
            `;
          }).join('')}
        </div>
        <a class="home-poll-link" href="/arena">Ver quiz e debate completo</a>
      </div>
    `;

    root.querySelectorAll('[data-home-poll-option]').forEach(button => {
      button.addEventListener('click', async () => {
        const optionId = button.dataset.homePollOption;
        isSaving = true;
        statusText = 'Salvando voto no placar online...';
        render();
        try{
          applyState(await api('/api/arena/poll', {
            method:'POST',
            body:JSON.stringify({optionId})
          }));
          localStorage.setItem(storageKey, optionId);
          statusText = 'Voto registrado e somado ao placar da Arena.';
        }catch(error){
          statusText = 'Não foi possível salvar agora. Tente novamente em instantes.';
        }finally{
          isSaving = false;
          render();
        }
      });
    });
  }

  function setupContent(){
    api('/api/arena/content')
      .then(applyArenaContent)
      .catch(() => {});
  }

  function setupLiveState(){
    api('/api/arena/state')
      .then(applyState)
      .then(() => setupLiveEvents())
      .catch(() => {
        statusText = 'Placar online indisponível no momento.';
        render();
      });
  }

  function setupLiveEvents(){
    if(!window.EventSource) return;
    const source = new EventSource(`${workingApiBase || ''}/api/arena/events`);
    source.addEventListener('arena-state', event => {
      applyState(JSON.parse(event.data));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    setupContent();
    setupLiveState();
  });

  window.addEventListener('bemAiSuggestionsUpdated', render);
})();
