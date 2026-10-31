(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 let owner;try{owner=JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1')||'null');}catch{}
 if(!owner?.name?.trim()){location.replace('/meu-caminho-be');return;}
 const ownerKey=String(owner.identityCreatedAt||owner.createdAt||owner.name);
 const today = new Date();
 const localDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 let records=[], entryPhoto='', db, toastTimer;
 const profileName=()=>{try{return JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1')||'{}').name||'';}catch{return '';}};
 const notify=text=>{clearTimeout(toastTimer);$('status').textContent=text;toastTimer=setTimeout(()=>$('status').textContent='',9000);};
 const dateLabel=value=>new Date(value+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
 const show=tab=>{
  const crumb=document.querySelector('.dashboard-bar b');if(crumb)crumb.textContent='/ '+({today:'Visão geral',records:'Meus registros',post:'Criar arte'}[tab]);
  document.querySelectorAll('.panel').forEach(el=>el.hidden=el.id!==tab);
  document.querySelectorAll('nav [data-tab]').forEach(el=>{if(el.dataset.tab===tab)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  window.scrollTo({top:0,behavior:'instant'});
 };
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.tab)));
 function identity(){const name=profileName().trim().split(' ')[0];$('greeting').textContent=name?`${name}, o que vale guardar hoje?`:'O que vale guardar hoje?';}
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='diary-preview-ready')identity();});
 identity();
 $('today-date').textContent=today.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();
 $('entry-date').value=localDate;
 function openDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('be-diary-dashboard-v1:'+ownerKey,1);request.onupgradeneeded=()=>{request.result.createObjectStore('records',{keyPath:'id'});request.result.createObjectStore('imports',{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
 async function importHistory(){
  let stored=[];try{const value=JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1')||'[]');if(Array.isArray(value))stored=value;}catch{}
  const types={corrida:'Corrida',treino:'Treino',jogo:'Jogo',caminhada:'Caminhada',ciclismo:'Ciclismo',natacao:'Natação',outro:'Atividade',musculacao:'Musculação',funcional:'Funcional'};
  const ids=new Set(stored.map(r=>String(r.id)));
  for(const log of owner.dailyLogs||[]){const id='legacy-'+log.date;if(!ids.has(id)&&log.activity&&log.activity!=='none'&&Number(log.minutes)>0)stored.push({...log,id,type:log.activity,duration:log.minutes});}
  const seen=await new Promise((resolve,reject)=>{const request=db.transaction('imports').objectStore('imports').getAllKeys();request.onsuccess=()=>resolve(new Set(request.result));request.onerror=()=>reject(request.error);});
  const incoming=stored.filter(r=>r.id&&!seen.has(String(r.id))&&/^\d{4}-\d{2}-\d{2}$/.test(r.date||''));
  if(!incoming.length)return;
  await new Promise((resolve,reject)=>{const tx=db.transaction(['records','imports'],'readwrite');for(const r of incoming){const id=String(r.id);tx.objectStore('records').put({id:'imported:'+id,date:r.date,title:String(r.title||types[r.type]||'Meu registro'),note:String(r.note||''),activity:types[r.type]||String(r.type||'Atividade'),duration:Number(r.duration)||null,mood:'',photo:/^data:image\/(jpeg|png|webp);base64,/i.test(r.imageDataUrl||'')?r.imageDataUrl:'',createdAt:r.createdAt||new Date().toISOString(),updatedAt:r.updatedAt||r.createdAt||new Date().toISOString(),legacy:r});tx.objectStore('imports').put({id});}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
 }
 function writeRecord(record,remove=false){return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');const store=tx.objectStore('records');if(remove)store.delete(record.id);else store.put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
 async function refresh(){records=await new Promise((resolve,reject)=>{const r=db.transaction('records').objectStore('records').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});records.sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt.localeCompare(a.updatedAt));renderRecords();renderRecent();window.dispatchEvent(new CustomEvent('diary:records',{detail:records}));}
 const element=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
 function empty(target,filtered=false){const box=element('div',undefined,'empty');box.append(element('strong',filtered?'Nenhum momento encontrado':'Sua história começa aqui.'),element('p',filtered?'Experimente outra palavra ou limpe os filtros.':'Salve seu primeiro registro. Ele aparecerá aqui, pronto para reler ou virar um post.'));target.append(box);}
 function item(record,compact=false){const article=element('article',undefined,'moment');if(record.photo&&!compact){const img=element('img');img.src=record.photo;img.alt='Foto deste registro';article.append(img);}const date=element('time',dateLabel(record.date));date.dateTime=record.date;article.append(date,element('strong',record.title));if(!compact){const meta=[record.activity,record.duration?record.duration+' min':'',record.mood].filter(Boolean).join(' · ');if(meta)article.append(element('p',meta));if(record.note)article.append(element('p',record.note));}const actions=element('div',undefined,'moment-actions');const edit=element('button','Editar');edit.type='button';edit.addEventListener('click',()=>editRecord(record));const post=element('button','Criar arte');post.type='button';post.addEventListener('click',()=>useRecord(record));actions.append(edit,post);if(!compact){const remove=element('button','Excluir');remove.type='button';remove.addEventListener('click',async()=>{if(!confirm(`Excluir o registro “${record.title}”?`))return;try{await writeRecord(record,true);await refresh();if($('entry-id').value===record.id)resetForm();notify('Registro excluído do diário.');}catch{notify('Não foi possível excluir. Tente novamente.');}});actions.append(remove);}article.append(actions);return article;}
 function renderRecent(){$('recent-list').replaceChildren();if(!records.length)empty($('recent-list'));else records.slice(0,3).forEach(r=>$('recent-list').append(item(r,true)));}
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function renderRecords(){const query=normalize($('record-search').value.trim()),date=$('record-date').value;const filtered=records.filter(r=>(!date||r.date===date)&&normalize([r.title,r.note,r.activity].join(' ')).includes(query));$('record-list').replaceChildren();if(!filtered.length)empty($('record-list'),Boolean(query||date));else filtered.forEach(r=>$('record-list').append(item(r)));}
 ['record-search','record-date'].forEach(id=>$(id).addEventListener('input',renderRecords));$('clear-filter').addEventListener('click',()=>{$('record-search').value='';$('record-date').value='';renderRecords();});
 function showPhoto(){$('entry-photo-preview').hidden=!entryPhoto;$('remove-photo').hidden=!entryPhoto;if(entryPhoto)$('entry-photo-preview').src=entryPhoto;else $('entry-photo-preview').removeAttribute('src');}
 function resetForm(){$('entry-form').reset();$('entry-id').value='';$('entry-date').value=localDate;entryPhoto='';showPhoto();$('form-title').textContent='Meu registro de hoje';$('cancel-edit').hidden=true;}
 function editRecord(r){show('today');$('entry-id').value=r.id;$('entry-date').value=r.date;$('entry-title').value=r.title;$('entry-note').value=r.note;$('entry-mood').value=r.mood;$('entry-activity').value=r.activity;$('entry-duration').value=r.duration||'';entryPhoto=r.photo||'';showPhoto();$('form-title').textContent='Editar meu registro';$('cancel-edit').hidden=false;$('entry-title').focus();}
 $('cancel-edit').addEventListener('click',resetForm);
 $('entry-form').addEventListener('submit',async event=>{event.preventDefault();if(!$('entry-title').value.trim()){$('entry-title').setCustomValidity('Escreva um título para seu momento.');$('entry-title').reportValidity();return;}const button=event.submitter;button.disabled=true;try{if(!db)throw new Error();const id=$('entry-id').value||crypto.randomUUID();const previous=records.find(r=>r.id===id);await writeRecord({id,date:$('entry-date').value,title:$('entry-title').value.trim(),note:$('entry-note').value.trim(),mood:$('entry-mood').value,activity:$('entry-activity').value.trim(),duration:$('entry-duration').value?Number($('entry-duration').value):null,photo:entryPhoto,createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});resetForm();await refresh();notify('Registro salvo neste navegador. Você pode encontrá-lo em Meus registros.');}catch{notify('Não foi possível salvar. Seu formulário foi mantido; verifique o espaço disponível e tente novamente.');}finally{button.disabled=false;}});
 $('entry-title').addEventListener('input',()=> $('entry-title').setCustomValidity(''));
 function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}
 async function readPhoto(file){if(!file)return '';if(!file.type.startsWith('image/')||file.size>12*1024*1024)throw new Error('Escolha uma imagem de até 12 MB.');const url=URL.createObjectURL(file);try{const img=await loadImage(url);const scale=Math.min(1,1400/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#faf9f6';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.85);}catch{throw new Error('Não foi possível abrir esta foto. Tente JPG, PNG ou WebP.');}finally{URL.revokeObjectURL(url);}}
 $('entry-photo').addEventListener('change',async e=>{try{entryPhoto=await readPhoto(e.target.files[0]);showPhoto();}catch(error){e.target.value='';notify(error.message);}});
 $('remove-photo').addEventListener('click',()=>{entryPhoto='';$('entry-photo').value='';showPhoto();});
 function download(blob,name){const url=URL.createObjectURL(blob),a=element('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('export').addEventListener('click',()=>{if(!records.length){notify('Salve um registro antes de baixar sua cópia.');return;}download(new Blob([JSON.stringify({version:1,preview:false,exportedAt:new Date().toISOString(),records},null,2)],{type:'application/json'}),`meu-diario-be-registros-${localDate}.json`);notify('Cópia dos registros preparada para download, incluindo suas fotos.');});
 function openOfficialMaker(draft={}){
  const payload={version:1,source:'diario',createdAt:new Date().toISOString(),profile:{name:profileName().slice(0,40)},post:{title:String(draft.title||'').slice(0,80),text:String(draft.text||'').slice(0,600),activity:String(draft.activity||'').slice(0,60),duration:Number(draft.duration)||null,postType:draft.postType||'photo',imageDataUrl:/^data:image\/(jpeg|png|webp);base64,/i.test(draft.photo||'')?draft.photo:''}};
  try{sessionStorage.setItem('bemEsportivoPostMakerDraftV1',JSON.stringify(payload));}catch{payload.post.imageDataUrl='';try{sessionStorage.setItem('bemEsportivoPostMakerDraftV1',JSON.stringify(payload));}catch{}}
  location.href='/criar-postagem?origem=diario';
 }
 function useRecord(r){openOfficialMaker({title:r.title,activity:r.activity,duration:r.duration,photo:r.photo,postType:r.photo?'photo':'training'});}
 window.addEventListener('diary:share-achievement',event=>openOfficialMaker({title:event.detail.title,text:event.detail.text,postType:'achievement'}));
 $('restore-backup').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
   if(!db||file.size>50*1024*1024)throw new Error('Selecione uma cópia de até 50 MB.');
   const payload=JSON.parse(await file.text());
   if(payload.version!==1||!Array.isArray(payload.records)||payload.records.length>3000)throw new Error('Este arquivo não é uma cópia válida do novo diário.');
   const incoming=payload.records.map(r=>{
    if(!r||typeof r.id!=='string'||!r.id||r.id.length>160||!/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')||typeof r.title!=='string'||!r.title.trim())throw new Error('A cópia contém registros inválidos. Nada foi importado.');
    if(r.photo&&(!/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(r.photo)||r.photo.length>5*1024*1024))throw new Error('A cópia contém uma foto inválida.');
    const stamp=new Date().toISOString();return {id:r.id,date:r.date,title:r.title.slice(0,100),note:String(r.note||'').slice(0,2000),activity:String(r.activity||'').slice(0,60),mood:String(r.mood||'').slice(0,60),duration:Number(r.duration)>0?Math.min(1440,Number(r.duration)):null,photo:r.photo||'',createdAt:r.createdAt||stamp,updatedAt:r.updatedAt||stamp};
   });
   if(!confirm(`Restaurar ${incoming.length} registros? Registros já existentes serão mantidos.`))return;
   const current=new Set(records.map(r=>r.id));
   await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');for(const r of incoming)if(!current.has(r.id)){tx.objectStore('records').put(r);current.add(r.id);}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
   await refresh();notify('Cópia restaurada. Seus registros anteriores foram mantidos.');
  }catch(error){notify(error.message||'Não foi possível restaurar a cópia.');}finally{event.target.value='';}
 });
 window.addEventListener('storage',event=>{if(event.key==='meuCaminhoBeProfileV1'){let next;try{next=JSON.parse(event.newValue||'null');}catch{}if(!next||String(next.identityCreatedAt||next.createdAt||next.name)!==ownerKey)location.replace('/meu-caminho-be');}});
 openDB().then(async database=>{db=database;await importHistory();await refresh();}).catch(()=>notify('O armazenamento do diário não está disponível neste navegador. Seus dados não foram alterados.'));
})();
