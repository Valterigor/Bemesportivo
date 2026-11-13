(() => {
  const installButton = document.querySelector('#install-game');
  const status = document.querySelector('#offline-status');
  if (!installButton || !status) return;
  let installPrompt = null;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const setStatus = text => { status.textContent = text; };
  const cacheGame = async registration => {
    const pageAssets = [...document.querySelectorAll('link[rel="stylesheet"],script[src],img[src]')]
      .map(element => new URL(element.href || element.src, location.origin)).filter(url => url.origin === location.origin).map(url => url.pathname + url.search);
    const gameAssets = ['/bematch', '/bematch.html', '/bematch.webmanifest', '/img/be-match-cover.png', '/img/be-match-app-cover.png', '/img/be-match-app-icon-192.png', '/img/be-match-app-icon-512.png', '/img/be-match-app-icon-maskable-512.png', ...Array.from({ length: 8 }, (_, index) => `/img/be-match/scenes/phase-${index + 1}.svg`), ...pageAssets];
    if (!registration.active) return false;
    return new Promise(resolve => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => resolve(false), 12000);
      channel.port1.onmessage = event => { clearTimeout(timeout); resolve(Boolean(event.data?.ok)); };
      registration.active.postMessage({ type: 'CACHE_BE_MATCH', assets: [...new Set(gameAssets)] }, [channel.port2]);
    });
  };
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        const cached = await cacheGame(registration);
        setStatus(cached ? (navigator.onLine ? 'Pronto para jogar offline. O ranking sincroniza quando houver internet.' : 'Modo offline ativo. Seu progresso será sincronizado depois.') : 'Preparação offline pendente. Continue jogando pelo site e tente instalar novamente.');
      } catch { setStatus('O jogo continua disponível pelo site. A instalação não está disponível neste navegador.'); }
    });
  } else setStatus('Você pode jogar normalmente pelo site neste navegador.');
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installButton.textContent = '✓ BE Match instalado';
    installButton.disabled = true;
    setStatus('Instalado. Abra pelo ícone do BE Match e jogue com ou sem internet.');
  });
  installButton.addEventListener('click', async () => {
    if (standalone) { setStatus('Você já está usando o BE Match instalado.'); return; }
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome !== 'accepted') setStatus('Sem problema: você pode continuar jogando normalmente pelo site.');
      installPrompt = null;
      return;
    }
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setStatus(isiOS ? 'No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.' : 'No menu do navegador, escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.');
  });
  window.addEventListener('online', () => setStatus('Internet conectada. Sincronizando a classificação…'));
  window.addEventListener('offline', () => setStatus('Modo offline ativo. Continue jogando; a classificação será sincronizada depois.'));
  if (!navigator.onLine) setStatus('Modo offline ativo. Continue jogando; a classificação será sincronizada depois.');
  if (standalone) { installButton.textContent = '✓ Jogo instalado'; installButton.disabled = true; }
  document.body.classList.toggle('be-match-installed-app', standalone);
})();
