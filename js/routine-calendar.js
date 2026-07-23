const PROFILE_KEY = 'meuCaminhoBeProfileV1';
const TASK_KEY = 'meuCaminhoBeTasksV1';
const INSTALL_KEY = 'meuCaminhoBePushInstallV1';
const NOTIFIED_KEY = 'meuCaminhoBeTaskNotifiedV1';
const root = document.getElementById('fb-routine-calendar');

if (root) {
  const pad = value => String(value).padStart(2, '0');
  const dayKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const parseDay = value => new Date(`${value}T12:00:00`);
  const todayKey = () => dayKey(new Date());
  const safeText = (value, max = 80) => String(value || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, max);
  const categories = { atividade: 'Atividade', alimentacao: 'Alimentação', hidratacao: 'Hidratação', descanso: 'Descanso', 'bem-estar': 'Bem-estar', outro: 'Outro' };
  const repeatLabels = { daily: 'Todos os dias', weekly: 'Toda semana' };
  let tasks = readTasks();
  let selected = todayKey();
  let visibleMonth = new Date(); visibleMonth.setDate(1); visibleMonth.setHours(12, 0, 0, 0);
  let editingId = '';

  function readTasks() {
    try {
      const raw = JSON.parse(localStorage.getItem(TASK_KEY) || '[]');
      return Array.isArray(raw) ? raw.map(task => ({
        id: safeText(task.id, 80), title: safeText(task.title), date: /^\d{4}-\d{2}-\d{2}$/.test(task.date) ? task.date : todayKey(),
        time: /^\d{2}:\d{2}$/.test(task.time) ? task.time : '09:00', category: categories[task.category] ? task.category : 'outro',
        repeat: ['none', 'daily', 'weekly'].includes(task.repeat) ? task.repeat : 'none', reminder: ['none', '0', '10', '30', '60'].includes(String(task.reminder)) ? String(task.reminder) : '0',
        completedDates: Array.isArray(task.completedDates) ? task.completedDates.filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)).slice(-180) : [], createdAt: task.createdAt || new Date().toISOString()
      })).filter(task => task.id && task.title).slice(-250) : [];
    } catch (error) { return []; }
  }

  function writeTasks() {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('meuCaminhoBe:tasks-changed', { detail: { total: tasks.length } }));
    render(); checkDueLocal(); syncPushSchedule();
  }

  function occursOn(task, key) {
    if (key < task.date) return false;
    if (task.repeat === 'daily') return true;
    if (task.repeat === 'weekly') return parseDay(key).getDay() === parseDay(task.date).getDay();
    return key === task.date;
  }

  function tasksFor(key) { return tasks.filter(task => occursOn(task, key)).sort((a, b) => a.time.localeCompare(b.time)); }
  function isDone(task, key) { return task.completedDates.includes(key); }
  function formatDay(key, options = {}) { return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', ...options }).format(parseDay(key)); }

  function renderCalendar() {
    document.getElementById('fb-calendar-month').textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(visibleMonth);
    const grid = document.getElementById('fb-calendar-grid');
    const cells = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(label => { const el=document.createElement('span'); el.className='fb-calendar-weekday'; el.setAttribute('role','columnheader'); el.textContent=label; return el; });
    const first = new Date(visibleMonth); first.setDate(1 - first.getDay());
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(first); date.setDate(first.getDate() + index); const key = dayKey(date); const dayTasks = tasksFor(key);
      const button = document.createElement('button'); button.type='button'; button.className='fb-calendar-day'; button.dataset.date=key; button.setAttribute('role','gridcell'); button.textContent=String(date.getDate());
      button.classList.toggle('outside', date.getMonth() !== visibleMonth.getMonth()); button.classList.toggle('today', key === todayKey()); button.classList.toggle('selected', key === selected); button.classList.toggle('has-tasks', dayTasks.length > 0); button.classList.toggle('all-done', dayTasks.length > 0 && dayTasks.every(task => isDone(task,key)));
      button.setAttribute('aria-label', `${formatDay(key,{weekday:'long'})}${dayTasks.length ? `, ${dayTasks.length} tarefa${dayTasks.length>1?'s':''}` : ''}`); button.setAttribute('aria-selected', String(key === selected)); cells.push(button);
    }
    grid.replaceChildren(...cells);
  }

  function renderDay() {
    document.getElementById('fb-task-day-title').textContent = selected === todayKey() ? 'Hoje' : formatDay(selected, { weekday: 'long' });
    const list = document.getElementById('fb-task-list'); const entries = tasksFor(selected);
    if (!entries.length) { const empty=document.createElement('li'); empty.className='fb-task-empty'; empty.textContent='Nenhuma tarefa para este dia.'; list.replaceChildren(empty); return; }
    list.replaceChildren(...entries.map(task => {
      const item=document.createElement('li'); item.className='fb-task-item'; item.classList.toggle('done',isDone(task,selected)); item.dataset.taskId=task.id;
      const check=document.createElement('button'); check.type='button'; check.className='fb-task-check'; check.dataset.taskComplete=task.id; check.textContent=isDone(task,selected)?'✓':''; check.setAttribute('aria-label',`${isDone(task,selected)?'Desmarcar':'Concluir'} ${task.title}`);
      const copy=document.createElement('div'); copy.className='fb-task-copy'; const title=document.createElement('strong'); title.textContent=task.title; const meta=document.createElement('span'); meta.textContent=`${task.time} · ${categories[task.category]}${task.repeat!=='none'?` · ${repeatLabels[task.repeat]}`:''}`; copy.append(title,meta);
      const actions=document.createElement('div'); actions.className='fb-task-actions'; const edit=document.createElement('button'); edit.type='button'; edit.dataset.taskEdit=task.id; edit.textContent='Editar'; const remove=document.createElement('button'); remove.type='button'; remove.dataset.taskDelete=task.id; remove.textContent='Excluir'; actions.append(edit,remove); item.append(check,copy,actions); return item;
    }));
  }

  function renderSummary() {
    const today=todayKey(), todayTasks=tasksFor(today), doneToday=todayTasks.filter(task=>isDone(task,today)).length;
    document.getElementById('fb-task-today-count').textContent=`${todayTasks.length} tarefa${todayTasks.length===1?'':'s'}`; document.getElementById('fb-task-today-detail').textContent=todayTasks.length?`${doneToday} concluída${doneToday===1?'':'s'} de ${todayTasks.length}.`:'Seu dia está livre.';
    const base=parseDay(today); const start=new Date(base); start.setDate(base.getDate()-base.getDay()); let planned=0,done=0,next=null;
    for(let offset=0;offset<7;offset+=1){const date=new Date(start);date.setDate(start.getDate()+offset);const key=dayKey(date);const dayTasks=tasksFor(key);planned+=dayTasks.length;done+=dayTasks.filter(task=>isDone(task,key)).length;}
    const percent=planned?Math.round(done/planned*100):0; document.getElementById('fb-task-week-progress').textContent=`${percent}% concluído`; document.getElementById('fb-task-week-detail').textContent=planned?`${done} de ${planned} compromissos.`:'Planeje o primeiro compromisso.';
    for(let offset=0;offset<31&&!next;offset+=1){const date=new Date(base);date.setDate(base.getDate()+offset);const key=dayKey(date);next=tasksFor(key).find(task=>!isDone(task,key)&&new Date(`${key}T${task.time}:00`)>=new Date())?{task:tasksFor(key).find(task=>!isDone(task,key)&&new Date(`${key}T${task.time}:00`)>=new Date()),key}:null;}
    document.getElementById('fb-task-next-title').textContent=next?.task.title||'Nada agendado'; document.getElementById('fb-task-next-time').textContent=next?`${next.key===today?'Hoje':formatDay(next.key)} às ${next.task.time}`:'Crie uma tarefa quando quiser.';
  }

  function render(){ renderCalendar(); renderDay(); renderSummary(); }
  function openForm(task=null){ editingId=task?.id||''; const dialog=document.getElementById('fb-task-dialog'); const form=document.getElementById('fb-task-form'); form.reset(); document.getElementById('fb-task-dialog-title').textContent=task?'Editar tarefa':'Nova tarefa'; form.elements.title.value=task?.title||''; form.elements.date.value=task?.date||selected; form.elements.time.value=task?.time||'09:00'; form.elements.category.value=task?.category||'atividade'; form.elements.repeat.value=task?.repeat||'none'; form.elements.reminder.value=task?.reminder||'0'; dialog.showModal(); }
  function closeForm(){ document.getElementById('fb-task-dialog').close(); editingId=''; }
  function profileReady(){ try{return Boolean(JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')?.objective);}catch(error){return false;} }

  root.hidden=!profileReady(); if(location.hash==='#agenda'){root.hidden=false;setTimeout(()=>root.scrollIntoView({behavior:'smooth',block:'start'}),300);} render();
  document.getElementById('fb-calendar-grid').addEventListener('click',event=>{const button=event.target.closest('[data-date]');if(!button)return;selected=button.dataset.date;visibleMonth=parseDay(selected);visibleMonth.setDate(1);render();});
  document.getElementById('fb-calendar-prev').addEventListener('click',()=>{visibleMonth.setMonth(visibleMonth.getMonth()-1);renderCalendar();}); document.getElementById('fb-calendar-month-next').addEventListener('click',()=>{visibleMonth.setMonth(visibleMonth.getMonth()+1);renderCalendar();}); document.getElementById('fb-calendar-today').addEventListener('click',()=>{selected=todayKey();visibleMonth=parseDay(selected);visibleMonth.setDate(1);render();});
  document.getElementById('fb-task-new').addEventListener('click',()=>openForm()); document.getElementById('fb-task-day-add').addEventListener('click',()=>openForm()); document.getElementById('fb-task-close').addEventListener('click',closeForm); document.getElementById('fb-task-cancel').addEventListener('click',closeForm);
  document.getElementById('fb-task-list').addEventListener('click',event=>{const complete=event.target.closest('[data-task-complete]'),edit=event.target.closest('[data-task-edit]'),remove=event.target.closest('[data-task-delete]'); if(complete){const task=tasks.find(item=>item.id===complete.dataset.taskComplete);if(!task)return;task.completedDates=isDone(task,selected)?task.completedDates.filter(key=>key!==selected):[...task.completedDates,selected].slice(-180);writeTasks();if(isDone(task,selected))window.dispatchEvent(new CustomEvent('meuCaminhoBe:feedback',{detail:{type:'success',title:'Tarefa concluída!',message:'Seu acompanhamento da semana foi atualizado.',reward:'+5 XP',detail:'Rotina semanal atualizada'}}));} if(edit)openForm(tasks.find(item=>item.id===edit.dataset.taskEdit)); if(remove&&confirm('Excluir esta tarefa da sua agenda?')){tasks=tasks.filter(item=>item.id!==remove.dataset.taskDelete);writeTasks();}});
  document.getElementById('fb-task-form').addEventListener('submit',event=>{event.preventDefault();if(!event.currentTarget.reportValidity())return;const data=new FormData(event.currentTarget);const previous=tasks.find(task=>task.id===editingId);const task={id:editingId||crypto.randomUUID(),title:safeText(data.get('title')),date:String(data.get('date')),time:String(data.get('time')),category:String(data.get('category')),repeat:String(data.get('repeat')),reminder:String(data.get('reminder')),completedDates:previous?.completedDates||[],createdAt:previous?.createdAt||new Date().toISOString()};tasks=editingId?tasks.map(item=>item.id===editingId?task:item):[...tasks,task];selected=task.date;visibleMonth=parseDay(selected);visibleMonth.setDate(1);closeForm();writeTasks();});

  function dueOccurrences(days=90){const now=new Date(), output=[];for(let offset=0;offset<=days;offset+=1){const date=new Date(now);date.setDate(now.getDate()+offset);const key=dayKey(date);for(const task of tasksFor(key)){if(task.reminder==='none'||isDone(task,key))continue;const due=new Date(`${key}T${task.time}:00`);due.setMinutes(due.getMinutes()-Number(task.reminder));if(due>now&&output.length<300)output.push({key:`${task.id}:${key}`,dueAt:due.toISOString()});}}return output;}
  function readNotified(){try{return JSON.parse(localStorage.getItem(NOTIFIED_KEY)||'{}');}catch(error){return{};}}
  async function checkDueLocal(){const now=new Date(),notified=readNotified();for(const task of tasks){for(let offset=-1;offset<=0;offset+=1){const date=new Date(now);date.setDate(now.getDate()+offset);const key=dayKey(date);if(!occursOn(task,key)||task.reminder==='none'||isDone(task,key))continue;const due=new Date(`${key}T${task.time}:00`);due.setMinutes(due.getMinutes()-Number(task.reminder));const marker=`${task.id}:${key}`;if(due<=now&&now-due<3600000&&!notified[marker]){notified[marker]=new Date().toISOString();if('Notification'in window&&Notification.permission==='granted'&&navigator.serviceWorker){const reg=await navigator.serviceWorker.ready;reg.showNotification('Meu Caminho Be',{body:`Agora: ${task.title}`,icon:'/img/logobemoficial.png',tag:marker,data:{url:'/meu-caminho-be#agenda'}});}else window.dispatchEvent(new CustomEvent('meuCaminhoBe:feedback',{detail:{type:'info',title:'Lembrete da sua rotina',message:task.title}}));}}}localStorage.setItem(NOTIFIED_KEY,JSON.stringify(Object.fromEntries(Object.entries(notified).slice(-300))));}
  function urlBase64ToUint8Array(value){const padding='='.repeat((4-value.length%4)%4);const base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(base64),char=>char.charCodeAt(0));}
  function installId(){let id=localStorage.getItem(INSTALL_KEY);if(!id){id=crypto.randomUUID();localStorage.setItem(INSTALL_KEY,id);}return id;}
  async function syncPushSchedule(){if(!('Notification'in window)||Notification.permission!=='granted'||!('serviceWorker'in navigator))return;try{const registration=await navigator.serviceWorker.ready;const subscription=await registration.pushManager.getSubscription();if(!subscription)return;await fetch('/api/routine-notifications/schedule',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({installationId:installId(),subscription,reminders:dueOccurrences()})});}catch(error){}}
  async function enableNotifications(){const status=document.getElementById('fb-notification-status'),button=document.getElementById('fb-enable-notifications');if(!('Notification'in window)||!('PushManager'in window)||!window.isSecureContext){status.textContent='Este navegador não oferece push seguro. Os avisos aparecerão ao abrir o sistema.';return;}try{const permission=await Notification.requestPermission();if(permission!=='granted'){status.textContent='Permissão não concedida. Você pode alterar isso nas configurações do navegador.';return;}const configResponse=await fetch('/api/routine-notifications/config');if(!configResponse.ok)throw new Error('config');const {publicKey}=await configResponse.json();const registration=await navigator.serviceWorker.ready;let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(publicKey)});const response=await fetch('/api/routine-notifications/schedule',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({installationId:installId(),subscription,reminders:dueOccurrences()})});if(!response.ok)throw new Error('sync');root.querySelector('.fb-notification-panel').classList.add('enabled');status.textContent='Lembretes ativos neste navegador, inclusive com o site fechado.';button.textContent='Lembretes ativos';}catch(error){status.textContent='A agenda está funcionando. O push real precisa das chaves de envio configuradas no servidor.';}}
  document.getElementById('fb-enable-notifications').addEventListener('click',enableNotifications);
  if('Notification'in window&&Notification.permission==='granted'){root.querySelector('.fb-notification-panel').classList.add('enabled');document.getElementById('fb-enable-notifications').textContent='Lembretes ativos';document.getElementById('fb-notification-status').textContent='Lembretes autorizados neste navegador.';}
  checkDueLocal();setInterval(checkDueLocal,60000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){tasks=readTasks();render();checkDueLocal();}});
  window.addEventListener('meuCaminhoBe:tasks-imported',()=>{tasks=readTasks();root.hidden=!profileReady();render();});
  window.addEventListener('meuCaminhoBe:profile-updated',event=>{root.hidden=!event.detail?.ready;if(!root.hidden)render();});
  window.addEventListener('meuCaminhoBe:reset',()=>{tasks=[];root.hidden=true;render();syncPushSchedule();});
}
