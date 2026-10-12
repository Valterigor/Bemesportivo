(() => {
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
const roundedPace=Math.round(pace);
const minutes=Math.floor(roundedPace/60),seconds=roundedPace%60;
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
if (window.falaBemOpenView) window.falaBemOpenView('conteudos');
else location.href='/meu-caminho-be?tela=conteudos';
if(typeof filterPosts==='function') window.setTimeout(()=>filterPosts(recommendationContext?.contentTag||guidance.content),120);
});
professional.addEventListener('click',()=>{
toolDialog.close();
if (window.falaBemOpenView) window.falaBemOpenView('especialistas');
else location.href='/profissionais';
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

window.BeTools = { open: openTool };
})();
