(function(){
  function renderExpertQuestions(){
    const list = document.getElementById('expertAiList');
    if(!list || !window.BemAiAgent) return;

    const items = window.BemAiAgent.read()
      .filter(item => item.type === 'expert_question')
      .filter(item => ['pending_review', 'approved', 'published', 'scheduled'].includes(item.status))
      .slice(0, 3);

    const fallback = [{
      content: {
        question: 'Como evitar lesoes em atletas amadores?',
        professional_area: 'Preparacao fisica e fisioterapia',
        sport: 'Multiesporte'
      },
      status: 'pending_review'
    }];

    list.innerHTML = (items.length ? items : fallback).map(item => `
      <article class="expert-ai-card">
        <strong>${item.content.question}</strong>
        <small>${item.content.professional_area || 'Profissional do esporte'} | ${item.content.sport || 'Esporte'} | ${item.status}</small>
      </article>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', renderExpertQuestions);
  window.addEventListener('bemAiSuggestionsUpdated', renderExpertQuestions);
})();
