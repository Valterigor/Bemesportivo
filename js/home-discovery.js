(function(){
  const root=document.querySelector('[data-be-discovery]');
  if(!root)return;
  const feedback=root.querySelector('[data-discovery-feedback]');
  root.querySelectorAll('button[data-discovery-choice]').forEach((button)=>{
    button.addEventListener('click',()=>{
      root.querySelectorAll('button[data-discovery-choice]').forEach((item)=>item.setAttribute('aria-pressed','false'));
      button.setAttribute('aria-pressed','true');
      feedback.textContent=`Boa escolha. Vamos começar por: ${button.textContent.trim()}.`;
    });
  });
  const nextSteps={
    'Descobrir uma modalidade':{label:'Encontrar uma modalidade',href:'/radar-esportivo'},
    'Entender como meu corpo funciona':{label:'Conhecer o corpo e a prática',href:'/guias'},
    'Conhecer histórias de atletas':{label:'Ler histórias de atletas',href:'/reportagens'},
    'Acompanhar minha evolução':{label:'Criar meu Diário Be',href:'/meu-caminho-be'}
  };
  root.querySelectorAll('button[data-discovery-choice]').forEach((button)=>{
    button.addEventListener('click',()=>{
      const next=nextSteps[button.textContent.trim()];
      if(next)feedback.innerHTML=`Boa escolha. Seu próximo passo pode ser: <a href="${next.href}">${next.label} →</a>`;
    });
  });
})();
