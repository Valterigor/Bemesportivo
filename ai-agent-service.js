(function(){
  const STORAGE_KEY = 'bemAiEditorialSuggestions';
  const APPROVER_KEY = 'bemAiEditorialApprover';

  const seed = window.bemAiAgentSeed || { suggestions: [], statuses: [] };

  function now(){
    return new Date().toISOString();
  }

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function read(){
    try{
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if(Array.isArray(stored) && stored.length) return stored;
    }catch(error){}
    const seeded = clone(seed.suggestions || []);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function write(items){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('bemAiSuggestionsUpdated', { detail: items }));
    return items;
  }

  function makeId(type){
    return `ai-${type}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  }

  function baseSuggestion(type, title, content, metadata, sourceContext){
    return {
      id: makeId(type),
      type,
      title,
      content,
      metadata: Object.assign({ priority: 'media' }, metadata || {}),
      status: 'pending_review',
      source_context: sourceContext || 'Gerado pelo Agente Arena Bem Esportivo.',
      created_at: now(),
      updated_at: now(),
      approved_by: '',
      published_at: '',
      origin: 'ai_generated',
      edit_history: []
    };
  }

  function saveSuggestion(suggestion){
    const items = read();
    items.unshift(suggestion);
    write(items);
    return suggestion;
  }

  function updateSuggestion(id, updater){
    const items = read();
    const index = items.findIndex(item => item.id === id);
    if(index < 0) return null;
    const before = clone(items[index]);
    const after = updater(clone(items[index]));
    after.updated_at = now();
    after.edit_history = after.edit_history || [];
    after.edit_history.push({
      at: now(),
      before_status: before.status,
      after_status: after.status,
      action: after._last_action || 'edit'
    });
    delete after._last_action;
    items[index] = after;
    write(items);
    return after;
  }

  function getApprover(){
    return localStorage.getItem(APPROVER_KEY) || 'Curadoria Bem Esportivo';
  }

  function setApprover(name){
    localStorage.setItem(APPROVER_KEY, (name || 'Curadoria Bem Esportivo').trim());
  }

  function approveAISuggestion(id, approvedBy){
    return updateSuggestion(id, item => {
      item.status = 'approved';
      item.approved_by = approvedBy || getApprover();
      item._last_action = 'approve';
      return item;
    });
  }

  function rejectAISuggestion(id){
    return updateSuggestion(id, item => {
      item.status = 'rejected';
      item._last_action = 'reject';
      return item;
    });
  }

  function publishAISuggestion(id, approvedBy){
    return updateSuggestion(id, item => {
      item.status = 'published';
      item.approved_by = item.approved_by || approvedBy || getApprover();
      item.published_at = now();
      item._last_action = 'publish';
      return item;
    });
  }

  function scheduleAISuggestion(id, dateTime, approvedBy){
    return updateSuggestion(id, item => {
      item.status = 'scheduled';
      item.approved_by = item.approved_by || approvedBy || getApprover();
      item.metadata = item.metadata || {};
      item.metadata.scheduled_for = dateTime || '';
      item._last_action = 'schedule';
      return item;
    });
  }

  function archiveAISuggestion(id){
    return updateSuggestion(id, item => {
      item.status = 'archived';
      item._last_action = 'archive';
      return item;
    });
  }

  function editAISuggestion(id, patch){
    return updateSuggestion(id, item => {
      Object.assign(item, patch || {});
      item._last_action = 'edit';
      return item;
    });
  }

  function generateDailyPoll(){
    return saveSuggestion(baseSuggestion('poll', 'Enquete do Dia', {
      question: 'Qual tema voce quer ver em debate hoje na Arena?',
      options: [
        { id: 'selecao', label: 'Selecao Brasileira', votes: 0 },
        { id: 'base', label: 'Futebol de base', votes: 0 },
        { id: 'performance', label: 'Treino e performance', votes: 0 }
      ],
      category: 'Participacao',
      sport: 'Futebol',
      publish_at: '',
      expires_at: ''
    }, {
      priority: 'alta',
      reason: 'Pergunta aberta e segura quando nao ha informacao factual suficiente.'
    }, 'Geracao manual do painel IA Editorial.'));
  }

  function generateDailyQuiz(){
    return saveSuggestion(baseSuggestion('quiz', 'Quiz Diario: fundamentos do esporte', {
      questions: [{
        question: 'Em um aquecimento bem feito, qual objetivo vem primeiro?',
        alternatives: [
          { id: 'cansar', label: 'Cansar o atleta antes do treino' },
          { id: 'preparar', label: 'Preparar corpo e atencao para a atividade' },
          { id: 'pular', label: 'Substituir o treino principal' },
          { id: 'competir', label: 'Definir quem joga melhor' }
        ],
        correct_option_id: 'preparar',
        explanation: 'O aquecimento prepara o corpo gradualmente e ajuda a reduzir riscos.'
      }],
      difficulty: 'facil',
      category: 'Saude e performance',
      sport: 'Multiesporte'
    }, {
      priority: 'media',
      reason: 'Conteudo educativo com utilidade real para atletas amadores.'
    }, 'Geracao manual do painel IA Editorial.'));
  }

  function generateArenaTopics(){
    return saveSuggestion(baseSuggestion('arena_topic', 'A base recebe a atencao que merece?', {
      description: 'Debate sobre formacao, estrutura, familia, escola e oportunidades para jovens atletas.',
      context: 'Tema alinhado a projetos e reportagens do Bem Esportivo.',
      tags: ['Base', 'Formacao', 'Projetos'],
      sport: 'Futebol',
      controversy_level: 'baixo',
      prompts: [
        'O que mais falta na formacao esportiva?',
        'Familia e escola conseguem caminhar junto com o clube?',
        'Como valorizar bons projetos locais?'
      ]
    }, {
      priority: 'alta',
      reason: 'Tema participativo e construtivo para a comunidade.'
    }, 'Geracao manual do painel IA Editorial.'));
  }

  function generateExpertQuestions(){
    return saveSuggestion(baseSuggestion('expert_question', 'Pergunta para Especialistas', {
      question: 'Como um atleta amador deve organizar treino, descanso e alimentacao na semana?',
      professional_area: 'Treinamento fisico e nutricao esportiva',
      sport: 'Multiesporte',
      priority: 'alta'
    }, {
      priority: 'alta',
      reason: 'Pergunta util para profissionais cadastrados responderem com orientacao geral.'
    }, 'Geracao manual do painel IA Editorial.'));
  }

  function generateDailySportsSummary(){
    return saveSuggestion(baseSuggestion('daily_summary', 'Resumo Esportivo do Dia', {
      main_topics: ['Agenda esportiva', 'debates da torcida', 'temas para especialistas'],
      relevant_news: ['Validar noticias em fontes confiaveis antes de publicar.'],
      suggested_debates: ['Qual assunto merece abrir a Arena amanha?'],
      possible_polls: ['Voce prefere debate sobre Selecao, base ou performance?'],
      content_opportunities: ['Post curto com dica de profissional cadastrado.']
    }, {
      priority: 'media',
      reason: 'Organiza pauta sem afirmar dados nao checados.'
    }, 'Geracao manual do painel IA Editorial.'));
  }

  function generateContentIdeas(){
    return saveSuggestion(baseSuggestion('content_idea', 'Sugestoes de Conteudo', {
      ideas: [
        'Entrevista curta com personal sobre retorno aos treinos.',
        'Reportagem sobre projetos esportivos de bairro.',
        'Video rapido explicando como participar da Arena.'
      ],
      formats: ['artigo', 'reportagem', 'video', 'post curto']
    }, {
      priority: 'media',
      reason: 'Apoia calendario editorial com equipe pequena.'
    }, 'Geracao manual do painel IA Editorial.'));
  }

  function approvedItems(type){
    return read().filter(item => {
      return item.type === type && ['approved', 'published', 'scheduled'].includes(item.status);
    });
  }

  function latestApproved(type){
    return approvedItems(type).sort((a, b) => {
      return String(b.published_at || b.updated_at || b.created_at).localeCompare(String(a.published_at || a.updated_at || a.created_at));
    })[0] || null;
  }

  function isCurrentMatchPoll(poll){
    const question = String(poll?.content?.question || '').toLowerCase();
    return question.includes('brasil') && question.includes('marrocos') && question.includes('placar');
  }

  function toArenaData(){
    const fallback = window.arenaBemData || {};
    const approvedPoll = latestApproved('poll');
    const poll = isCurrentMatchPoll(approvedPoll) ? approvedPoll : null;
    const quiz = latestApproved('quiz');
    const topic = latestApproved('arena_topic');
    const question = quiz?.content?.questions?.[0];

    return {
      poll: poll ? {
        title: poll.title,
        question: poll.content.question,
        options: poll.content.options || []
      } : fallback.poll,
      quiz: quiz && question ? {
        title: quiz.title,
        question: question.question,
        options: question.alternatives || [],
        correctOptionId: question.correct_option_id,
        explanation: question.explanation
      } : fallback.quiz,
      hotTopic: topic ? {
        title: 'Tema Quente da Arena',
        tag: (topic.content.tags || [topic.content.sport || 'Arena'])[0],
        headline: topic.title,
        summary: topic.content.description || topic.content.context,
        prompts: topic.content.prompts || []
      } : fallback.hotTopic,
      expertQuestion: latestApproved('expert_question'),
      dailySummary: latestApproved('daily_summary')
    };
  }

  window.BemAiAgent = {
    storageKey: STORAGE_KEY,
    statuses: seed.statuses || [],
    schedule: seed.schedule || {},
    editorialPrinciples: seed.editorialPrinciples || [],
    read,
    write,
    setApprover,
    getApprover,
    generateDailyPoll,
    generateDailyQuiz,
    generateArenaTopics,
    generateExpertQuestions,
    generateDailySportsSummary,
    generateContentIdeas,
    approveAISuggestion,
    rejectAISuggestion,
    publishAISuggestion,
    scheduleAISuggestion,
    archiveAISuggestion,
    editAISuggestion,
    latestApproved,
    toArenaData
  };
})();
