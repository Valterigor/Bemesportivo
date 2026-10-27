// A abertura e o acesso continuam no aplicativo original. Só a área interna muda.
const initial = new URL(location.href);
const legacy = initial.searchParams.get('versao') === 'anterior';
if (legacy) {
  for (const method of ['pushState','replaceState']) {
    const original=history[method].bind(history);
    history[method]=(state,title,url)=>{if(!url)return original(state,title,url);const next=new URL(url,location.href);if(next.origin===location.origin&&next.pathname.startsWith('/meu-caminho-be'))next.searchParams.set('versao','anterior');return original(state,title,next.href);};
  }
  const link=document.createElement('a');link.href='/meu-caminho-be';link.textContent='Abrir novo painel →';link.className='be-dashboard-return';
  const style=document.createElement('style');style.textContent='.be-dashboard-return{position:fixed;bottom:16px;right:16px;z-index:2147483600;padding:12px 18px;border-radius:10px;background:#b94511;color:white;font:600 13px Arial,sans-serif;text-decoration:none}';document.head.append(style);document.body.append(link);
  const continuity=document.getElementById('fb-continuity-output-help');
  if(continuity){const note=document.createElement('p');note.textContent='Os registros do novo painel têm uma cópia própria: use Baixar meus registros e Restaurar cópia. O código desta área mantém os dados do modelo anterior.';note.style.cssText='font-size:13px;line-height:1.6;color:inherit';continuity.parentElement.append(note);}
} else {
  const directArea=/\/(perfil|ferramentas|conteudos|explorar|progresso|evolucao|jornada|comunidade)(?:\/|$)/.test(initial.pathname)||['perfil','ferramentas','conteudos','explorar','progresso','evolucao','comunidade'].includes(initial.searchParams.get('tela'));
  if(!directArea){
    let scheduled=false,departed=false;
    const check=()=>{scheduled=false;if(departed)return;let profile;try{profile=JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1')||'null');}catch{}
      const blocked=['be-cover-active','be-cover-opening','be-welcome-active','be-welcome-leaving'].some(c=>document.body.classList.contains(c));
      if(profile?.name?.trim()&&!blocked){departed=true;location.replace('/diario-app/');}
    };
    new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(check);}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden']});
    window.addEventListener('meuDiarioBe:opened',check);window.addEventListener('meuCaminhoBe:profile-updated',check);check();
  }
}
