const filters=document.querySelectorAll('.filter-btn');
const cards=document.querySelectorAll('.product');

filters.forEach(btn=>{
btn.addEventListener('click',()=>{
filters.forEach(b=>b.classList.remove('active'));
btn.classList.add('active');

let cat=btn.dataset.filter;

cards.forEach(card=>{
if(cat==='all' || card.dataset.category===cat){
card.classList.remove('hidden');
}else{
card.classList.add('hidden');
}
});
});
});

const search=document.getElementById('searchInput');
if(search){
search.addEventListener('keyup',function(){
let term=this.value.toLowerCase();

cards.forEach(card=>{
let text=card.innerText.toLowerCase();
card.style.display=text.includes(term)?'':'none';
})
})
}

const modal=document.getElementById('modal');
const imgModal=document.getElementById('imgModal');
const modalCategory=document.getElementById('modalCategory');
const modalTitle=document.getElementById('modalTitle');
const modalSummary=document.getElementById('modalSummary');
const modalBuy=document.getElementById('modalBuy');

function openProductDetails(card){
const image=card.querySelector('.card-media img');
const title=card.querySelector('h3')?.textContent.trim() || 'Produto';
const category=card.querySelector('.card-body p')?.textContent.trim() || 'Produto esportivo';
const summary=card.dataset.summary || 'Produto selecionado pela curadoria do Bem Esportivo.';
const buyLink=card.querySelector('.buy')?.href || '#';

imgModal.src=image?.src || '';
imgModal.alt=title;
modalCategory.textContent=category;
modalTitle.textContent=title;
modalSummary.textContent=summary;
modalBuy.href=buyLink;
modal.style.display='flex';
}

document.querySelectorAll('.card img').forEach(img=>{
img.onclick=()=>{
openProductDetails(img.closest('.product'));
}
});

document.querySelectorAll('.details').forEach(button=>{
button.addEventListener('click',()=>{
openProductDetails(button.closest('.product'));
});
});

document.querySelector('.fechar').onclick=()=>{
modal.style.display='none';
}

modal.onclick=e=>{
if(e.target===modal){
modal.style.display='none';
}
}

const topBtn=document.getElementById('topBtn');
window.addEventListener('scroll',()=>{
topBtn.style.display=window.scrollY>450?'block':'none';
})

topBtn.onclick=()=>{
window.scrollTo({top:0,behavior:'smooth'});
}
