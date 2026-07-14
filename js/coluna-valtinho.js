function toggleTexto(id){
const el=document.getElementById(id);
el.style.display=el.style.display==='block'?'none':'block';
}

const posts=document.querySelectorAll('.post-item');
const filterButtons=document.querySelectorAll('button.filter-btn');
const search=document.getElementById('searchInput');
let activeFilter='';

function applyFilters(){
const term=search ? search.value.toLowerCase().trim() : '';
posts.forEach(post=>{
const text=post.innerText.toLowerCase();
const tags=post.dataset.tags;
const matchesSearch=term===''||text.includes(term);
const matchesFilter=activeFilter===''||tags.includes(activeFilter);
if(matchesSearch && matchesFilter){
post.classList.remove('hidden-search');
}else{
post.classList.add('hidden-search');
}
});
}

function filterPosts(tag){
activeFilter=tag;
filterButtons.forEach(btn=>{
btn.classList.remove('active');
if(btn.dataset.filter===tag){
btn.classList.add('active');
}
});
applyFilters();
window.scrollTo({top:520,behavior:'smooth'});
}

function resetAllFilters(){
activeFilter='';
filterButtons.forEach(btn=>btn.classList.remove('active'));
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
