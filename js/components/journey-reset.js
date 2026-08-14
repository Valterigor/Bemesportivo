const JOURNEY_KEY_PREFIX = /^meuCaminhoBe/i;
const RESET_NOTICE_KEY = 'meuCaminhoBeResetNotice';
const APP_PATH = '/meu-caminho-be';

function closeResetDialog() {
  const dialog = document.getElementById('fb-reset-dialog');
  if (!dialog) return;
  if (dialog.open && typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

function openResetDialog() {
  const dialog = document.getElementById('fb-reset-dialog');
  if (!dialog) return;
  const confirmButton = document.getElementById('fb-reset-confirm');
  if (confirmButton) {
    confirmButton.disabled = false;
    confirmButton.textContent = 'Sim, zerar e recomeçar';
  }
  if (!dialog.open) {
    try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
  }
  window.setTimeout(() => document.getElementById('fb-reset-cancel')?.focus(), 30);
}

function journeyKeys() {
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (JOURNEY_KEY_PREFIX.test(String(key || ''))) keys.push(key);
  }
  return keys;
}

function resetJourney() {
  const button = document.getElementById('fb-reset-confirm');
  if (button) {
    button.disabled = true;
    button.textContent = 'Zerando…';
  }
  try {
    journeyKeys().forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem('meuCaminhoBeTimerV1');
    if (journeyKeys().length) throw new Error('reset-incomplete');
    sessionStorage.setItem(RESET_NOTICE_KEY, '1');
    window.location.replace(`${APP_PATH}?reiniciado=1`);
  } catch (error) {
    if (button) {
      button.disabled = false;
      button.textContent = 'Tentar zerar novamente';
    }
    let feedback = document.getElementById('fb-reset-feedback');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.id = 'fb-reset-feedback';
      feedback.setAttribute('role', 'alert');
      document.getElementById('fb-reset-dialog')?.querySelector('div')?.before(feedback);
    }
    feedback.textContent = 'O navegador bloqueou a exclusão. Verifique a permissão de armazenamento do site e tente novamente.';
  }
}

export function initJourneyReset() {
  if (!document.getElementById('fb-reset-dialog')) return;
  document.addEventListener('click', event => {
    const resetTrigger = event.target.closest('[data-fb-reset]');
    const cancelButton = event.target.closest('#fb-reset-cancel');
    const confirmButton = event.target.closest('#fb-reset-confirm');
    if (!resetTrigger && !cancelButton && !confirmButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (resetTrigger) openResetDialog();
    else if (cancelButton) closeResetDialog();
    else resetJourney();
  }, true);
}
