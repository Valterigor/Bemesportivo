(function(){
  const root=document.querySelector('[data-home-live-scores]');
  if(!root)return;
  const track=root.querySelector('[data-live-score-track]');
  const today=new Date();
  const date=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('');
  const labels={brasileirao:'Brasileirão Série A',champions:'Champions League'};
  const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const scoreCard=match=>{
    const home=match.home||{}, away=match.away||{};
    const status=match.state==='in'?`AO VIVO${match.detail?` · ${match.detail}`:''}`:match.detail||'PRÓXIMO';
    const logo=team=>team.logo?`<img src="${escapeHtml(team.logo)}" alt="" loading="lazy" onerror="this.hidden=true">`:'';
    return `<article class="home-live-score${match.state==='in'?' is-live':''}"><span class="home-live-score-status">${escapeHtml(labels[match.competition]||'Jogo')} · ${escapeHtml(status)}</span><span class="home-live-score-team">${logo(home)}${escapeHtml(home.name)}</span><strong class="home-live-score-value">${escapeHtml(home.score??'–')} - ${escapeHtml(away.score??'–')}</strong><span class="home-live-score-team">${logo(away)}${escapeHtml(away.name)}</span></article>`;
  };
  async function load(){
    try{
      const response=await fetch(`/api/palpitaria?date=${date}`,{cache:'no-store'});
      const payload=await response.json();
      const games=(payload.matches||[]).filter(match=>['brasileirao','champions'].includes(match.competition));
      track.innerHTML=games.length?games.map(scoreCard).join(''):'<span class="home-live-score-empty">Nenhum jogo dessas competições hoje.</span>';
    }catch{track.innerHTML='<span class="home-live-score-empty">Placares indisponíveis no momento.</span>';}
  }
  load();
  window.setInterval(()=>{if(!document.hidden)load()},30000);
})();
