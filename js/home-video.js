
const video=document.querySelector('#hero-video'),button=document.querySelector('#pause'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
button.addEventListener('click',()=>{if(video.paused)video.play().catch(()=>{});else video.pause()});
video.addEventListener('play',()=>{button.textContent='Ⅱ Pausar';button.setAttribute('aria-label','Pausar vídeo do destaque')});
video.addEventListener('pause',()=>{button.textContent='▶ Reproduzir';button.setAttribute('aria-label','Reproduzir vídeo do destaque')});
reduced.addEventListener('change',event=>{if(event.matches)video.pause()});
if(!reduced.matches)video.play().catch(()=>{});
