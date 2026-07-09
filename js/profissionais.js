document.addEventListener('keydown',event=>{
if(event.key==='Escape'){
fechar();
}
});

const profissionais=[
{
nome:'Válter Igor',
categoria:'fotografia',
tipo:'Fotógrafo Esportivo',
especialidade:'Cobertura esportiva e branding para atletas.',
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
<span>Contato via WhatsApp</span>
</div>
<div class='actions'>
<button class='btn btn-primary' onclick='perfil(${JSON.stringify(p)})'>Ver perfil</button>
<button class='btn btn-dark' onclick='whats(${JSON.stringify(p)})'>Agendar</button>
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
p.tipo.toLowerCase().includes(termo);

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

function perfil(p){
modal.classList.add('show');
const mensagem='Olá, vi seu perfil no Bem Esportivo e gostaria de mais informações.';
modalBox.innerHTML=`
<img src='${p.foto}' alt='Foto de ${p.nome}' style='--photo-position:${p.posicao}'>
<h3>${p.nome}</h3>
<p><strong>${p.tipo}</strong></p>
<p>${p.especialidade}</p>
<p>Atendimento: <strong>${p.modo}</strong>.</p>
<div class='modal-actions'>
<a class='btn btn-primary' href='https://wa.me/${p.whatsapp}?text=${encodeURIComponent(mensagem)}' target='_blank' rel='noopener noreferrer'>Falar no WhatsApp</a>
</div>
<button class='close-modal' onclick='fechar()'>Fechar</button>`
}

function whats(p){
const mensagem='Olá, vi seu perfil no Bem Esportivo e gostaria de mais informações.';
window.open(`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(mensagem)}`,'_blank','noopener,noreferrer')
}

function fechar(){
modal.classList.remove('show')
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
