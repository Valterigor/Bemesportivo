(function(){
  function getData(){
    if(window.BemAiAgent) return window.BemAiAgent.toArenaData();
    return window.arenaBemData;
  }

  function render(){
    const root = document.getElementById('homeAiArena');
    const data = getData();
    if(!root || !data) return;

    const expert = data.expertQuestion;
    const summary = data.dailySummary;

    root.innerHTML = `
      <div class="home-ai-head">
        <span>Agente Arena Bem Esportivo</span>
        <h2>Arena hoje</h2>
        <p>Interações aprovadas pela curadoria para manter o Bem Esportivo vivo todos os dias.</p>
      </div>
      <div class="home-ai-grid">
        <a class="home-ai-card" href="/arena">
          <span>Enquete do Dia</span>
          <strong>${data.poll?.question || 'Vote na enquete da Arena'}</strong>
          <small>${(data.poll?.options || []).map(option => option.label).slice(0, 3).join(' | ')}</small>
        </a>
        <a class="home-ai-card" href="/arena">
          <span>Quiz Diario</span>
          <strong>${data.quiz?.title || 'Teste seus conhecimentos'}</strong>
          <small>${data.quiz?.question || 'Responda ao quiz aprovado pela curadoria.'}</small>
        </a>
        <a class="home-ai-card is-featured" href="/arena">
          <span>Tema Quente da Arena</span>
          <strong>${data.hotTopic?.headline || 'Entre no debate da torcida'}</strong>
          <small>${data.hotTopic?.summary || 'Perguntas novas para quem vive o esporte.'}</small>
        </a>
        <a class="home-ai-card" href="/profissionais">
          <span>Pergunta para Especialistas</span>
          <strong>${expert?.content?.question || 'Como profissionais podem ajudar atletas amadores?'}</strong>
          <small>${expert?.content?.professional_area || 'Preparacao fisica, psicologia, fotografia e performance.'}</small>
        </a>
      </div>
      ${summary ? `<p class="home-ai-summary"><strong>Resumo do dia:</strong> ${(summary.content?.suggested_debates || summary.content?.main_topics || []).join(' | ')}</p>` : ''}
    `;
  }

  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('bemAiSuggestionsUpdated', render);
})();
