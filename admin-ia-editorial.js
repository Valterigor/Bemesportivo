(function(){
  const agent = window.BemAiAgent;
  if(!agent) return;

  const tabs = [
    { id: 'pending', label: 'Sugestoes Pendentes', filter: item => item.status === 'pending_review' },
    { id: 'poll', label: 'Enquetes', filter: item => item.type === 'poll' },
    { id: 'quiz', label: 'Quizzes', filter: item => item.type === 'quiz' },
    { id: 'arena_topic', label: 'Temas da Arena', filter: item => item.type === 'arena_topic' },
    { id: 'expert_question', label: 'Perguntas para Especialistas', filter: item => item.type === 'expert_question' },
    { id: 'daily_summary', label: 'Resumos do Dia', filter: item => item.type === 'daily_summary' },
    { id: 'history', label: 'Historico', filter: () => true }
  ];

  const labels = {
    poll: 'Enquete',
    quiz: 'Quiz',
    arena_topic: 'Arena',
    expert_question: 'Especialista',
    daily_summary: 'Resumo',
    content_idea: 'Conteudo'
  };

  let activeTab = 'pending';
  let editingId = '';

  const tabRoot = document.getElementById('adminTabs');
  const grid = document.getElementById('adminSuggestionGrid');
  const filter = document.getElementById('adminStatusFilter');
  const approver = document.getElementById('adminApprover');
  const modal = document.getElementById('adminEditModal');
  const editJson = document.getElementById('adminEditJson');
  const scheduleInput = document.getElementById('adminScheduleDate');

  function asText(value){
    if(!value) return '';
    if(typeof value === 'string') return value;
    if(Array.isArray(value)) return value.join(', ');
    return JSON.stringify(value);
  }

  function mainText(item){
    const content = item.content || {};
    if(item.type === 'poll') return content.question;
    if(item.type === 'quiz') return content.questions?.[0]?.question;
    if(item.type === 'arena_topic') return content.description || content.context;
    if(item.type === 'expert_question') return content.question;
    if(item.type === 'daily_summary') return asText(content.suggested_debates || content.main_topics);
    if(item.type === 'content_idea') return asText(content.ideas);
    return asText(content);
  }

  function renderTabs(){
    tabRoot.innerHTML = tabs.map(tab => {
      return `<button class="admin-tab ${tab.id === activeTab ? 'is-active' : ''}" type="button" data-tab="${tab.id}">${tab.label}</button>`;
    }).join('');

    tabRoot.querySelectorAll('[data-tab]').forEach(button => {
      button.addEventListener('click', () => {
        activeTab = button.dataset.tab;
        render();
      });
    });
  }

  function getVisibleItems(){
    const tab = tabs.find(item => item.id === activeTab) || tabs[0];
    const status = filter.value;
    return agent.read()
      .filter(tab.filter)
      .filter(item => !status || item.status === status)
      .sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)));
  }

  function renderCard(item){
    const reason = item.metadata?.reason || 'Sugestao gerada para manter a Arena ativa com curadoria humana.';
    const priority = item.metadata?.priority || item.content?.priority || 'media';
    return `
      <article class="ai-card">
        <div class="ai-card-head">
          <span class="ai-type">${labels[item.type] || item.type}</span>
          <span class="ai-status">${item.status}</span>
        </div>
        <h2>${item.title}</h2>
        <p>${mainText(item)}</p>
        <div class="ai-meta">
          <span><strong>Motivo:</strong> ${reason}</span>
          <span><strong>Fonte/contexto:</strong> ${item.source_context || 'Sem contexto informado'}</span>
          <span><strong>Prioridade:</strong> ${priority}</span>
          <span><strong>Origem:</strong> ${item.origin || 'ai_generated'} | <strong>Aprovado por:</strong> ${item.approved_by || 'pendente'}</span>
        </div>
        <div class="ai-actions">
          <button class="admin-button" type="button" data-action="publish" data-id="${item.id}">Publicar agora na Arena</button>
          <button class="admin-button light" type="button" data-action="approve" data-id="${item.id}">Aprovar sem publicar</button>
          <button class="admin-button light" type="button" data-action="edit" data-id="${item.id}">Editar</button>
          <button class="admin-button danger" type="button" data-action="reject" data-id="${item.id}">Rejeitar</button>
          <button class="admin-button light" type="button" data-action="schedule" data-id="${item.id}">Agendar</button>
        </div>
      </article>
    `;
  }

  function bindActions(){
    grid.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        const action = button.dataset.action;
        if(action === 'approve') agent.approveAISuggestion(id, approver.value);
        if(action === 'reject') agent.rejectAISuggestion(id);
        if(action === 'publish') agent.publishAISuggestion(id, approver.value);
        if(action === 'schedule') agent.scheduleAISuggestion(id, scheduleInput.value, approver.value);
        if(action === 'edit') openEditor(id);
        render();
      });
    });
  }

  function render(){
    renderTabs();
    const items = getVisibleItems();
    grid.innerHTML = items.length ? items.map(renderCard).join('') : '<div class="admin-empty">Nenhuma sugestao encontrada para esta aba.</div>';
    bindActions();
  }

  function openEditor(id){
    const item = agent.read().find(entry => entry.id === id);
    if(!item) return;
    editingId = id;
    editJson.value = JSON.stringify(item, null, 2);
    modal.classList.add('show');
  }

  document.getElementById('adminGeneratePoll').addEventListener('click', () => {
    agent.generateDailyPoll();
    activeTab = 'pending';
    render();
  });

  document.getElementById('adminGenerateQuiz').addEventListener('click', () => {
    agent.generateDailyQuiz();
    activeTab = 'pending';
    render();
  });

  document.getElementById('adminGenerateTopic').addEventListener('click', () => {
    agent.generateArenaTopics();
    activeTab = 'pending';
    render();
  });

  document.getElementById('adminRunCycle').addEventListener('click', () => {
    agent.generateDailyPoll();
    agent.generateDailyQuiz();
    agent.generateArenaTopics();
    agent.generateExpertQuestions();
    agent.generateDailySportsSummary();
    activeTab = 'pending';
    render();
  });

  document.getElementById('adminSaveEdit').addEventListener('click', () => {
    try{
      const parsed = JSON.parse(editJson.value);
      agent.editAISuggestion(editingId, parsed);
      modal.classList.remove('show');
      render();
    }catch(error){
      alert('JSON invalido. Revise o conteudo antes de salvar.');
    }
  });

  document.getElementById('adminCloseEdit').addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', event => {
    if(event.target === modal) modal.classList.remove('show');
  });
  filter.addEventListener('change', render);
  approver.value = agent.getApprover();
  approver.addEventListener('change', () => agent.setApprover(approver.value));

  render();
})();
