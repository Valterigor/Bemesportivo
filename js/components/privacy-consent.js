const CONSENT_KEY = 'bemEsportivoPrivacyConsentV1';
const CONSENT_VERSION = 1;
const ADSENSE_CLIENT = 'ca-pub-5270723987412757';

function readConsent() {
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    return value?.version === CONSENT_VERSION ? value : null;
  } catch (error) {
    return null;
  }
}
function saveConsent(advertising) {
  const value = {
    version: CONSENT_VERSION,
    necessary: true,
    advertising: Boolean(advertising),
    updatedAt: new Date().toISOString()
  };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch (error) {}
  window.dispatchEvent(new CustomEvent('bemEsportivo:privacy-consent', { detail: value }));
  return value;
}

function adsAreEnabledOnPage() {
  return Boolean(document.querySelector('meta[name="bem-adsense-enabled"][content="true"]'));
}

function loadAdsense() {
  if (!adsAreEnabledOnPage() || document.querySelector('script[data-bem-adsense]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset.bemAdsense = 'true';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.append(script);
}

function applyConsent(consent) {
  document.documentElement.dataset.advertisingConsent = consent?.advertising ? 'granted' : 'denied';
  if (consent?.advertising) loadAdsense();
}

function createDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'be-privacy-dialog';
  dialog.setAttribute('aria-labelledby', 'be-privacy-title');
  dialog.innerHTML = `
    <form method="dialog" class="be-privacy-dialog__body">
      <span class="be-privacy-dialog__eyebrow">SUAS ESCOLHAS DE PRIVACIDADE</span>
      <h2 id="be-privacy-title">Você decide sobre publicidade.</h2>
      <p>Usamos o armazenamento necessário para manter suas preferências e recursos do site. A publicidade do Google só será carregada se você permitir.</p>
      <details>
        <summary>Entender as categorias</summary>
        <div class="be-privacy-categories">
          <p><strong>Necessário — sempre ativo</strong><br>Guarda preferências, progresso local e recursos solicitados por você. Não é usado para publicidade comportamental.</p>
          <label><span><strong>Publicidade</strong><small>Permite carregar o Google AdSense, que pode utilizar cookies e tecnologias semelhantes.</small></span><input type="checkbox" name="advertising"></label>
        </div>
      </details>
      <p class="be-privacy-dialog__links"><a href="/politica-de-privacidade">Política de Privacidade</a></p>
      <div class="be-privacy-dialog__actions">
        <button type="button" data-privacy-reject>Recusar publicidade</button>
        <button type="button" data-privacy-save>Salvar escolhas</button>
        <button type="button" class="be-privacy-primary" data-privacy-accept>Aceitar publicidade</button>
      </div>
    </form>`;
  document.body.append(dialog);
  return dialog;
}

function openPreferences(dialog, consent = readConsent()) {
  const advertising = dialog.querySelector('[name="advertising"]');
  if (advertising) advertising.checked = Boolean(consent?.advertising);
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}

function closePreferences(dialog) {
  if (dialog.open && typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

export function initPrivacyConsent() {
  const dialog = createDialog();
  const finish = advertising => {
    const consent = saveConsent(advertising);
    applyConsent(consent);
    closePreferences(dialog);
  };

  dialog.querySelector('[data-privacy-reject]')?.addEventListener('click', () => finish(false));
  dialog.querySelector('[data-privacy-accept]')?.addEventListener('click', () => finish(true));
  dialog.querySelector('[data-privacy-save]')?.addEventListener('click', () => {
    finish(Boolean(dialog.querySelector('[name="advertising"]')?.checked));
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-privacy-settings]');
    if (!trigger) return;
    event.preventDefault();
    openPreferences(dialog);
  });

  const consent = readConsent();
  applyConsent(consent);
  if (!consent) window.setTimeout(() => openPreferences(dialog, null), 350);
}
