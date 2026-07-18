document.addEventListener('keydown',event=>{
if(event.key==='Escape'&&modal?.classList.contains('show')) fechar();
if(event.key!=='Tab'||!modal?.classList.contains('show')) return;
const focusable=[...modalBox.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
if(!focusable.length) return;
const first=focusable[0];
const last=focusable[focusable.length-1];
if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});

const profissionais=[
{
nome:'Válter Igor',
categoria:'fotografia',
tipo:'Fotógrafo Esportivo',
especialidade:'Cobertura esportiva e branding para atletas.',
especialidades:['Fotografia de jogos','Cobertura de atletas','Branding esportivo'],
servicos:'Coberturas, ensaios esportivos e produção de imagem para atletas.',
foto:'img/profissionais/valter.jpg',
modo:'Presencial',
whatsapp:'5511986366965',
posicao:'center 34%'
},
{
nome:'Bruno Rezende',
categoria:'personal',
tipo:'Personal Trainer',
especialidade:'Treinamento funcional e performance.',
especialidades:['Treinamento funcional','Condicionamento físico','Performance'],
servicos:'Treinos orientados para condicionamento, funcional e evolução física.',
foto:'img/profissionais/bruno.jpg',
modo:'Online + Presencial',
whatsapp:'5511986366965',
posicao:'center 28%'
},
{
nome:'Luciano',
categoria:'personal',
tipo:'Personal Soccer',
especialidade:'Treinamento técnico e desenvolvimento.',
especialidades:['Técnica individual','Fundamentos do futebol','Desenvolvimento esportivo'],
servicos:'Sessões de fundamentos, técnica individual e desenvolvimento no futebol.',
foto:'img/profissionais/luciano.jpg',
modo:'Presencial',
whatsapp:'5511986366965',
posicao:'center 22%'
},
{
nome:'Grasiele',
categoria:'psicologia',
tipo:'Psicóloga Esportiva',
especialidade:'Performance mental e psicoterapia.',
especialidades:['Psicologia esportiva','Performance mental','Psicoterapia'],
servicos:'Acompanhamento psicológico e trabalho de aspectos mentais ligados ao esporte.',
foto:'img/profissionais/grasiele.jpg',
modo:'Online',
whatsapp:'5511986366965',
posicao:'center 35%'
}
];

const lista=document.getElementById('lista');
const busca=document.getElementById('busca');
let categoria='todos';

function render(items){
lista.innerHTML='';

items.forEach(p=>{
const card=document.createElement('div');
card.className='card';
card.innerHTML=`
<div class='card-cover' style='--photo-position:${p.posicao}'>
<span class='verify'>Perfil cadastrado</span>
<span class='mode-pill'>${p.modo}</span>
<img src='${p.foto}' alt='Foto de ${p.nome}' loading='lazy'>
</div>
<div class='card-body'>
<div class='category'>${p.tipo}</div>
<h3>${p.nome}</h3>
<p class='spec'>${p.especialidade}</p>
<div class='tags'>
<span>${p.modo}</span>
<span>${p.especialidades[0]}</span>
</div>
<div class='actions'>
<button class='btn btn-primary' onclick='perfil(${JSON.stringify(p)})'>Ver perfil</button>
<button class='btn btn-dark' onclick='whats(${JSON.stringify(p)})'>Solicitar horário</button>
</div>
</div>`;
lista.appendChild(card)
})
}

function aplicar(){
let termo=busca.value.toLowerCase();
let filtrados=profissionais.filter(p=>{
let okBusca=
p.nome.toLowerCase().includes(termo)||
p.tipo.toLowerCase().includes(termo)||
p.especialidades.join(' ').toLowerCase().includes(termo);

let okCat=
categoria==='todos'||p.categoria===categoria;

return okBusca && okCat;
});
render(filtrados)
}

function filtrarCategoria(cat,botao){
categoria=cat;
document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
botao.classList.add('active');
aplicar();
}

busca.addEventListener('keyup',aplicar);

const modal=document.getElementById('modal');
const modalBox=document.getElementById('modalBox');
let modalReturnFocus=null;

function perfil(p){
modalReturnFocus=document.activeElement;
modal.classList.add('show');
modal.setAttribute('aria-hidden','false');
const mensagem=`Olá, vi o perfil de ${p.nome} no Bem Esportivo e gostaria de conhecer o atendimento e solicitar um horário.`;
modalBox.innerHTML=`
<img src='${p.foto}' alt='Foto de ${p.nome}' style='--photo-position:${p.posicao}'>
<h3 id='professional-modal-title'>${p.nome}</h3>
<p><strong>${p.tipo}</strong></p>
<p>${p.especialidade}</p>
<p><strong>Áreas de atuação</strong></p>
<ul class='profile-specialties'>${p.especialidades.map(item=>`<li>${item}</li>`).join('')}</ul>
<p>${p.servicos}</p>
<p>Atendimento: <strong>${p.modo}</strong>.</p>
<p><small>A disponibilidade e os detalhes profissionais serão confirmados no contato. O Bem Esportivo não exibe horários sem validação do profissional.</small></p>
<div class='modal-actions'>
<a class='btn btn-primary' href='https://wa.me/${p.whatsapp}?text=${encodeURIComponent(mensagem)}' target='_blank' rel='noopener noreferrer'>Pedir informações</a>
</div>
<form class='profile-schedule'>
<strong>Solicitar um horário</strong>
<label>Dia preferido<input type='date' name='date' required></label>
<label>Período<select name='period' required><option value=''>Selecione</option><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label>
<button class='btn btn-dark' type='submit'>Enviar preferência</button>
<small>O pedido não confirma agendamento. O horário será validado no contato.</small>
</form>
<button class='close-modal' onclick='fechar()'>Fechar</button>`;
const scheduleForm=modalBox.querySelector('.profile-schedule');
const today=new Date();
const localDate=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
scheduleForm.elements.date.min=localDate;
scheduleForm.addEventListener('submit',event=>{
event.preventDefault();
const date=new Date(`${scheduleForm.elements.date.value}T12:00:00`);
const day=Number.isNaN(date.getTime())?scheduleForm.elements.date.value:date.toLocaleDateString('pt-BR');
whats(p,` Minha preferência é ${day}, no período da ${scheduleForm.elements.period.value.toLowerCase()}.`);
});
modalBox.querySelector('.close-modal')?.focus();
}

function whats(p,detalhes=''){
const mensagem=`Olá, vi o perfil de ${p.nome} no Bem Esportivo e gostaria de conhecer o atendimento e solicitar um horário.${detalhes}`;
window.open(`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(mensagem)}`,'_blank','noopener,noreferrer')
}

function fechar(){
modal.classList.remove('show')
modal.setAttribute('aria-hidden','true');
if(modalReturnFocus instanceof HTMLElement) modalReturnFocus.focus();
modalReturnFocus=null;
}

modal.onclick=e=>{
if(e.target===modal)fechar();
}

render(profissionais);

const topBtn=document.getElementById('topBtn');
window.addEventListener('scroll',()=>{
topBtn.style.display=window.scrollY>400?'block':'none';
});

topBtn.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
