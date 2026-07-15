function toggleTexto(id,button){
const el=document.getElementById(id);
const willOpen=el.style.display!=='block';
el.style.display=willOpen?'block':'none';
const post=el.closest('.post');
if(post) post.classList.toggle('expanded',willOpen);
if(button){
button.setAttribute('aria-expanded',String(willOpen));
button.textContent=willOpen?'Fechar conteúdo':'Ler conteúdo completo';
}
}

const posts=document.querySelectorAll('.post-item');
const articlePosts=document.querySelectorAll('.article-grid .post-item');
const filterButtons=document.querySelectorAll('button.filter-btn');
const communityChannels=document.querySelectorAll('.community-channel');
const search=document.getElementById('searchInput');
const contentResults=document.getElementById('content-results');
let activeFilter='';

function applyFilters(){
const term=search ? search.value.toLowerCase().trim() : '';
posts.forEach(post=>{
const text=post.innerText.toLowerCase();
const tags=post.dataset.tags||'';
const matchesSearch=term===''||text.includes(term);
const matchesFilter=activeFilter===''||tags.includes(activeFilter);
if(matchesSearch && matchesFilter){
post.classList.remove('hidden-search');
}else{
post.classList.add('hidden-search');
}
});
if(contentResults){
const visibleArticles=Array.from(articlePosts).filter(post=>!post.classList.contains('hidden-search')).length;
contentResults.textContent=visibleArticles===1?'1 conversa encontrada':`${visibleArticles} conversas encontradas`;
}
}

function filterPosts(tag){
activeFilter=tag;
filterButtons.forEach(btn=>{
btn.classList.remove('active');
if(btn.dataset.filter===tag){
btn.classList.add('active');
}
});
communityChannels.forEach(channel=>{
channel.classList.toggle('active',channel.dataset.filter===tag);
});
applyFilters();
const ideas=document.getElementById('ideias');
if(ideas) ideas.scrollIntoView({behavior:'smooth',block:'start'});
}

function resetAllFilters(){
activeFilter='';
filterButtons.forEach(btn=>btn.classList.remove('active'));
communityChannels.forEach(channel=>channel.classList.toggle('active',channel.dataset.filter===''));
if(search) search.value='';
applyFilters();
}

filterButtons.forEach(btn=>{
btn.addEventListener('click',function(){
if(this.id==='resetFilters'){
resetAllFilters();
return;
}
filterPosts(this.dataset.filter);
});
});

if(search) search.addEventListener('keyup',applyFilters);

communityChannels.forEach(channel=>{
channel.addEventListener('click',()=>filterPosts(channel.dataset.filter||''));
});

const pollOptions=document.querySelectorAll('.poll-option');
const pollFeedback=document.getElementById('poll-feedback');
const pollStorageKey='falaBemWeeklyPollRoutine';

function showPollVote(option){
pollOptions.forEach(button=>{
const selected=button.dataset.pollOption===option;
button.classList.toggle('selected',selected);
button.setAttribute('aria-pressed',String(selected));
const status=button.querySelector('span');
if(status) status.textContent=selected?'Seu voto':'Votar';
});
if(pollFeedback) pollFeedback.textContent='Voto registrado neste dispositivo. Obrigado por participar.';
}

let savedPollVote='';
try{
savedPollVote=localStorage.getItem(pollStorageKey)||'';
}catch(error){
savedPollVote='';
}

pollOptions.forEach(option=>{
option.setAttribute('aria-pressed','false');
option.addEventListener('click',()=>{
const vote=option.dataset.pollOption;
try{
localStorage.setItem(pollStorageKey,vote);
}catch(error){
// A votação continua funcionando durante a visita mesmo sem armazenamento local.
}
showPollVote(vote);
});
});

if(savedPollVote) showPollVote(savedPollVote);

const communityForm=document.getElementById('community-form');
if(communityForm){
communityForm.addEventListener('submit',event=>{
event.preventDefault();
const topic=document.getElementById('community-topic').value;
const message=document.getElementById('community-message').value.trim();
if(!topic||!message) return;
const whatsappText=`Olá, BeMEsportivo! Quero compartilhar ${topic} no Fala Bem:\n\n${message}`;
window.open(`https://wa.me/5511986366965?text=${encodeURIComponent(whatsappText)}`,'_blank','noopener,noreferrer');
});
}

document.querySelectorAll('.post[data-post-id]').forEach(post=>{
const postId=post.dataset.postId;
const reactionKey=`falaBemReaction:${postId}`;
const reactionButtons=post.querySelectorAll('.reaction-btn');
let savedReaction='';
try{
savedReaction=localStorage.getItem(reactionKey)||'';
}catch(error){
savedReaction='';
}

function selectReaction(reaction){
reactionButtons.forEach(button=>{
const selected=button.dataset.reaction===reaction;
button.classList.toggle('selected',selected);
button.setAttribute('aria-pressed',String(selected));
});
}

reactionButtons.forEach(button=>{
button.setAttribute('aria-pressed','false');
button.addEventListener('click',()=>{
const reaction=button.dataset.reaction;
try{
localStorage.setItem(reactionKey,reaction);
}catch(error){
// A reação permanece visível nesta visita caso o armazenamento esteja indisponível.
}
selectReaction(reaction);
});
});

if(savedReaction) selectReaction(savedReaction);

const shareButton=post.querySelector('.share-post');
if(shareButton){
shareButton.addEventListener('click',async()=>{
const title=post.querySelector('h3')?.textContent.trim()||document.title;
const url=`${window.location.href.split('#')[0]}#${post.id||'ideias'}`;
if(navigator.share){
try{
await navigator.share({title,text:'Veja esta conversa no Fala Bem:',url});
}catch(error){
return;
}
}else{
try{
await navigator.clipboard.writeText(url);
shareButton.textContent='Link copiado';
setTimeout(()=>{shareButton.textContent='Compartilhar';},1800);
}catch(error){
window.prompt('Copie o link para compartilhar:',url);
}
}
});
}
});

if(window.location.hash){
try{
const linkedPost=document.querySelector(window.location.hash);
if(linkedPost?.classList.contains('post')){
const fullText=linkedPost.querySelector('.full-text');
const readButton=linkedPost.querySelector('.read-toggle');
if(fullText&&readButton&&fullText.style.display!=='block'){
toggleTexto(fullText.id,readButton);
}
window.setTimeout(()=>linkedPost.scrollIntoView({behavior:'smooth',block:'start'}),120);
}
}catch(error){
// Ignora fragmentos que não correspondam a um seletor válido.
}
}

const topBtn=document.getElementById('backToTop');
window.addEventListener('scroll',()=>{
if(window.scrollY>450){
topBtn.classList.add('show');
}else{
topBtn.classList.remove('show');
}
});

topBtn.addEventListener('click',()=>{
window.scrollTo({top:0,behavior:'smooth'});
});
