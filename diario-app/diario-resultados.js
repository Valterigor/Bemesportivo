(function(root){
 'use strict';
 const shift=(date,days)=>{const value=new Date(date+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);};
 function calculate(records,today){
  const eligible=records.filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')&&r.date<=today);
  const days=new Set(eligible.map(r=>r.date)).size;
  const activities=eligible.filter(r=>typeof r.activity==='string'&&r.activity.trim());
  const minutes=activities.reduce((sum,r)=>sum+(Number.isFinite(Number(r.duration))&&Number(r.duration)>0?Number(r.duration):0),0);
  const week=Array.from({length:7},(_,i)=>{const date=shift(today,i-6);return {date,count:eligible.filter(r=>r.date===date).length};});
  const milestones=[
   {title:'O primeiro passo',description:'Seu primeiro momento guardado.',value:eligible.length,target:1,unit:'registro'},
   {title:'Três dias de histórias',description:'Momentos em 3 dias diferentes.',value:days,target:3,unit:'dias'},
   {title:'Uma semana de memórias',description:'Momentos em 7 dias diferentes.',value:days,target:7,unit:'dias'},
   {title:'Dez atividades na memória',description:'10 registros com atividade preenchida.',value:activities.length,target:10,unit:'atividades'},
   {title:'Uma hora registrada',description:'60 minutos informados em atividades.',value:minutes,target:60,unit:'minutos'}
  ].map(m=>({...m,achieved:m.value>=m.target}));
  return {records:eligible.length,days,activities:activities.length,minutes,week,milestones};
 }
 if(typeof module!=='undefined'&&module.exports){module.exports={calculate,shift};return;}
 const $=id=>document.getElementById(id);
 let saved=[],demo=false;
 const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const examples=()=>Array.from({length:8},(_,i)=>({date:shift(today,-Math.floor(i*.75)),activity:'Caminhada',duration:20}));
 function render(){
  const data=calculate(demo?examples():saved,today);
  $('progress-context').textContent=demo?'EXEMPLO ILUSTRATIVO · Dados fictícios, não salvos no seu diário.':'Resumo dos registros do seu diário, até hoje. Minutos contam apenas quando há uma atividade preenchida.';
  $('progress-demo').textContent=demo?'Voltar aos meus dados':'Ver exemplo';$('progress-demo').setAttribute('aria-pressed',String(demo));
  $('progress-stats').replaceChildren();
  for(const [label,value] of [['Registros',data.records],['Dias registrados',data.days],['Atividades anotadas',data.activities],['Minutos informados',data.minutes]]){const card=el('div');card.append(el('strong',value.toLocaleString('pt-BR')),el('span',label));$('progress-stats').append(card);}
  $('achievement-count').textContent=`${data.milestones.filter(m=>m.achieved).length} de ${data.milestones.length} marcos`;
  const ring=$('achievement-ring');if(ring){const count=data.milestones.filter(m=>m.achieved).length;ring.style.setProperty('--progress',`${count/data.milestones.length*360}deg`);ring.setAttribute('aria-label',`${count} de ${data.milestones.length} conquistas`);ring.firstElementChild.textContent=`${count}/${data.milestones.length}`;}
  $('progress-week').replaceChildren();const max=Math.max(1,...data.week.map(d=>d.count));
  data.week.forEach(day=>{const date=new Date(day.date+'T12:00:00');const label=date.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');const item=el('li');item.setAttribute('aria-label',`${date.toLocaleDateString('pt-BR')}: ${day.count} registros`);const track=el('div',undefined,'week-track');track.setAttribute('aria-hidden','true');const bar=el('span');bar.style.height=`${day.count/max*100}%`;track.append(bar);item.append(el('b',String(day.count)),track,el('small',label));$('progress-week').append(item);});
  $('progress-achievements').replaceChildren();
  data.milestones.forEach(m=>{const card=el('article',undefined,'achievement'+(m.achieved?' achieved':''));const icon=el('span',m.achieved?'✓':'○','achievement-icon');icon.setAttribute('aria-hidden','true');const content=el('div');content.append(el('strong',m.title),el('p',m.description));const state=el('small',m.achieved?'Conquistado':`${Math.min(m.value,m.target)} de ${m.target} ${m.unit}`);content.append(state);if(!m.achieved){const progress=el('progress');progress.max=m.target;progress.value=m.value;progress.setAttribute('aria-label',m.title);content.append(progress);}else if(!demo){const button=el('button','Criar post desta conquista');button.type='button';button.className='text-button';button.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('diary:share-achievement',{detail:{title:m.title,text:m.description}})));content.append(button);}card.append(icon,content);$('progress-achievements').append(card);});
 }
 window.addEventListener('diary:records',e=>{saved=e.detail;render();});
  $('progress-demo').addEventListener('click',()=>{demo=!demo;render();});
 render();
})(globalThis);
