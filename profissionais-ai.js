(function(){
  const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  async function readCommunityQuestions(){
    if(location.protocol==='file:') return [];
    try{
      const response=await fetch('/api/community/comments?scope=path&id=meu-caminho-be',{cache:'no-store'});
      const payload=await response.json();
      if(!response.ok||payload?.ok===false) return [];
      return (payload.comments||[])
        .filter(item=>item.team==='uma dúvida')
        .slice(-3)
        .reverse()
        .map(item=>({content:{question:item.text,professional_area:'Pergunta da comunidade',sport:'Meu Caminho Be'},status:'aguardando especialista'}));
    }catch(error){return [];}
  }

  async function renderExpertQuestions(){
    const list = document.getElementById('expertAiList');
    if(!list) return;

    const communityItems=await readCommunityQuestions();
    const editorialItems = (window.BemAiAgent?.read?.() || [])
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

    const items=[...communityItems,...editorialItems].slice(0,3);
    list.innerHTML = (items.length ? items : fallback).map(item => `
      <article class="expert-ai-card">
        <strong>${escapeHtml(item.content.question)}</strong>
        <small>${escapeHtml(item.content.professional_area || 'Profissional do esporte')} | ${escapeHtml(item.content.sport || 'Esporte')} | ${escapeHtml(item.status)}</small>
      </article>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', renderExpertQuestions);
  window.addEventListener('bemAiSuggestionsUpdated', renderExpertQuestions);
})();
