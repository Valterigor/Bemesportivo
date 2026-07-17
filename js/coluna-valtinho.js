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
let activeFilter='';
let journeyStep=1;
const journeyState={objective:'',age:'',availability:''};

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
reminder:'Começar pequeno também é começar.'
},
saude:{
filter:'permanecer',
title:'Transforme movimento em parte da sua semana.',
summary:'Uma rotina sustentável pode melhorar disposição e bem-estar. Priorize regularidade, prazer e uma intensidade que permita continuar.',
start:'Escolha horários possíveis e uma prática que você goste.',
reminder:'Regularidade vale mais do que excesso.'
},
emagrecer:{
filter:'permanecer',
title:'Construa hábitos que possam acompanhar você.',
summary:'Movimento regular, alimentação equilibrada e metas realistas formam um caminho mais sustentável do que mudanças intensas e passageiras.',
start:'Escolha uma atividade prazerosa e organize uma semana possível.',
reminder:'Resultados duradouros começam com hábitos que você consegue manter.'
},
performance:{
filter:'evoluir',
title:'Evolua com método, recuperação e medida.',
summary:'Seu caminho pede um objetivo claro e acompanhamento do progresso. Treino, descanso e alimentação precisam trabalhar juntos.',
start:'Defina uma meta mensurável para as próximas quatro semanas.',
reminder:'Aumente apenas uma variável de cada vez.'
},
modalidade:{
filter:'comecar',
title:'Descubra pelo movimento, não apenas pela teoria.',
summary:'Experimente modalidades diferentes até encontrar uma combinação de ambiente, desafio e convivência que faça sentido para você.',
start:'Selecione duas modalidades e faça uma aula experimental.',
reminder:'O esporte certo é aquele que convida você a voltar.'
},
recuperacao:{
filter:'permanecer',
title:'Volte com calma e construa confiança novamente.',
summary:'Retomar é uma nova etapa. Reduza expectativas no início, observe as respostas do corpo e procure orientação profissional quando necessário.',
start:'Crie uma versão mais leve da prática que deseja retomar.',
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

function getJourneyField(step){
return step===1?'objective':step===2?'age':step===3?'availability':'';
}

function renderJourneyResult(){
const recommendation=journeyRecommendations[journeyState.objective];
const availability=journeyAvailability[journeyState.availability];
if(!recommendation||!availability) return;
document.getElementById('journey-result-title').textContent=recommendation.title;
document.getElementById('journey-result-summary').textContent=recommendation.summary;
document.getElementById('journey-result-start').textContent=recommendation.start;
document.getElementById('journey-result-rhythm').textContent=availability.rhythm;
let reminder=recommendation.reminder;
if(journeyState.age==='ate-17') reminder='Conte com a orientação de um responsável e de profissionais preparados.';
if(journeyState.age==='60-mais'&&journeyState.objective!=='performance') reminder='Respeite seu histórico e avance de forma gradual.';
document.getElementById('journey-result-reminder').textContent=reminder;
document.getElementById('journey-result-profile').textContent=`${journeyAgeLabels[journeyState.age]} · ${availability.label}`;
journeySeeContent.dataset.resultFilter=recommendation.filter;
window.dispatchEvent(new CustomEvent('meuCaminhoBe:profile-updated',{detail:{
objective:journeyState.objective,
age:journeyState.age,
ageLabel:journeyAgeLabels[journeyState.age],
availability:journeyState.availability,
availabilityLabel:availability.label,
title:recommendation.title,
summary:recommendation.summary,
nextAction:recommendation.start,
rhythm:availability.rhythm,
reminder,
filter:recommendation.filter
}}));
}

function renderJourneyStep(step,focusHeading=true){
journeyStep=Math.max(1,Math.min(4,step));
if(journeyStep===4) renderJourneyResult();
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
journeyNext.hidden=journeyStep===4;
journeyNext.disabled=field ? !journeyState[field] : true;
journeyNext.textContent=journeyStep===1?'Começar agora':'Continuar';
journeyStatus.textContent=journeyStep===4?'Trajetória concluída':`Etapa ${journeyStep} de 4`;
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
journeyNext.disabled=false;
});
});

if(journeyNext){
journeyNext.addEventListener('click',()=>{
const field=getJourneyField(journeyStep);
if(field&&!journeyState[field]) return;
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
Object.keys(journeyState).forEach(key=>{journeyState[key]='';});
journeyOptions.forEach(option=>{
option.classList.remove('selected');
option.setAttribute('aria-pressed','false');
});
renderJourneyStep(1);
});
}

if(journeyAssistant) renderJourneyStep(1,false);

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
const whatsappText=`Olá, BeMEsportivo! Quero compartilhar ${topic} no Meu Caminho Be:\n\n${message}`;
window.open(`https://wa.me/5511986366965?text=${encodeURIComponent(whatsappText)}`,'_blank','noopener,noreferrer');
});
}

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
description:'Uma referência simples da relação entre peso e altura.',
fields:[['peso','Peso (kg)','number','70','0.1'],['altura','Altura (cm)','number','170','0.1']],
calculate:data=>{
const height=Number(data.altura)/100;
const value=Number(data.peso)/(height*height);
const range=value<18.5?'abaixo da faixa de referência':value<25?'na faixa de referência':value<30?'acima da faixa de referência':'em uma faixa elevada';
return [`IMC ${value.toFixed(1)}`,`O resultado está ${range}. Use este número apenas como ponto de partida para uma avaliação individual.`];
}
},
pace:{
title:'Calculadora de pace',
description:'Descubra seu ritmo médio por quilômetro.',
fields:[['distancia','Distância (km)','number','5','0.01'],['minutos','Tempo — minutos','number','30','1'],['segundos','Segundos adicionais','number','0','1']],
calculate:data=>{
const pace=(Number(data.minutos)*60+Number(data.segundos))/Number(data.distancia);
const minutes=Math.floor(pace/60),seconds=Math.round(pace%60);
return [`${minutes}:${String(seconds).padStart(2,'0')} min/km`,`Este é o ritmo médio estimado para a distância informada.`];
}
},
calorias:{
title:'Estimativa de gasto calórico',
description:'Calcule uma referência aproximada para uma sessão de atividade.',
fields:[['peso','Peso (kg)','number','70','0.1'],['duracao','Duração (min)','number','30','1'],['intensidade','Intensidade','select','Moderada','']],
options:{intensidade:[['4','Leve'],['7','Moderada'],['10','Intensa']]},
calculate:data=>{
const kcal=Number(data.intensidade)*3.5*Number(data.peso)/200*Number(data.duracao);
return [`Aproximadamente ${Math.round(kcal)} kcal`,`O gasto real varia conforme atividade, condicionamento, composição corporal e intensidade.`];
}
},
agua:{
title:'Meta diária de água',
description:'Uma referência inicial de hidratação baseada no peso corporal.',
fields:[['peso','Peso (kg)','number','70','0.1']],
calculate:data=>{
const liters=Number(data.peso)*35/1000;
return [`Cerca de ${liters.toFixed(1)} litros/dia`,`Calor, duração do treino e suor podem aumentar essa necessidade.`];
}
},
cardiaca:{
title:'Zona cardíaca de treino',
description:'Estime uma faixa moderada usando a frequência cardíaca máxima prevista pela idade.',
fields:[['idade','Idade','number','35','1']],
calculate:data=>{
const maximum=220-Number(data.idade),low=Math.round(maximum*.6),high=Math.round(maximum*.8);
return [`${low} a ${high} bpm`,`Faixa aproximada entre 60% e 80% da frequência máxima estimada (${maximum} bpm).`];
}
},
proteina:{
title:'Referência diária de proteína',
description:'Estime uma faixa conforme seu peso e objetivo principal.',
fields:[['peso','Peso (kg)','number','70','0.1'],['objetivo','Objetivo','select','Saúde','']],
options:{objetivo:[['1.2','Saúde e rotina ativa'],['1.6','Evolução e força'],['2','Performance intensa']]},
calculate:data=>{
const grams=Math.round(Number(data.peso)*Number(data.objetivo));
return [`Cerca de ${grams} g/dia`,`Distribua a referência ao longo do dia e procure orientação nutricional para individualizar sua alimentação.`];
}
}
};

function openTool(toolKey){
const tool=toolDefinitions[toolKey];
if(!tool||!toolDialog||!toolForm) return;
toolDialogTitle.textContent=tool.title;
toolDialogDescription.textContent=tool.description;
toolResult.hidden=true;
toolResult.replaceChildren();
toolForm.replaceChildren(...tool.fields.map(([name,label,type,placeholder,step])=>{
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
field.min=step==='1'?'0':step==='0.01'?'0.01':'0.1';
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
const values=tool.calculate(data);
if(values.some(value=>String(value).includes('NaN')||String(value).includes('Infinity'))) return;
const strong=document.createElement('strong');
strong.textContent=values[0];
const detail=document.createElement('span');
detail.textContent=values[1];
toolResult.replaceChildren(strong,detail);
toolResult.hidden=false;
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

function openWhatsAppMessage(message){
window.open(`https://wa.me/5511986366965?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
}

document.getElementById('platform-question-form')?.addEventListener('submit',event=>{
event.preventDefault();
const question=document.getElementById('platform-question-input').value.trim();
if(question) openWhatsAppMessage(`Olá, BeMEsportivo! Minha pergunta para o Meu Caminho Be é:\n\n${question}`);
});

document.querySelectorAll('[data-community-topic]').forEach(button=>button.addEventListener('click',()=>{
openWhatsAppMessage(`Olá, BeMEsportivo! Quero conversar sobre ${button.dataset.communityTopic} no Meu Caminho Be.`);
}));

document.getElementById('platform-newsletter-form')?.addEventListener('submit',event=>{
event.preventDefault();
const name=document.getElementById('newsletter-name').value.trim();
const email=document.getElementById('newsletter-email').value.trim();
try{localStorage.setItem('bemNewsletterInterest',JSON.stringify({name,email,date:new Date().toISOString()}));}catch(error){}
document.getElementById('newsletter-feedback').textContent=`Obrigado, ${name}! Seu interesse foi registrado.`;
event.currentTarget.reset();
});

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
