const videos=[
  {id:'o-esporte-comeca-nas-pessoas',type:'local',kind:'institutional',src:'videos/beplay-o-esporte-comeca-nas-pessoas.mp4',poster:'img/3.jpeg',title:'O esporte começa com pessoas',duration:'9 segundos',views:'Filme institucional',date:'Manifesto BeMEsportivo',category:'Institucional',highlight:'Manifesto BeMEsportivo',desc:'Diferentes modalidades, uma mesma essência: o esporte nasce quando alguém decide participar.'},
  {
    id:'treino-agilidade-futebol',
    type:'local',
    src:'videos/treino-agilidade-futebol.mp4',
    poster:'img/beplay-treino-agilidade-futebol.jpg',
    title:'Resultado não acontece por acaso',
    duration:'28 segundos',
    views:'Novo no BEPlay',
    date:'Publicado hoje',
    category:'Treino',
    highlight:'Disciplina, constância e evolução',
    theme:'Disciplina, constância e evolução',
    desc:`Resultado não acontece por acaso.

Toda evolução começa com uma decisão: continuar, mesmo quando o progresso parece pequeno.

Cada treino fortalece o corpo. Cada repetição aperfeiçoa a técnica. Cada dia de dedicação constrói a confiança necessária para superar novos desafios.

Não existe atalho para quem busca excelência. O desempenho que admiramos em um atleta é o reflexo de centenas de horas de treino, disciplina, persistência e constância.

O segredo não está em fazer muito de vez em quando, mas em fazer o necessário todos os dias.

Treine. Aprenda. Evolua.

Porque os grandes resultados são construídos um treino de cada vez. 🧡💪

#BemEsportivo #Treino #Evolução #Disciplina #Constância #Esporte #Superação #Saúde #Performance`
  },
  {
    id:'treino-forca-performance',
    type:'local',
    src:'videos/treino-forca-performance.mp4',
    poster:'img/beplay-treino-forca-performance.jpg',
    title:'Treine por você. Sua saúde agradece.',
    duration:'11 segundos',
    views:'Novo no BEPlay',
    date:'Publicado hoje',
    category:'Performance',
    highlight:'Compromisso com a saúde',
    theme:'Compromisso com a saúde',
    desc:`Nem sempre vamos acordar com vontade de treinar. Haverá dias em que o corpo parecerá pesado, a mente buscará desculpas e ficar em casa parecerá a melhor escolha.

Mas é justamente nesses dias que precisamos lembrar: o treino não é apenas sobre estética ou desempenho. É sobre saúde, disposição, qualidade de vida e cuidado com o nosso futuro.

A motivação pode faltar, mas o compromisso com a nossa saúde precisa continuar. Nem todo treino será perfeito, intenso ou prazeroso. Às vezes, a maior vitória é simplesmente levantar, ir e fazer o que conseguimos.

Você não precisa estar com vontade todos os dias. Precisa apenas não abandonar a pessoa que deseja se tornar.

Treine por você. Sua saúde agradece. 🧡💪

#BemEsportivo #Saúde #Treino #Motivação #Disciplina #QualidadeDeVida`
  },
  {id:'gBkon6LC2OU',title:'Treino técnico e tático',duration:'6min 18s',views:'8,7 mil visualizações',date:'Publicado ontem',category:'Treino',highlight:'Evolução de jogo',desc:'Leitura de jogo, ocupação de espaços e ajustes técnicos para evoluir em campo.'},
  {id:'Qi1lRW18kvM',title:'Duda e o futebol',duration:'5min 02s',views:'6,1 mil visualizações',date:'Publicado nesta semana',category:'História',highlight:'Trajetória no futebol',desc:'História, bastidor e inspiração para quem acompanha o futebol por dentro.'},
  {id:'dYiX4fvxGG8',title:'Futebol e areia',duration:'7min 33s',views:'9,4 mil visualizações',date:'Publicado nesta semana',category:'Performance',highlight:'Modalidades e preparo',desc:'A importância de diferentes modalidades na evolução física e técnica.'}
];

let currentVideo=videos[0];
let toastTimer=null;
let communityRefreshTimer=null;
let activeVideoFilter='all';
const videoCommentCache={};
const COMMUNITY_ROOT=location.protocol==='file:'?'':'/api/community';
const CLIENT_KEY='bemEsportivoCommunityClientId';
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

function getVideoThumbnail(video){
  return video.type==='local' ? video.poster : `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
}

function getInternalVideoUrl(video=currentVideo){
  const url=new URL('beplay.html',window.location.href);
  url.searchParams.set('video',video.id);
  return url.href;
}

function updateVideoPlaceholder(video){
  const placeholder=document.getElementById('videoPlaceholder');
  const placeholderTitle=document.getElementById('videoPlaceholderTitle');
  const playButton=document.getElementById('playInlineVideo');
  const iframe=document.getElementById('youtubePlayer');
  const localPlayer=document.getElementById('localPlayer');
  placeholder.style.backgroundImage=`url('${getVideoThumbnail(video)}')`;
  placeholder.hidden=false;
  placeholderTitle.textContent=video.title;
  playButton.setAttribute('aria-label',`Reproduzir ${video.title}`);
  iframe.hidden=true;
  iframe.src='about:blank';
  localPlayer.pause();
  localPlayer.hidden=true;
  localPlayer.removeAttribute('src');
  localPlayer.removeAttribute('poster');
  localPlayer.load();
}

function playCurrentVideo(){
  const youtubePlayer=document.getElementById('youtubePlayer');
  const localPlayer=document.getElementById('localPlayer');
  const placeholder=document.getElementById('videoPlaceholder');
  let activePlayer=youtubePlayer;
  if(currentVideo.type==='local'){
    youtubePlayer.hidden=true;
    youtubePlayer.src='about:blank';
    localPlayer.src=currentVideo.src;
    localPlayer.poster=currentVideo.poster||'';
    localPlayer.hidden=false;
    localPlayer.defaultMuted=false;
    localPlayer.muted=false;
    localPlayer.volume=1;
    activePlayer=localPlayer;
    localPlayer.play().catch(()=>{
      showToast('Use o controle de reprodução do vídeo para iniciar');
      localPlayer.focus();
    });
  }else{
    localPlayer.pause();
    localPlayer.hidden=true;
    youtubePlayer.src=getYoutubeEmbedUrl(currentVideo,true);
    youtubePlayer.hidden=false;
  }
  placeholder.hidden=true;
  recordWatchedVideo(currentVideo);
  activePlayer.scrollIntoView({behavior:'smooth',block:'center'});
}

function setVideo(video,options={}){
  const {scroll=true,toast=true,updateUrl=true}=options;
  currentVideo=video;
  document.getElementById('youtubePlayer').title=video.title;
  document.getElementById('localPlayer').title=video.title;
  updateVideoPlaceholder(video);
  document.getElementById('videoTitle').textContent=video.title;
  document.getElementById('videoDuration').textContent=video.duration;
  document.getElementById('videoViews').textContent=video.views;
  document.getElementById('videoDate').textContent=video.date;
  document.getElementById('videoDescription').textContent=video.desc;
  document.getElementById('summaryCategory').textContent=video.category || 'BEplay';
  document.getElementById('summaryHighlight').textContent=video.highlight || 'Vídeo em destaque';
  document.getElementById('summaryContent').textContent=video.theme || video.desc;
  const youtubeLink=document.getElementById('watchOnYoutube');
  youtubeLink.hidden=video.type==='local';
  youtubeLink.href=video.type==='local' ? '#' : `https://www.youtube.com/watch?v=${video.id}`;
  if(updateUrl) history.replaceState(null,'',getInternalVideoUrl(video));
  if(scroll) document.getElementById('inicio').scrollIntoView({behavior:'smooth',block:'start'});
  if(toast) showToast(`Agora assistindo: ${video.title}`);
  renderRelated();
  renderVideoComments();
  loadVideoCommunity();
}

function renderRelated(){
  const container=document.getElementById('relatedVideos');
  const searchTerm=String(document.getElementById('videoSearch')?.value || '').trim().toLowerCase();
  const matches=videos.filter(video=>video.kind!=='institutional').filter(video=>{
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
      <div class="related-thumb" style="background-image:url('${escapeHtml(getVideoThumbnail(video))}')"></div>
      <div class="related-body">
        <strong>${escapeHtml(video.title)}</strong>
        <div class="related-card-meta">
          <span>${escapeHtml(video.category)}</span>
          <span>${escapeHtml(video.duration)}</span>
          <span>${escapeHtml(video.views)}</span>
        </div>
        <button type="button" aria-label="Reproduzir ${escapeHtml(video.title)}">▶ Reproduzir</button>
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
  list.innerHTML=history.map(item=>{
    const video=videos.find(candidate=>candidate.id===item.id);
    const thumbnail=video ? getVideoThumbnail(video) : 'img/beplay-header.jpg';
    return `
      <button class="history-item" type="button" data-history-video="${escapeHtml(item.id)}">
        <span class="history-item-thumb" style="background-image:url('${escapeHtml(thumbnail)}')"></span>
        <span>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.category || 'BEplay')}</span>
        </span>
      </button>
    `;
  }).join('');
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
  const comments=videoCommentCache[currentVideo.id];
  if(!Array.isArray(comments)){
    list.innerHTML='<span class="comment-empty">Carregando comentários da comunidade...</span>';
    return;
  }
  list.innerHTML=comments.length
    ? comments.slice(-12).reverse().map(comment=>`
      <article class="comment-item">
        <strong>${escapeHtml(comment.name || 'Visitante')}</strong>
        <p>${escapeHtml(comment.text)}</p>
        <time>${escapeHtml(formatCommentDate(comment.createdAt))}</time>
      </article>
    `).join('')
    : '<span class="comment-empty">Seja o primeiro a comentar este vídeo.</span>';
}

function formatCommentDate(value){
  const date=new Date(value || Date.now());
  if(Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

async function loadVideoComments(video=currentVideo){
  const videoId=video.id;
  const payload=await communityRequest(`/comments?scope=beplay&id=${encodeURIComponent(videoId)}`);
  videoCommentCache[videoId]=Array.isArray(payload.comments) ? payload.comments : [];
  if(currentVideo.id===videoId) renderVideoComments();
}

async function loadVideoCommunity(video=currentVideo){
  try{
    const state=await communityRequest('/state');
    const pollId=getVideoReactionPollId(video);
    if(currentVideo.id===video.id){
      renderReactions(state?.votes?.[pollId]?.totals || {}, localStorage.getItem(`${pollId}:choice`) || '');
    }
  }catch(error){
    if(currentVideo.id===video.id) renderReactions({}, '');
  }
  loadVideoComments(video).catch(()=>{
    if(currentVideo.id===video.id && !Array.isArray(videoCommentCache[video.id])){
      document.getElementById('videoCommentList').innerHTML='<span class="comment-empty">Não foi possível carregar os comentários globais agora.</span>';
    }
  });
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

document.getElementById('playInlineVideo').addEventListener('click',()=>{
  playCurrentVideo();
});

document.getElementById('shareVideo').addEventListener('click',async()=>{
  const url=getInternalVideoUrl(currentVideo);
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

document.getElementById('videoCommentForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const nameInput=document.getElementById('videoCommentName');
  const textarea=document.getElementById('videoCommentText');
  const button=event.currentTarget.querySelector('button[type="submit"]');
  const name=String(nameInput?.value || '').trim().slice(0,40) || 'Visitante';
  const text=String(textarea.value || '').trim();
  if(!text) return;
  localStorage.setItem(COMMENT_NAME_KEY, name);
  button.disabled=true;
  button.textContent='Publicando...';
  try{
    const videoId=currentVideo.id;
    const payload=await communityRequest('/comment',{
      method:'POST',
      body:JSON.stringify({scope:'beplay',id:videoId,name,text:text.slice(0,280),clientId:getClientId()})
    });
    videoCommentCache[videoId]=Array.isArray(payload.comments) ? payload.comments : [];
    textarea.value='';
    if(currentVideo.id===videoId) renderVideoComments();
    showToast('Comentário publicado para todos');
  }catch(error){
    showToast('Não foi possível salvar o comentário global');
  }finally{
    button.disabled=false;
    button.textContent='Publicar comentário';
  }
});

const publishedVideos=videos.filter(video=>video.kind!=='institutional');
document.getElementById('channelStats').textContent=`Manifesto institucional + ${publishedVideos.length} vídeos`;
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
const requestedVideoId=new URLSearchParams(window.location.search).get('video');
const requestedVideo=videos.find(video=>video.id===requestedVideoId);
setVideo(requestedVideo||videos[0],{scroll:false,toast:false,updateUrl:false});
renderWatchHistory();
communityRefreshTimer=window.setInterval(()=>{
  if(document.hidden) return;
  loadVideoCommunity();
},15000);
