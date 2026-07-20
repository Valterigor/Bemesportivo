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
if(willOpen&&post){
window.dispatchEvent(new CustomEvent('meuCaminhoBe:activity',{detail:{
type:'content',
key:post.dataset.postId||post.id||id,
label:post.querySelector('h3')?.textContent||'Conteúdo Meu Caminho Be'
}}));
}
}

const posts=document.querySelectorAll('.post-item');
const articlePosts=document.querySelectorAll('.article-grid .post-item');
const filterButtons=document.querySelectorAll('button.filter-btn');
const communityChannels=document.querySelectorAll('.community-channel');
const search=document.getElementById('searchInput');
const contentResults=document.getElementById('content-results');
const journeyGuidance=document.getElementById('journey-guidance');
const journeyContents=document.querySelectorAll('[data-journey-content]');
const journeyAssistant=document.getElementById('journey-assistant');
const journeyStages=document.querySelectorAll('[data-journey-step]');
const journeyIndicators=document.querySelectorAll('[data-step-indicator]');
const journeyOptions=document.querySelectorAll('.journey-option[data-journey-field]');
const journeyBack=document.getElementById('journey-back');
const journeyNext=document.getElementById('journey-next');
const journeyStatus=document.getElementById('journey-status');
const journeySeeContent=document.getElementById('journey-see-content');
const journeyRestart=document.getElementById('journey-restart');
const journeyNameInput=document.getElementById('journey-name');
const journeyPracticeName=document.getElementById('journey-practice-name');
const journeyPracticeDetail=document.getElementById('journey-practice-detail');
let activeFilter='';
let journeyStep=1;
const journeyState={name:'',objective:'',practice:'',practiceName:'',age:'',availability:''};

function updateJourneyGuidance(tag){
const hasGuidance=['comecar','evoluir','permanecer'].includes(tag);
if(journeyGuidance) journeyGuidance.hidden=!hasGuidance;
journeyContents.forEach(content=>{
content.hidden=!hasGuidance||content.dataset.journeyContent!==tag;
});
return hasGuidance;
}

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
const hasGuidance=updateJourneyGuidance(tag);
applyFilters();
const destination=hasGuidance ? journeyGuidance : document.getElementById('ideias');
if(destination) destination.scrollIntoView({behavior:'smooth',block:'start'});
}

function resetAllFilters(){
activeFilter='';
filterButtons.forEach(btn=>btn.classList.remove('active'));
communityChannels.forEach(channel=>channel.classList.toggle('active',channel.dataset.filter===''));
if(search) search.value='';
updateJourneyGuidance('');
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

const journeyRecommendations={
comecar:{
filter:'comecar',
title:'Comece leve, com confiança e curiosidade.',
summary:'Seu melhor caminho agora é experimentar uma prática simples, sem pressão por desempenho. O objetivo inicial é criar familiaridade e vontade de repetir.',
start:'Escolha uma atividade acessível e marque o primeiro dia.',
starts:{
'15':'Escolha uma prática simples e reserve 10 minutos para experimentá-la.',
'30':'Escolha uma prática acessível e marque uma primeira sessão de 20 minutos.',
'45':'Agende uma aula experimental ou uma sessão leve de até 40 minutos.'
},
rhythms:{
'15':'Comece com 2 blocos de 10 a 15 minutos na semana.',
'30':'Faça 2 a 3 sessões de 20 a 30 minutos, com intervalo entre elas.',
'45':'Faça 2 a 3 sessões completas e mantenha ao menos um dia leve entre estímulos.'
},
reminder:'Começar pequeno também é começar.'
},
saude:{
filter:'permanecer',
title:'Transforme movimento em parte da sua semana.',
summary:'Uma rotina sustentável pode melhorar disposição e bem-estar. Priorize regularidade, prazer e uma intensidade que permita continuar.',
start:'Escolha horários possíveis e uma prática que você goste.',
starts:{
'15':'Reserve dois blocos curtos da semana para caminhar, pedalar ou se movimentar.',
'30':'Escolha dois horários fixos e uma atividade em intensidade confortável.',
'45':'Monte uma semana com atividade aeróbica, força e espaço para recuperação.'
},
rhythms:{
'15':'Some blocos de 10 a 15 minutos e aumente quando a rotina estiver estável.',
'30':'Pratique 3 vezes por semana e mantenha intensidade que permita conversar.',
'45':'Alterne 3 a 4 sessões de força e atividade aeróbica ao longo da semana.'
},
reminder:'Regularidade vale mais do que excesso.'
},
emagrecer:{
filter:'permanecer',
title:'Construa hábitos que possam acompanhar você.',
summary:'Movimento regular, alimentação equilibrada e metas realistas formam um caminho mais sustentável do que mudanças intensas e passageiras.',
start:'Escolha uma atividade prazerosa e organize uma semana possível.',
starts:{
'15':'Faça um bloco ativo de 10 a 15 minutos e registre que conseguiu cumprir.',
'30':'Marque três sessões possíveis e comece pela atividade de que mais gosta.',
'45':'Combine uma sessão aeróbica com exercícios de força em dias alternados.'
},
rhythms:{
'15':'Repita 3 a 5 blocos curtos ao longo da semana.',
'30':'Busque 3 a 4 sessões semanais, alternando esforço e recuperação.',
'45':'Combine força e atividade aeróbica em 4 sessões, sem compensações extremas.'
},
reminder:'Resultados duradouros começam com hábitos que você consegue manter.'
},
performance:{
filter:'evoluir',
title:'Evolua com método, recuperação e medida.',
summary:'Seu caminho pede um objetivo claro e acompanhamento do progresso. Treino, descanso e alimentação precisam trabalhar juntos.',
start:'Defina uma meta mensurável para as próximas quatro semanas.',
starts:{
'15':'Escolha uma habilidade e faça um bloco técnico curto, registrando o resultado.',
'30':'Registre seu ponto de partida e execute uma sessão focada em uma única meta.',
'45':'Defina uma meta de quatro semanas e planeje treino, recuperação e aferição.'
},
rhythms:{
'15':'Use 3 a 4 blocos técnicos curtos e evite transformar todos em alta intensidade.',
'30':'Alterne 3 a 4 sessões focadas, com ao menos um dia de recuperação.',
'45':'Organize carga e recuperação em um ciclo semanal e revise os dados a cada 7 dias.'
},
reminder:'Aumente apenas uma variável de cada vez.'
},
modalidade:{
filter:'comecar',
title:'Descubra pelo movimento, não apenas pela teoria.',
summary:'Experimente modalidades diferentes até encontrar uma combinação de ambiente, desafio e convivência que faça sentido para você.',
start:'Selecione duas modalidades e faça uma aula experimental.',
starts:{
'15':'Liste duas modalidades próximas e assista ou experimente uma atividade curta.',
'30':'Marque uma experiência de 30 minutos em uma das duas modalidades escolhidas.',
'45':'Faça uma aula experimental completa e registre como se sentiu antes e depois.'
},
rhythms:{
'15':'Explore uma opção por semana, sem obrigação de decidir imediatamente.',
'30':'Teste cada modalidade ao menos duas vezes antes de comparar.',
'45':'Reserve uma sessão semanal para cada opção e escolha pela vontade de voltar.'
},
reminder:'O esporte certo é aquele que convida você a voltar.'
},
recuperacao:{
filter:'permanecer',
title:'Volte com calma e construa confiança novamente.',
summary:'Retomar é uma nova etapa. Reduza expectativas no início, observe as respostas do corpo e procure orientação profissional quando necessário.',
start:'Crie uma versão mais leve da prática que deseja retomar.',
starts:{
'15':'Teste por 10 minutos uma versão leve da prática e observe a resposta nas horas seguintes.',
'30':'Retome com metade da duração habitual e encerre se o movimento piorar sintomas.',
'45':'Planeje uma sessão controlada, com aquecimento e volume abaixo do que fazia antes.'
},
rhythms:{
'15':'Faça 2 retomadas curtas, separadas por tempo suficiente para observar o corpo.',
'30':'Comece com 2 a 3 sessões leves e só aumente após boa recuperação.',
'45':'Alterne sessões leves e descanso; progrida uma variável por semana.'
},
reminder:'Dor persistente é sinal para buscar avaliação profissional.'
}
};

const journeyAgeLabels={
'ate-17':'Até 17 anos',
'18-29':'18 a 29 anos',
'30-44':'30 a 44 anos',
'45-59':'45 a 59 anos',
'60-mais':'60 anos ou mais'
};

const journeyAvailability={
'15':{label:'Até 15 min',rhythm:'Blocos de 10 a 15 minutos, de 2 a 3 vezes por semana.'},
'30':{label:'Cerca de 30 min',rhythm:'Sessões de 20 a 30 minutos, de 3 a 4 vezes por semana.'},
'45':{label:'45 min ou mais',rhythm:'Sessões completas com dias de recuperação entre os estímulos.'}
};

const journeyPracticeLabels={
none:'Ainda não pratica',
returning:'Em retomada',
occasional:'Prática ocasional',
regular:'Prática frequente'
};

function getJourneyField(step){
return step===1?'name':step===2?'objective':step===3?'practice':step===4?'age':step===5?'availability':'';
}

function isJourneyStepComplete(step){
if(step===1) return journeyState.name.trim().length>=2;
if(step===3) return Boolean(journeyState.practice&&(journeyState.practice==='none'||journeyState.practiceName.trim().length>=2));
const field=getJourneyField(step);
return field ? Boolean(journeyState[field]) : false;
}

function updateJourneyNextState(){
if(!journeyNext) return;
journeyNext.disabled=!isJourneyStepComplete(journeyStep);
journeyNext.setAttribute('aria-disabled',String(journeyNext.disabled));
}

function resetJourneyForm(keepName=false){
const savedName=keepName?journeyState.name:'';
Object.keys(journeyState).forEach(key=>{journeyState[key]='';});
journeyState.name=savedName;
if(journeyNameInput) journeyNameInput.value=savedName;
if(journeyPracticeName){journeyPracticeName.value='';journeyPracticeName.required=false;}
if(journeyPracticeDetail) journeyPracticeDetail.hidden=true;
journeyOptions.forEach(option=>{
option.classList.remove('selected');
option.setAttribute('aria-pressed','false');
});
renderJourneyStep(1);
}

function loadJourneyAnswers(profile={}){
journeyState.name=String(profile.name||'').trim();
journeyState.objective=profile.objective||'';
journeyState.practice=profile.practice||(profile.practiceName?'regular':'');
journeyState.practiceName=String(profile.practiceName||'').trim();
journeyState.age=profile.age||'';
journeyState.availability=profile.availability||'';
if(journeyNameInput) journeyNameInput.value=journeyState.name;
if(journeyPracticeName){
journeyPracticeName.value=journeyState.practiceName;
journeyPracticeName.required=Boolean(journeyState.practice&&journeyState.practice!=='none');
}
if(journeyPracticeDetail) journeyPracticeDetail.hidden=!journeyPracticeName.required;
journeyOptions.forEach(option=>{
const selected=journeyState[option.dataset.journeyField]===option.dataset.journeyValue;
option.classList.toggle('selected',selected);
option.setAttribute('aria-pressed',String(selected));
});
renderJourneyStep(1);
}

function renderJourneyResult(){
const recommendation=journeyRecommendations[journeyState.objective];
const availability=journeyAvailability[journeyState.availability];
if(!recommendation||!availability) return;
const personalTitle=recommendation.title.charAt(0).toLocaleLowerCase('pt-BR')+recommendation.title.slice(1);
document.getElementById('journey-result-title').textContent=`${journeyState.name}, ${personalTitle}`;
let personalizedSummary=recommendation.summary;
let personalizedStart=recommendation.starts?.[journeyState.availability]||recommendation.start;
let personalizedRhythm=recommendation.rhythms?.[journeyState.availability]||availability.rhythm;
if(journeyState.practice==='none'&&journeyState.objective==='performance'){
personalizedSummary='Seu objetivo é evoluir, mas o primeiro ciclo precisa construir uma base segura e regular antes de buscar desempenho.';
personalizedStart=journeyRecommendations.comecar.starts[journeyState.availability];
personalizedRhythm=journeyRecommendations.comecar.rhythms[journeyState.availability];
}
if(journeyState.practice==='returning'){
personalizedStart=`Retome abaixo do ritmo que fazia antes. ${personalizedStart}`;
}
if(journeyState.practice==='occasional'){
personalizedRhythm=`Priorize dias fixos para ganhar regularidade. ${personalizedRhythm}`;
}
document.getElementById('journey-result-summary').textContent=personalizedSummary;
document.getElementById('journey-result-start').textContent=personalizedStart;
document.getElementById('journey-result-rhythm').textContent=personalizedRhythm;
let reminder=recommendation.reminder;
if(journeyState.age==='ate-17') reminder='Conte com a orientação de um responsável e de profissionais preparados.';
if(journeyState.age==='60-mais') reminder='Considere seu histórico de saúde, priorize adaptação gradual e busque orientação quando necessário.';
document.getElementById('journey-result-reminder').textContent=reminder;
const practiceLabel=journeyState.practiceName||journeyPracticeLabels[journeyState.practice];
document.getElementById('journey-result-profile').textContent=`${practiceLabel} · ${journeyAgeLabels[journeyState.age]} · ${availability.label}`;
journeySeeContent.dataset.resultFilter=recommendation.filter;
window.dispatchEvent(new CustomEvent('meuCaminhoBe:profile-updated',{detail:{
name:journeyState.name,
objective:journeyState.objective,
practice:journeyState.practice,
practiceLabel:journeyPracticeLabels[journeyState.practice],
practiceName:journeyState.practiceName,
age:journeyState.age,
ageLabel:journeyAgeLabels[journeyState.age],
availability:journeyState.availability,
availabilityLabel:availability.label,
title:recommendation.title,
summary:personalizedSummary,
nextAction:personalizedStart,
rhythm:personalizedRhythm,
reminder,
filter:recommendation.filter
}}));
}

function renderJourneyStep(step,focusHeading=true){
journeyStep=Math.max(1,Math.min(6,step));
if(journeyStep===6) renderJourneyResult();
journeyStages.forEach(stage=>{
stage.hidden=Number(stage.dataset.journeyStep)!==journeyStep;
});
journeyIndicators.forEach(indicator=>{
const indicatorStep=Number(indicator.dataset.stepIndicator);
indicator.classList.toggle('active',indicatorStep===journeyStep);
indicator.classList.toggle('complete',indicatorStep<journeyStep);
if(indicatorStep===journeyStep) indicator.setAttribute('aria-current','step');
else indicator.removeAttribute('aria-current');
});
const field=getJourneyField(journeyStep);
journeyBack.hidden=journeyStep===1;
journeyNext.hidden=journeyStep===6;
journeyNext.disabled=field ? !isJourneyStepComplete(journeyStep) : true;
journeyNext.setAttribute('aria-disabled',String(journeyNext.disabled));
journeyNext.textContent=journeyStep===5?'Ver meu caminho':'Continuar';
journeyStatus.textContent=journeyStep===6?'Trajetória concluída':`Etapa ${journeyStep} de 6`;
if(focusHeading){
const heading=document.querySelector(`[data-journey-step="${journeyStep}"] h3`);
if(heading){
heading.setAttribute('tabindex','-1');
heading.focus({preventScroll:true});
}
}
}

journeyOptions.forEach(option=>{
option.addEventListener('click',()=>{
const field=option.dataset.journeyField;
journeyState[field]=option.dataset.journeyValue;
document.querySelectorAll(`[data-journey-field="${field}"]`).forEach(candidate=>{
const selected=candidate===option;
candidate.classList.toggle('selected',selected);
candidate.setAttribute('aria-pressed',String(selected));
});
if(field==='practice'){
const needsPracticeName=journeyState.practice!=='none';
journeyPracticeDetail.hidden=!needsPracticeName;
journeyPracticeName.required=needsPracticeName;
if(!needsPracticeName){
journeyPracticeName.value='';
journeyState.practiceName='';
}
}
updateJourneyNextState();
if(field==='age'&&journeyStep===4){
journeyStatus.textContent='Faixa etária registrada. Você já pode continuar.';
}
});
});

if(journeyNameInput){
journeyNameInput.addEventListener('input',()=>{
journeyState.name=journeyNameInput.value.trim();
updateJourneyNextState();
});
}

if(journeyPracticeName){
journeyPracticeName.addEventListener('input',()=>{
journeyState.practiceName=journeyPracticeName.value.trim();
updateJourneyNextState();
});
}

if(journeyNext){
journeyNext.addEventListener('click',()=>{
const field=getJourneyField(journeyStep);
if(field&&!isJourneyStepComplete(journeyStep)) return;
if(journeyStep===1){
window.dispatchEvent(new CustomEvent('meuCaminhoBe:identity-captured',{detail:{name:journeyState.name}}));
}
renderJourneyStep(journeyStep+1);
});
}

if(journeyBack){
journeyBack.addEventListener('click',()=>renderJourneyStep(journeyStep-1));
}

if(journeySeeContent){
journeySeeContent.addEventListener('click',()=>filterPosts(journeySeeContent.dataset.resultFilter||''));
}

if(journeyRestart){
journeyRestart.addEventListener('click',()=>{
renderJourneyStep(1);
});
}

window.addEventListener('meuCaminhoBe:reset',()=>resetJourneyForm(false));
window.addEventListener('meuCaminhoBe:edit-onboarding',event=>loadJourneyAnswers(event.detail||{}));

if(journeyAssistant) renderJourneyStep(1,false);

const pollOptions=document.querySelectorAll('.poll-option');
const pollFeedback=document.getElementById('poll-feedback');
const pollStorageKey='falaBemWeeklyPollRoutine';
const pathCommunityApi=location.protocol==='file:'?'':'/api/community';
const pathCommunityScope='path';
const pathCommunityId='meu-caminho-be';

function getPathCommunityClientId(){
try{
let id=localStorage.getItem('bemEsportivoCommunityClientId');
if(!id){
id=window.crypto?.randomUUID?window.crypto.randomUUID():`be-${Date.now()}-${Math.random().toString(16).slice(2)}`;
localStorage.setItem('bemEsportivoCommunityClientId',id);
}
return id;
}catch(error){return `be-${Date.now()}-${Math.random().toString(16).slice(2)}`;}
}

function getPathProfileName(){
try{return String(JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1')||'null')?.name||localStorage.getItem('meuCaminhoBeCommunityName')||'').trim().slice(0,40);}catch(error){return '';}
}

async function pathCommunityRequest(path,options={}){
if(!pathCommunityApi) throw new Error('Comunidade indisponível em arquivo local.');
const response=await fetch(`${pathCommunityApi}${path}`,{headers:{'Content-Type':'application/json',...(options.headers||{})},cache:'no-store',...options});
const payload=await response.json();
if(!response.ok||payload?.ok===false) throw new Error(payload?.error||'Não foi possível acessar a comunidade.');
return payload;
}

function formatCommunityDate(value){
const date=new Date(value||Date.now());
return Number.isNaN(date.getTime())?'':date.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

function createCommunityReply(reply){
const item=document.createElement('article');
const author=document.createElement('strong');
const text=document.createElement('p');
author.textContent=reply.name||'Visitante';
text.textContent=reply.text||'';
item.className='community-feed-reply';
item.append(author,text);
return item;
}

function renderPathCommunity(comments){
const list=document.getElementById('community-feed-list');
if(!list) return;
if(!comments?.length){list.innerHTML='<span>Ainda não há conversas. Publique a primeira pergunta ou experiência.</span>';return;}
list.replaceChildren(...[...comments].reverse().map(comment=>{
const item=document.createElement('article');
const header=document.createElement('header');
const author=document.createElement('strong');
const topic=document.createElement('span');
const text=document.createElement('p');
const time=document.createElement('time');
const replies=document.createElement('div');
const replyForm=document.createElement('form');
const replyLabel=document.createElement('label');
const replyInput=document.createElement('input');
const replyButton=document.createElement('button');
item.className='community-feed-item';
author.textContent=comment.name||'Visitante';
topic.textContent=comment.team||'Conversa';
text.textContent=comment.text||'';
time.dateTime=comment.createdAt||'';
time.textContent=formatCommunityDate(comment.createdAt);
header.append(author,topic);
replies.className='community-feed-replies';
(comment.replies||[]).forEach(reply=>replies.append(createCommunityReply(reply)));
replies.hidden=!comment.replies?.length;
replyForm.className='community-reply-form';
replyLabel.className='sr-only';
replyLabel.textContent=`Responder a ${comment.name||'esta conversa'}`;
replyInput.id=`community-reply-${comment.id}`;
replyLabel.htmlFor=replyInput.id;
replyInput.maxLength=400;
replyInput.placeholder='Escreva uma resposta';
replyInput.required=true;
replyButton.type='submit';
replyButton.textContent='Responder';
replyForm.append(replyLabel,replyInput,replyButton);
replyForm.addEventListener('submit',async event=>{
event.preventDefault();
const replyText=replyInput.value.trim();
if(!replyText) return;
replyButton.disabled=true;
replyButton.textContent='Enviando...';
try{
const payload=await pathCommunityRequest('/comment-action',{method:'POST',body:JSON.stringify({scope:pathCommunityScope,id:pathCommunityId,commentId:comment.id,action:'reply',clientId:getPathCommunityClientId(),name:getPathProfileName()||'Visitante',text:replyText})});
renderPathCommunity(payload.comments||[]);
window.dispatchEvent(new CustomEvent('meuCaminhoBe:activity',{detail:{type:'community',key:`reply:${comment.id}`,label:'Resposta na comunidade'}}));
}catch(error){replyButton.textContent='Tentar novamente';replyButton.disabled=false;}
});
item.append(header,text,time,replies,replyForm);
return item;
}));
}

async function loadPathCommunity(){
const list=document.getElementById('community-feed-list');
try{
const payload=await pathCommunityRequest(`/comments?scope=${encodeURIComponent(pathCommunityScope)}&id=${encodeURIComponent(pathCommunityId)}`);
renderPathCommunity(payload.comments||[]);
}catch(error){if(list) list.innerHTML='<span>Não foi possível carregar as conversas agora.</span>';}
}

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
option.addEventListener('click',async()=>{
const vote=option.dataset.pollOption;
try{
localStorage.setItem(pollStorageKey,vote);
}catch(error){
// A votação continua funcionando durante a visita mesmo sem armazenamento local.
}
showPollVote(vote);
try{
await pathCommunityRequest('/vote',{method:'POST',body:JSON.stringify({pollId:'meu-caminho-be-rotina',choiceId:vote,clientId:getPathCommunityClientId()})});
if(pollFeedback) pollFeedback.textContent='Voto registrado para toda a comunidade. Obrigado por participar.';
}catch(error){if(pollFeedback) pollFeedback.textContent='Voto salvo neste aparelho. A sincronização global está indisponível agora.';}
});
});

if(savedPollVote) showPollVote(savedPollVote);

const communityForm=document.getElementById('community-form');
if(communityForm){
const communityName=document.getElementById('community-name');
if(communityName&&!communityName.value) communityName.value=getPathProfileName();
communityForm.addEventListener('submit',async event=>{
event.preventDefault();
const topic=document.getElementById('community-topic').value;
const message=document.getElementById('community-message').value.trim();
const name=communityName?.value.trim();
const status=document.getElementById('community-form-status');
const button=communityForm.querySelector('button[type="submit"]');
if(!topic||!message||!name){communityForm.reportValidity();return;}
button.disabled=true;
button.textContent='Publicando...';
if(status) status.textContent='';
try{
try{localStorage.setItem('meuCaminhoBeCommunityName',name);}catch(storageError){}
const payload=await pathCommunityRequest('/comment',{method:'POST',body:JSON.stringify({scope:pathCommunityScope,id:pathCommunityId,name,team:topic,text:message,clientId:getPathCommunityClientId()})});
renderPathCommunity(payload.comments||[]);
document.getElementById('community-topic').value='';
document.getElementById('community-message').value='';
if(status) status.textContent='Mensagem publicada para todos os visitantes.';
window.dispatchEvent(new CustomEvent('meuCaminhoBe:activity',{detail:{type:'community',key:payload.comment?.id||topic,label:'Participação na comunidade'}}));
}catch(error){if(status) status.textContent='Não foi possível publicar agora. Tente novamente em alguns instantes.';}
finally{button.disabled=false;button.textContent='Publicar na comunidade';}
});
}

document.getElementById('community-feed-refresh')?.addEventListener('click',loadPathCommunity);
loadPathCommunity();
const refreshPathCommunity=()=>{
if(!document.hidden) loadPathCommunity();
};
window.setInterval(refreshPathCommunity,30000);
document.addEventListener('visibilitychange',refreshPathCommunity);
window.addEventListener('focus',refreshPathCommunity);
window.addEventListener('online',refreshPathCommunity);

const falaVideoPlay=document.getElementById('fala-video-play');
const falaVideoPlayer=document.getElementById('fala-video-player');
if(falaVideoPlay&&falaVideoPlayer){
const setFalaVideoState=(playing,label)=>{
falaVideoPlay.classList.toggle('is-playing',playing);
falaVideoPlay.setAttribute('aria-pressed',String(playing));
falaVideoPlay.setAttribute('aria-label',label);
};
falaVideoPlay.addEventListener('click',async()=>{
falaVideoPlayer.controls=true;
falaVideoPlayer.defaultMuted=false;
falaVideoPlayer.muted=false;
falaVideoPlayer.volume=1;
if(falaVideoPlayer.readyState===0) falaVideoPlayer.load();
falaVideoPlayer.scrollIntoView({behavior:'smooth',block:'center'});
try{
await falaVideoPlayer.play();
setFalaVideoState(true,'Vídeo institucional em reprodução');
}catch(error){
setFalaVideoState(false,'Reproduzir filme institucional com som');
falaVideoPlayer.focus();
}
});
falaVideoPlayer.addEventListener('play',()=>setFalaVideoState(true,'Vídeo institucional em reprodução'));
falaVideoPlayer.addEventListener('pause',()=>{
if(!falaVideoPlayer.ended) setFalaVideoState(false,'Continuar filme institucional com som');
});
falaVideoPlayer.addEventListener('ended',()=>setFalaVideoState(false,'Assistir novamente ao filme institucional com som'));
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
await navigator.share({title,text:'Veja esta conversa no Meu Caminho Be:',url});
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

const platformTargets=document.querySelectorAll('[data-platform-target]');
platformTargets.forEach(button=>{
button.addEventListener('click',()=>{
if(window.falaBemOpenTarget?.(button.dataset.platformTarget)) return;
const destination=document.getElementById(button.dataset.platformTarget);
if(destination) destination.scrollIntoView({behavior:'smooth',block:'start'});
});
});

const toolDialog=document.getElementById('tool-dialog');
const toolDialogTitle=document.getElementById('tool-dialog-title');
const toolDialogDescription=document.getElementById('tool-dialog-description');
const toolForm=document.getElementById('tool-form');
const toolResult=document.getElementById('tool-result');
const toolDefinitions={
imc:{
title:'Calculadora de IMC',
description:'Referência de triagem para adultos; não mede composição corporal nem define saúde.',
source:['Critérios de IMC para adultos — OMS','https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight'],
fields:[['idade','Idade (uso adulto)','number','30','1','20','120'],['peso','Peso (kg)','number','70','0.1','20','350'],['altura','Altura (cm)','number','170','0.1','100','230']],
calculate:data=>{
const height=Number(data.altura)/100;
const value=Number(data.peso)/(height*height);
const range=value<18.5?'abaixo da faixa de referência':value<25?'na faixa de referência':value<30?'acima da faixa de referência':'em uma faixa elevada';
return {headline:`IMC ${value.toFixed(1)}`,detail:`Para adultos, o resultado está ${range}. Atletas, idosos e diferentes composições corporais exigem interpretação individual.`,caution:'Não utilizar esta classificação para menores de 20 anos ou durante a gestação.'};
}
},
pace:{
title:'Calculadora de pace',
description:'Descubra seu ritmo médio por quilômetro.',
source:['Cálculo matemático de ritmo médio','https://worldathletics.org/about-iaaf/documents/technical-information'],
fields:[['distancia','Distância (km)','number','5','0.01','0.1','500'],['minutos','Tempo — minutos','number','30','1','0','10000'],['segundos','Segundos adicionais','number','0','1','0','59']],
calculate:data=>{
const pace=(Number(data.minutos)*60+Number(data.segundos))/Number(data.distancia);
const minutes=Math.floor(pace/60),seconds=Math.round(pace%60);
return {headline:`${minutes}:${String(seconds).padStart(2,'0')} min/km`,detail:'Ritmo médio da distância informada. Variações de terreno, clima e percurso não aparecem neste cálculo.'};
}
},
calorias:{
title:'Estimativa de gasto calórico',
description:'Estime uma faixa usando o tipo de atividade e valores metabólicos de referência.',
source:['Compendium of Physical Activities','https://pacompendium.com/'],
fields:[['peso','Peso (kg)','number','70','0.1','20','350'],['duracao','Duração (min)','number','30','1','1','600'],['intensidade','Atividade aproximada','select','','']],
options:{intensidade:[['3.5','Caminhada confortável'],['5','Treino de força geral'],['6.8','Bicicleta moderada'],['8','Corrida leve'],['10','Atividade vigorosa']]},
calculate:data=>{
const kcal=Number(data.intensidade)*3.5*Number(data.peso)/200*Number(data.duracao);
const margin=Math.round(kcal*.2);
return {headline:`Cerca de ${Math.max(0,Math.round(kcal)-margin)} a ${Math.round(kcal)+margin} kcal`,detail:'Faixa educativa com margem de 20%. O gasto real varia com técnica, condicionamento, composição corporal e intensidade.'};
}
},
agua:{
title:'Faixa inicial de hidratação',
description:'Uma faixa educativa para organizar a rotina, nunca uma prescrição individual.',
source:['Referências de ingestão de água — National Academies','https://nap.nationalacademies.org/catalog/10925/dietary-reference-intakes-for-water-potassium-sodium-chloride-and-sulfate'],
fields:[['peso','Peso (kg)','number','70','0.1','20','350']],
calculate:data=>{
const low=Number(data.peso)*30/1000,high=Number(data.peso)*35/1000;
return {headline:`Faixa inicial de ${low.toFixed(1)} a ${high.toFixed(1)} litros/dia`,detail:'Inclui uma referência geral para líquidos. Calor, suor, alimentação e duração do treino alteram a necessidade.',caution:'Doenças cardíacas, renais ou orientação de restrição hídrica exigem acompanhamento profissional.'};
}
},
cardiaca:{
title:'Zona cardíaca de treino',
description:'Estime uma faixa moderada; relógios e fórmulas não substituem avaliação clínica.',
source:['Equação de frequência máxima de Tanaka et al.','https://pubmed.ncbi.nlm.nih.gov/11153730/'],
fields:[['idade','Idade (uso adulto)','number','35','1','20','100']],
calculate:data=>{
const maximum=Math.round(208-.7*Number(data.idade)),low=Math.round(maximum*.64),high=Math.round(maximum*.76);
return {headline:`Faixa moderada estimada: ${low} a ${high} bpm`,detail:`Cálculo populacional com frequência máxima prevista de ${maximum} bpm. A resposta individual pode ser diferente.`,caution:'Sintomas, uso de medicamentos cardíacos ou condições clínicas exigem orientação profissional.'};
}
},
proteina:{
title:'Referência diária de proteína',
description:'Estime uma faixa para adultos fisicamente ativos conforme o objetivo.',
source:['Position stand sobre proteína e exercício — ISSN','https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/'],
fields:[['peso','Peso (kg)','number','70','0.1','20','350'],['objetivo','Objetivo','select','','']],
options:{objetivo:[['1.0-1.2','Saúde e rotina ativa'],['1.4-1.8','Evolução e força'],['1.6-2.0','Performance intensa']]},
calculate:data=>{
const [low,high]=String(data.objetivo).split('-').map(Number);
return {headline:`Faixa de ${Math.round(Number(data.peso)*low)} a ${Math.round(Number(data.peso)*high)} g/dia`,detail:'Referência geral para adultos ativos. Alimentação total, objetivo, tolerância e treino precisam ser considerados.',caution:'Doença renal, gestação, adolescência ou necessidades clínicas exigem nutricionista ou equipe de saúde.'};
}
}
};

const toolGuidance={
imc:{meaning:'É uma referência de triagem populacional, não uma avaliação de composição corporal ou diagnóstico.',next:'Observe o resultado junto de hábitos, medidas e contexto de saúde; evite decisões isoladas.',content:'saude',professional:'Nutricionista ou profissional de saúde'},
pace:{meaning:'Mostra o tempo médio necessário para percorrer um quilômetro no percurso informado.',next:'Repita a medição em condições parecidas e acompanhe tendência, esforço percebido e recuperação.',content:'evoluir',professional:'Treinador ou profissional de Educação Física'},
calorias:{meaning:'É uma faixa aproximada baseada em valores metabólicos médios, não o gasto exato do seu corpo.',next:'Use a estimativa para compreender a atividade, sem compensar alimentação ou treino apenas por calorias.',content:'saude',professional:'Nutricionista esportivo'},
agua:{meaning:'É um ponto de partida geral; suor, clima, alimentação, treino e saúde alteram a necessidade.',next:'Observe sede, cor da urina e condições do treino; ajuste com orientação em situações especiais.',content:'saude',professional:'Nutricionista ou profissional de saúde'},
cardiaca:{meaning:'É uma estimativa populacional de intensidade moderada, e não a sua frequência máxima medida.',next:'Compare a faixa com percepção de esforço e interrompa diante de sintomas incomuns.',content:'evoluir',professional:'Profissional de Educação Física ou médico do esporte'},
proteina:{meaning:'É uma faixa educativa para adultos ativos; distribuição e alimentação total também importam.',next:'Planeje fontes de proteína ao longo do dia e individualize necessidades com acompanhamento.',content:'saude',professional:'Nutricionista esportivo'}
};

function openTool(toolKey){
const tool=toolDefinitions[toolKey];
if(!tool||!toolDialog||!toolForm) return;
toolDialogTitle.textContent=tool.title;
toolDialogDescription.textContent=tool.description;
toolResult.hidden=true;
toolResult.replaceChildren();
toolForm.replaceChildren(...tool.fields.map(([name,label,type,placeholder,step,min,max])=>{
const wrapper=document.createElement('label');
wrapper.append(document.createTextNode(label));
let field;
if(type==='select'){
field=document.createElement('select');
(tool.options[name]||[]).forEach(([value,text])=>field.add(new Option(text,value)));
}else{
field=document.createElement('input');
field.type=type;
field.placeholder=placeholder;
field.step=step;
if(min!==undefined) field.min=min;
if(max!==undefined) field.max=max;
}
field.name=name;
field.required=true;
wrapper.append(field);
return wrapper;
}),(()=>{
const submit=document.createElement('button');
submit.type='submit';
submit.textContent='Calcular';
return submit;
})());
toolForm.onsubmit=event=>{
event.preventDefault();
const data=Object.fromEntries(new FormData(toolForm));
const result=tool.calculate(data);
const guidance=toolGuidance[toolKey];
const recommendationContext=window.falaBemGetRecommendationContext?.();
const values=[result.headline,result.detail,result.caution];
if(values.some(value=>String(value||'').includes('NaN')||String(value||'').includes('Infinity'))) return;
const strong=document.createElement('strong');
strong.textContent=result.headline;
const detail=document.createElement('span');
detail.textContent=result.detail;
const resultLabel=document.createElement('span');
resultLabel.className='tool-result-kicker';
resultLabel.textContent='SEU RESULTADO';
const output=[resultLabel,strong,detail];
if(guidance){
const meaning=document.createElement('div');
meaning.className='tool-result-guidance';
const meaningTitle=document.createElement('b');
meaningTitle.textContent='O que significa';
const meaningText=document.createElement('span');
meaningText.textContent=guidance.meaning;
const nextTitle=document.createElement('b');
nextTitle.textContent='Próximo passo';
const nextText=document.createElement('span');
nextText.textContent=guidance.next;
meaning.append(meaningTitle,meaningText,nextTitle,nextText);
output.push(meaning);
}
if(result.caution){
const caution=document.createElement('small');
caution.className='tool-result-caution';
caution.textContent=result.caution;
output.push(caution);
}
if(tool.source){
const source=document.createElement('a');
source.href=tool.source[1];
source.target='_blank';
source.rel='noopener noreferrer';
source.textContent=`Metodologia: ${tool.source[0]} →`;
output.push(source);
}
if(guidance){
const actions=document.createElement('div');
actions.className='tool-result-actions';
const content=document.createElement('button');
const professional=document.createElement('button');
content.type='button';
professional.type='button';
content.textContent=recommendationContext?.contentTitle?`Ver: ${recommendationContext.contentTitle}`:'Ver conteúdo recomendado';
professional.textContent=`Ver ${recommendationContext?.professionalTitle||guidance.professional}`;
content.addEventListener('click',()=>{
toolDialog.close();
window.falaBemOpenView?.('conteudos');
if(typeof filterPosts==='function') window.setTimeout(()=>filterPosts(recommendationContext?.contentTag||guidance.content),120);
});
professional.addEventListener('click',()=>{
toolDialog.close();
window.falaBemOpenView?.('especialistas');
});
actions.append(content,professional);
output.push(actions);
}
toolResult.replaceChildren(...output);
toolResult.hidden=false;
window.dispatchEvent(new CustomEvent('meuCaminhoBe:activity',{detail:{type:'tool',key:toolKey,label:tool.title,result:result.headline}}));
};
toolDialog.showModal();
}

document.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>openTool(button.dataset.tool)));
document.getElementById('tool-dialog-close')?.addEventListener('click',()=>toolDialog.close());
toolDialog?.addEventListener('click',event=>{if(event.target===toolDialog) toolDialog.close();});

document.querySelectorAll('[data-modality]').forEach(button=>{
button.addEventListener('click',()=>{
const modalityOption=document.querySelector('[data-journey-field="objective"][data-journey-value="modalidade"]');
if(modalityOption) modalityOption.click();
document.getElementById('minha-jornada')?.scrollIntoView({behavior:'smooth',block:'start'});
});
});

const discoveryDialog=document.getElementById('discovery-dialog');
const discoveryDialogTitle=document.getElementById('discovery-dialog-title');
const discoveryDialogContent=document.getElementById('discovery-dialog-content');
document.querySelectorAll('[data-discovery-filter]').forEach((button,index)=>{
button.addEventListener('click',()=>{
const sourcePosts=document.querySelectorAll('.article-grid .post');
const source=Array.from(sourcePosts).find(post=>(post.dataset.tags||'').includes(button.dataset.discoveryFilter))||sourcePosts[index];
if(!source||!discoveryDialog) return;
discoveryDialogTitle.textContent=source.querySelector('h3')?.textContent||'Conteúdo Meu Caminho Be';
const paragraphs=source.querySelectorAll('.full-text p');
discoveryDialogContent.replaceChildren(...Array.from(paragraphs).map(paragraph=>{
const copy=document.createElement('p');
copy.textContent=paragraph.textContent;
return copy;
}));
discoveryDialog.showModal();
});
});
document.getElementById('discovery-dialog-close')?.addEventListener('click',()=>discoveryDialog.close());
discoveryDialog?.addEventListener('click',event=>{if(event.target===discoveryDialog) discoveryDialog.close();});

document.getElementById('platform-question-form')?.addEventListener('submit',event=>{
event.preventDefault();
const question=document.getElementById('platform-question-input').value.trim();
if(!question) return;
const topic=document.getElementById('community-topic');
const message=document.getElementById('community-message');
if(topic) topic.value='uma dúvida';
if(message) message.value=question;
document.getElementById('community-name').value=getPathProfileName()||document.getElementById('community-name').value;
document.getElementById('participe')?.scrollIntoView({behavior:'smooth',block:'start'});
window.setTimeout(()=>document.getElementById('community-name')?.focus(),320);
});

document.querySelectorAll('[data-community-topic]').forEach(button=>button.addEventListener('click',()=>{
const topic=document.getElementById('community-topic');
if(topic) topic.value=button.dataset.communityTopic;
document.getElementById('participe')?.scrollIntoView({behavior:'smooth',block:'start'});
window.setTimeout(()=>document.getElementById('community-message')?.focus(),320);
}));


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
