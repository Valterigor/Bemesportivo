const videos=[
  {id:'gBkon6LC2OU',title:'Treino técnico e tático',duration:'6min 18s',views:'8,7 mil visualizações',date:'Publicado ontem',category:'Treino',highlight:'Evolução de jogo',desc:'Leitura de jogo, ocupação de espaços e ajustes técnicos para evoluir em campo.'},
  {id:'Qi1lRW18kvM',title:'Duda e o futebol',duration:'5min 02s',views:'6,1 mil visualizações',date:'Publicado nesta semana',category:'História',highlight:'Trajetória no futebol',desc:'História, bastidor e inspiração para quem acompanha o futebol por dentro.'},
  {id:'dYiX4fvxGG8',title:'Futebol e areia',duration:'7min 33s',views:'9,4 mil visualizações',date:'Publicado nesta semana',category:'Performance',highlight:'Modalidades e preparo',desc:'A importância de diferentes modalidades na evolução física e técnica.'}
];

let currentVideo=videos[0];
let toastTimer=null;
let communityRefreshTimer=null;
let activeVideoFilter='all';
const COMMUNITY_ROOT=location.protocol==='file:'?'':'/api/community';
const CLIENT_KEY='bemEsportivoCommunityClientId';
const COMMENT_KEY='bemBeplayVideoComments';
const COMMENT_NAME_KEY='bemBeplayCommentName';
const HISTORY_KEY='bemBeplayWatchHistory';

function escapeHtml(value){
  return String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function getClientId(){
  try{
    let id=localStorage.getItem(CLIENT_KEY);
    if(!id){
      id=window.crypto?.randomUUID ? window.crypto.randomUUID() : `be-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(CLIENT_KEY,id);
    }
    return id;
  }catch(error){
    return `be-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

async function communityRequest(path, options={}){
  if(!COMMUNITY_ROOT) throw new Error('API indisponível em arquivo local.');
  const response=await fetch(`${COMMUNITY_ROOT}${path}`,{
    headers:{'Content-Type':'application/json',...(options.headers||{})},
    cache:'no-store',
    ...options
  });
  const payload=await response.json();
  if(!response.ok || payload?.ok===false) throw new Error(payload?.error || 'Falha na comunidade.');
  return payload;
}

function getVideoReactionPollId(video=currentVideo){
  return `beplay-reaction-${video.id}`.toLowerCase();
}

function getYoutubeEmbedUrl(video, autoplay=false){
  const params=new URLSearchParams({
    rel:'0',
    modestbranding:'1',
    playsinline:'1'
  });
  if(autoplay) params.set('autoplay','1');
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?${params.toString()}`;
}

function updateVideoPlaceholder(video){
  const placeholder=document.getElementById('videoPlaceholder');
  const placeholderTitle=document.getElementById('videoPlaceholderTitle');
  const iframe=document.getElementById('youtubePlayer');
  placeholder.style.backgroundImage=`url('https://img.youtube.com/vi/${video.id}/hqdefault.jpg')`;
  placeholder.hidden=false;
  placeholderTitle.textContent=video.title;
  iframe.hidden=true;
  iframe.src='about:blank';
}

function playCurrentVideo(){
  const player=document.getElementById('youtubePlayer');
  const placeholder=document.getElementById('videoPlaceholder');
  player.src=getYoutubeEmbedUrl(currentVideo,true);
  player.hidden=false;
  placeholder.hidden=true;
  recordWatchedVideo(currentVideo);
  player.scrollIntoView({behavior:'smooth',block:'center'});
}

function setVideo(video){
  currentVideo=video;
  document.getElementById('youtubePlayer').title=video.title;
  updateVideoPlaceholder(video);
  document.getElementById('videoTitle').textContent=video.title;
  document.getElementById('videoDuration').textContent=video.duration;
  document.getElementById('videoViews').textContent=video.views;
  document.getElementById('videoDate').textContent=video.date;
  document.getElementById('videoDescription').textContent=video.desc;
  document.getElementById('summaryCategory').textContent=video.category || 'BEplay';
  document.getElementById('summaryHighlight').textContent=video.highlight || 'Vídeo em destaque';
  document.getElementById('summaryContent').textContent=video.desc;
  document.getElementById('watchOnYoutube').href=`https://www.youtube.com/watch?v=${video.id}`;
  document.getElementById('inicio').scrollIntoView({behavior:'smooth',block:'start'});
  showToast(`Agora assistindo: ${video.title}`);
  renderRelated();
  renderVideoComments();
  loadVideoCommunity();
}

function renderRelated(){
  const container=document.getElementById('relatedVideos');
  const searchTerm=String(document.getElementById('videoSearch')?.value || '').trim().toLowerCase();
  const matches=videos.filter(video=>{
    const matchesFilter=activeVideoFilter==='all' || video.category===activeVideoFilter;
    const matchesSearch=!searchTerm || `${video.title} ${video.category} ${video.desc}`.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });
  const playlistCount=document.getElementById('playlistCount');
  if(playlistCount) playlistCount.textContent=`${matches.length} vídeos`;
  container.innerHTML='';

  if(!matches.length){
    container.innerHTML='<div class="comment-empty">Nenhum vídeo encontrado nessa busca.</div>';
    return;
  }

  matches.forEach(video=>{
    const card=document.createElement('article');
    card.className=`related-card${video.id===currentVideo.id ? ' is-current' : ''}`;
    card.innerHTML=`
      <div class="related-thumb" style="background-image:url(https://img.youtube.com/vi/${video.id}/hqdefault.jpg)"></div>
      <div class="related-body">
        <strong>${escapeHtml(video.title)}</strong>
        <div class="related-card-meta">
          <span>${escapeHtml(video.category)}</span>
          <span>${escapeHtml(video.duration)}</span>
          <span>${escapeHtml(video.views)}</span>
        </div>
        <button type="button">${video.id===currentVideo.id ? 'Assistindo' : 'Assistir'}</button>
      </div>
    `;
    card.querySelector('button').addEventListener('click',()=>{setVideo(video);playCurrentVideo();});
    card.addEventListener('click',event=>{
      if(event.target.closest('button')) return;
      setVideo(video);
      playCurrentVideo();
    });
    container.appendChild(card);
  });
}

function showToast(message){
  const toast=document.getElementById('pageToast');
  toast.textContent=message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer=window.setTimeout(()=>toast.classList.remove('is-visible'),2400);
}

function renderReactions(totals={}, selected=''){
  const likes=Number(totals.like||0);
  const dislikes=Number(totals.dislike||0);
  document.getElementById('likeCount').textContent=String(likes);
  document.getElementById('dislikeCount').textContent=String(dislikes);
  document.querySelectorAll('[data-video-reaction]').forEach(button=>{
    button.classList.toggle('is-active', button.dataset.videoReaction===selected);
  });
}

function getStoredComments(){
  try{
    const comments=JSON.parse(localStorage.getItem(COMMENT_KEY) || '{}');
    return comments && typeof comments==='object' ? comments : {};
  }catch(error){
    return {};
  }
}

function saveStoredComments(comments){
  localStorage.setItem(COMMENT_KEY, JSON.stringify(comments));
}

function getWatchHistory(){
  try{
    const history=JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(history) ? history : [];
  }catch(error){
    return [];
  }
}

function saveWatchHistory(history){
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0,8)));
}

function recordWatchedVideo(video){
  const history=getWatchHistory().filter(item=>item.id!==video.id);
  history.unshift({
    id:video.id,
    title:video.title,
    category:video.category,
    watchedAt:new Date().toISOString()
  });
  saveWatchHistory(history);
  renderWatchHistory();
}

function renderWatchHistory(){
  const list=document.getElementById('watchHistory');
  if(!list) return;
  const history=getWatchHistory();
  if(!history.length){
    list.innerHTML='<span class="comment-empty">Seu histórico aparece depois que você assistir a um vídeo.</span>';
    return;
  }
  list.innerHTML=history.map(item=>`
    <button class="history-item" type="button" data-history-video="${escapeHtml(item.id)}">
      <span class="history-item-thumb" style="background-image:url(https://img.youtube.com/vi/${encodeURIComponent(item.id)}/hqdefault.jpg)"></span>
      <span>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.category || 'BEplay')}</span>
      </span>
    </button>
  `).join('');
  list.querySelectorAll('[data-history-video]').forEach(button=>{
    button.addEventListener('click',()=>{
      const video=videos.find(item=>item.id===button.dataset.historyVideo);
      if(video){
        setVideo(video);
        playCurrentVideo();
      }
    });
  });
}

function renderVideoComments(){
  const list=document.getElementById('videoCommentList');
  if(!list) return;
  const comments=getStoredComments()[currentVideo.id] || [];
  list.innerHTML=comments.length
    ? comments.slice(-12).reverse().map(comment=>`
      <article class="comment-item">
        <strong>${escapeHtml(comment.name || 'Visitante')}</strong>
        <p>${escapeHtml(comment.text)}</p>
      </article>
    `).join('')
    : '<span class="comment-empty">Seja o primeiro a comentar este vídeo.</span>';
}

async function loadVideoCommunity(){
  try{
    const state=await communityRequest('/state');
    renderReactions(state?.votes?.[getVideoReactionPollId()]?.totals || {}, localStorage.getItem(`${getVideoReactionPollId()}:choice`) || '');
  }catch(error){
    renderReactions({}, '');
  }
}

document.querySelectorAll('[data-video-reaction]').forEach(button=>{
  button.addEventListener('click',async()=>{
    const choiceId=button.dataset.videoReaction;
    const pollId=getVideoReactionPollId();
    try{
      const payload=await communityRequest('/vote',{
        method:'POST',
        body:JSON.stringify({pollId,choiceId,clientId:getClientId()})
      });
      localStorage.setItem(`${pollId}:choice`, choiceId);
      renderReactions(payload.vote?.totals || {}, choiceId);
      showToast(choiceId==='like' ? 'Você gostou deste vídeo' : 'Opinião registrada');
    }catch(error){
      showToast('Servidor de opiniões indisponível');
    }
  });
});

document.getElementById('watchOnSite').addEventListener('click',()=>{
  playCurrentVideo();
  showToast('Vídeo pronto para assistir');
});

document.getElementById('playInlineVideo').addEventListener('click',()=>{
  playCurrentVideo();
  showToast('Vídeo pronto para assistir');
});

document.getElementById('shareVideo').addEventListener('click',async()=>{
  const url=`https://www.youtube.com/watch?v=${currentVideo.id}`;
  try{
    if(navigator.share){
      await navigator.share({title:currentVideo.title,text:'Assista no BEplay Rodada',url});
      showToast('Compartilhamento aberto');
    }else if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(url);
      showToast('Link copiado');
    }else{
      window.prompt('Copie o link do vídeo:', url);
      showToast('Link pronto para copiar');
    }
  }catch(error){
    showToast('Compartilhamento cancelado');
  }
});

document.getElementById('saveVideo').addEventListener('click',()=>{
  localStorage.setItem('bemBeplaySavedVideo', JSON.stringify(currentVideo));
  document.getElementById('profileSaved').textContent=`Salvo: ${currentVideo.title}`;
  document.getElementById('profileActions').textContent=`Último vídeo salvo: ${currentVideo.title}`;
  document.getElementById('saveVideo').textContent='Salvo';
  showToast('Vídeo salvo');
});

document.getElementById('subscribeChannel').addEventListener('click',()=>{
  localStorage.setItem('bemBeplaySubscribed', 'true');
  document.getElementById('subscribeChannel').textContent='Inscrito';
  showToast('Inscrição salva neste dispositivo');
});

document.getElementById('videoSearch').addEventListener('input',renderRelated);

document.querySelectorAll('[data-video-filter]').forEach(button=>{
  button.addEventListener('click',()=>{
    activeVideoFilter=button.dataset.videoFilter || 'all';
    document.querySelectorAll('[data-video-filter]').forEach(item=>item.classList.toggle('is-active', item===button));
    renderRelated();
  });
});

document.getElementById('videoCommentForm').addEventListener('submit',event=>{
  event.preventDefault();
  const nameInput=document.getElementById('videoCommentName');
  const textarea=document.getElementById('videoCommentText');
  const name=String(nameInput?.value || '').trim().slice(0,40) || 'Visitante';
  const text=String(textarea.value || '').trim();
  if(!text) return;
  localStorage.setItem(COMMENT_NAME_KEY, name);
  const comments=getStoredComments();
  comments[currentVideo.id]=Array.isArray(comments[currentVideo.id]) ? comments[currentVideo.id] : [];
  comments[currentVideo.id].push({
    name,
    text:text.slice(0,280),
    createdAt:new Date().toISOString()
  });
  saveStoredComments(comments);
  textarea.value='';
  renderVideoComments();
  showToast('Comentário publicado');
});

document.getElementById('todayDay').textContent=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
document.getElementById('videoCount').textContent=String(videos.length);
document.getElementById('channelStats').textContent=`${videos.length} vídeos publicados`;
try{
  const saved=JSON.parse(localStorage.getItem('bemBeplaySavedVideo') || 'null');
  if(saved?.title){
    document.getElementById('profileSaved').textContent=`Salvo: ${saved.title}`;
    document.getElementById('profileActions').textContent=`Último vídeo salvo: ${saved.title}`;
  }
}catch(error){}
if(localStorage.getItem('bemBeplaySubscribed')==='true'){
  document.getElementById('subscribeChannel').textContent='Inscrito';
}
const savedCommentName=localStorage.getItem(COMMENT_NAME_KEY);
if(savedCommentName && document.getElementById('videoCommentName')){
  document.getElementById('videoCommentName').value=savedCommentName;
}
renderRelated();
renderVideoComments();
renderWatchHistory();
loadVideoCommunity();
communityRefreshTimer=window.setInterval(()=>{
  if(document.hidden) return;
  loadVideoCommunity();
},15000);
