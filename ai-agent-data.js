window.bemAiAgentSeed = {
  statuses: [
    'draft',
    'pending_review',
    'approved',
    'scheduled',
    'published',
    'rejected',
    'archived'
  ],
  schedule: {
    morning: ['generateDailyPoll', 'generateDailyQuiz', 'generateDailySportsSummary'],
    afternoon: ['generateArenaTopics', 'generateExpertQuestions'],
    evening: ['generateDailySportsSummary', 'generateContentIdeas']
  },
  editorialPrinciples: [
    'O ponto de encontro de quem vive o esporte.',
    'Conteudo claro, profissional, participativo e util.',
    'Nada critico deve ser publicado sem aprovacao humana.',
    'Nao inventar dados, resultados, falas ou estatisticas.',
    'Evitar sensacionalismo, ataques pessoais, rumores graves e clickbait.'
  ],
  suggestions: [
    {
      id: 'ai-poll-brasil-marrocos-placar',
      type: 'poll',
      title: 'Enquete do Dia',
      content: {
        question: 'O Brasil vai vencer o Marrocos? Qual será o placar?',
        options: [
          { id: 'brasil-2-0', label: 'Brasil vence por 2 x 0', votes: 34 },
          { id: 'brasil-2-1', label: 'Brasil vence por 2 x 1', votes: 39 },
          { id: 'empate-1-1', label: 'Empate em 1 x 1', votes: 17 },
          { id: 'marrocos-1-0', label: 'Marrocos vence por 1 x 0', votes: 10 },
          { id: 'outros-placares', label: 'Outros placares', votes: 8 }
        ],
        category: 'Selecao Brasileira',
        sport: 'Futebol',
        publish_at: '',
        expires_at: ''
      },
      metadata: {
        priority: 'alta',
        reason: 'Brasil x Marrocos e um tema direto para participacao rapida da torcida.',
        moderation_note: 'Manter o debate no palpite esportivo, sem ataques pessoais.'
      },
      status: 'approved',
      source_context: 'Cobertura especial de Brasil x Marrocos na Arena.',
      created_at: '2026-06-12T08:00:00-03:00',
      updated_at: '2026-06-12T08:00:00-03:00',
      approved_by: 'Curadoria Bem Esportivo',
      published_at: '2026-06-12T08:30:00-03:00',
      origin: 'ai_generated',
      edit_history: []
    },
    {
      id: 'ai-quiz-libertadores-historia',
      type: 'quiz',
      title: 'Voce conhece a historia da Libertadores?',
      content: {
        questions: [
          {
            question: 'Qual pais sediou a primeira final da Libertadores, em 1960?',
            alternatives: [
              { id: 'argentina', label: 'Argentina' },
              { id: 'uruguai', label: 'Uruguai' },
              { id: 'brasil', label: 'Brasil' },
              { id: 'chile', label: 'Chile' }
            ],
            correct_option_id: 'uruguai',
            explanation: 'A primeira final terminou com titulo do Penarol, do Uruguai.'
          }
        ],
        difficulty: 'medio',
        category: 'Historia do futebol',
        sport: 'Futebol'
      },
      metadata: {
        priority: 'media',
        reason: 'Quiz historico aumenta tempo de permanencia e combina informacao com jogo rapido.'
      },
      status: 'approved',
      source_context: 'Conteudo educativo de futebol sul-americano.',
      created_at: '2026-06-12T08:10:00-03:00',
      updated_at: '2026-06-12T08:10:00-03:00',
      approved_by: 'Curadoria Bem Esportivo',
      published_at: '2026-06-12T08:40:00-03:00',
      origin: 'ai_generated',
      edit_history: []
    },
    {
      id: 'ai-topic-neymar-selecao',
      type: 'arena_topic',
      title: 'Neymar ainda merece vaga na Selecao?',
      content: {
        description: 'A Arena abre o debate sobre tecnica, momento fisico, lideranca e concorrencia por posicao.',
        context: 'Tema forte para participacao, desde que tratado com equilibrio e foco esportivo.',
        tags: ['Selecao Brasileira', 'Debate', 'Futebol'],
        sport: 'Futebol',
        controversy_level: 'medio',
        prompts: [
          'O historico deve pesar na convocacao?',
          'Momento fisico conta mais que talento?',
          'Quem disputa espaco direto nessa funcao?'
        ]
      },
      metadata: {
        priority: 'alta',
        reason: 'Assunto de alto interesse, mas com regra clara para evitar ataques pessoais.'
      },
      status: 'approved',
      source_context: 'Debates recorrentes sobre renovacao e experiencia na Selecao.',
      created_at: '2026-06-12T13:00:00-03:00',
      updated_at: '2026-06-12T13:00:00-03:00',
      approved_by: 'Curadoria Bem Esportivo',
      published_at: '2026-06-12T13:30:00-03:00',
      origin: 'ai_generated',
      edit_history: []
    },
    {
      id: 'ai-expert-lesoes-amadores',
      type: 'expert_question',
      title: 'Como evitar lesoes em atletas amadores?',
      content: {
        question: 'Quais cuidados simples reduzem o risco de lesoes em atletas amadores?',
        professional_area: 'Preparacao fisica e fisioterapia',
        sport: 'Multiesporte',
        priority: 'alta'
      },
      metadata: {
        priority: 'alta',
        reason: 'Tema util para atletas, familias e profissionais cadastrados.'
      },
      status: 'pending_review',
      source_context: 'Pergunta aberta para profissionais do esporte contribuirem com orientacao geral.',
      created_at: '2026-06-12T14:00:00-03:00',
      updated_at: '2026-06-12T14:00:00-03:00',
      approved_by: '',
      published_at: '',
      origin: 'ai_generated',
      edit_history: []
    },
    {
      id: 'ai-summary-dia',
      type: 'daily_summary',
      title: 'Resumo Esportivo do Dia',
      content: {
        main_topics: ['Selecao Brasileira', 'calendario de jogos', 'participacao da torcida'],
        relevant_news: ['Checar fontes antes de publicar qualquer placar ou fala atribuida.'],
        suggested_debates: ['Qual deve ser a prioridade da Selecao nos proximos amistosos?'],
        possible_polls: ['Qual setor do time merece mais atencao?'],
        content_opportunities: ['Analise curta com profissional sobre prevencao de lesoes.']
      },
      metadata: {
        priority: 'media',
        reason: 'Ajuda a pauta do dia sem publicar fatos nao verificados.'
      },
      status: 'pending_review',
      source_context: 'Resumo editorial interno para planejamento.',
      created_at: '2026-06-12T19:00:00-03:00',
      updated_at: '2026-06-12T19:00:00-03:00',
      approved_by: '',
      published_at: '',
      origin: 'ai_generated',
      edit_history: []
    }
  ]
};
