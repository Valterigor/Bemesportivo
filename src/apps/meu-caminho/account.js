import {
  decryptContinuityData,
  deriveContinuityIdentity,
  encryptContinuityData,
  formatContinuityCode,
  generateContinuityCode,
  normalizeContinuityCode
} from './continuity-crypto.js';

const PROFILE_KEY = 'meuCaminhoBeProfileV1';
const TASK_KEY = 'meuCaminhoBeTasksV1';
const DIARY_KEY = 'meuCaminhoBeDiaryV1';
const MEALS_KEY = 'meuCaminhoBeMealsV1';
const SYNC_KEY = 'meuCaminhoBeSyncStateV1';
const CODE_KEY = 'meuCaminhoBeContinuityCodeV1';
const CONSENT_VERSION = '2026-07-30';
const endpoint = '/api/meu-caminho-sync';
const LOCAL_ONLY_MODE = document.querySelector('meta[name="be-meu-caminho-mode"]')?.content === 'local-only';

const card = document.getElementById('fb-account-card');
const dialog = document.getElementById('fb-account-dialog');
const conflictDialog = document.getElementById('fb-sync-conflict-dialog');
const status = document.getElementById('fb-account-status');
const topStatus = document.getElementById('fb-connectivity-status');
let identity = null;
let syncing = false;
let queued = false;
let remoteConflict = null;
let syncTimer = 0;

function readJSON(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function localSnapshot() {
  const profile = readJSON(PROFILE_KEY);
  const tasks = readJSON(TASK_KEY, []);
  const diary = readJSON(DIARY_KEY, []);
  const meals = readJSON(MEALS_KEY, []);
  return {
    schemaVersion: 5,
    profile,
    tasks: Array.isArray(tasks) ? tasks.slice(-250) : [],
    // Fotos permanecem somente no aparelho ou na publicação moderada; não entram no pacote criptografado para evitar exceder o limite da continuidade.
    diary: Array.isArray(diary) ? diary.slice(0, 3000).map(({ imageDataUrl, ...entry }) => entry) : [],
    meals: Array.isArray(meals) ? meals.slice(-1200) : []
  };
}

function syncState() {
  return readJSON(SYNC_KEY, { revision: 0, updatedAt: null });
}

function setSyncState(next) {
  localStorage.setItem(SYNC_KEY, JSON.stringify(next));
}

function createMutationId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hasLocalData(snapshot = localSnapshot()) {
  return Boolean(snapshot.profile) || snapshot.tasks.length > 0 || snapshot.diary.length > 0 || snapshot.meals.length > 0;
}

function hasCloudConsent(profile = localSnapshot().profile) {
  return profile?.cloudSyncConsent?.version === CONSENT_VERSION
    && Boolean(profile.cloudSyncConsent?.consentedAt);
}

function grantCloudConsent() {
  const profile = localSnapshot().profile || {};
  const updated = {
    ...profile,
    cloudSyncConsent: {
      version: CONSENT_VERSION,
      consentedAt: new Date().toISOString(),
      method: 'encrypted-continuity-code'
    },
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:profile-updated', {
    detail: { ready: Boolean(updated.objective), source: 'cloud-consent' }
  }));
}

function setMessage(message, type = '') {
  if (!status) return;
  status.textContent = message;
  status.dataset.state = type;
}

function setTopStatus(connected) {
  if (!topStatus) return;
  if (LOCAL_ONLY_MODE) {
    topStatus.innerHTML = '<i aria-hidden="true"></i>Acesso livre · dados neste aparelho';
    return;
  }
  topStatus.innerHTML = connected
    ? '<i aria-hidden="true"></i>Continuidade protegida'
    : '<i aria-hidden="true"></i>Dados ficam neste aparelho';
}

function maskedCode() {
  if (!identity?.code) return '';
  return `Código ••••-${identity.code.slice(-4)}`;
}

function renderAccount() {
  if (!card) return;
  const connected = Boolean(identity);
  card.dataset.account = connected ? 'connected' : 'available';
  document.getElementById('fb-account-email').textContent = connected ? maskedCode() : '';
  document.getElementById('fb-account-connect').hidden = connected;
  document.getElementById('fb-account-show-code').hidden = !connected;
  document.getElementById('fb-account-sync-now').hidden = !connected;
  document.getElementById('fb-account-logout').hidden = !connected;
  document.getElementById('fb-account-cloud-delete').hidden = !connected;
  setMessage(
    connected
      ? 'Este aparelho pode continuar sua jornada com segurança.'
      : 'Ative um código para continuar em outro aparelho, sem e-mail ou senha.',
    connected ? 'success' : ''
  );
  setTopStatus(connected);
}

function authFeedback(message = '', type = '') {
  const feedback = document.getElementById('fb-auth-feedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = type;
}

function setAuthMode(mode = 'create') {
  if (!dialog) return;
  dialog.dataset.mode = mode;
  dialog.querySelectorAll('[data-fb-auth-mode][role="tab"]').forEach(item => {
    item.setAttribute('aria-selected', String(item.dataset.fbAuthMode === mode));
  });
  authFeedback();
  window.setTimeout(() => {
    dialog.querySelector(mode === 'connect' ? '#fb-continuity-input' : '#fb-continuity-create')?.focus();
  }, 40);
}

function setButtonLoading(button, loading, label = 'Aguarde…') {
  if (!button) return;
  button.disabled = loading;
  button.setAttribute('aria-busy', String(loading));
  button.textContent = loading ? label : button.dataset.idleLabel || button.textContent;
}

function showCode(code, message = 'Guarde este código em um local seguro.') {
  const output = document.getElementById('fb-continuity-output');
  const codeField = document.getElementById('fb-continuity-code');
  const help = document.getElementById('fb-continuity-output-help');
  if (codeField) codeField.value = formatContinuityCode(code);
  if (help) help.textContent = message;
  if (output) output.hidden = false;
}

function hideCode() {
  const output = document.getElementById('fb-continuity-output');
  const codeField = document.getElementById('fb-continuity-code');
  if (codeField) codeField.value = '';
  if (output) output.hidden = true;
}

async function copyCode() {
  const value = document.getElementById('fb-continuity-code')?.value;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    authFeedback('Código copiado. Guarde-o fora deste aparelho.', 'success');
  } catch {
    document.getElementById('fb-continuity-code')?.select();
    authFeedback('Selecione e copie o código acima.', 'success');
  }
}

async function api(method = 'GET', body, activeIdentity = identity) {
  if (LOCAL_ONLY_MODE) throw new Error('local-only-mode');
  if (!activeIdentity) throw new Error('missing-continuity-code');
  const url = `${endpoint}?id=${activeIdentity.id}`;
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-BE-Sync-Token': activeIdentity.token
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 409) return { ...payload, conflict: true };
  if (!response.ok) throw new Error(payload.error || 'sync-failed');
  return payload;
}

function applyRemote(data, revision, updatedAt) {
  if (data?.profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
  else localStorage.removeItem(PROFILE_KEY);
  localStorage.setItem(TASK_KEY, JSON.stringify(Array.isArray(data?.tasks) ? data.tasks : []));
  localStorage.setItem(DIARY_KEY, JSON.stringify(Array.isArray(data?.diary) ? data.diary : []));
  localStorage.setItem(MEALS_KEY, JSON.stringify(Array.isArray(data?.meals) ? data.meals : []));
  setSyncState({ revision, updatedAt });
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:tasks-imported'));
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:diary-imported'));
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:meals-imported'));
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:profile-updated', {
    detail: { ready: Boolean(data?.profile?.objective), source: 'cloud' }
  }));
  location.reload();
}

async function upload({ force = false } = {}) {
  if (LOCAL_ONLY_MODE) return;
  if (!identity || syncing) {
    queued = Boolean(identity);
    return;
  }
  const snapshot = localSnapshot();
  if (snapshot.profile && !hasCloudConsent(snapshot.profile)) grantCloudConsent();

  syncing = true;
  setMessage('Criptografando e sincronizando…');
  const previous = syncState();
  const mutationId = previous.pendingMutationId || createMutationId();
  setSyncState({ ...previous, pendingMutationId: mutationId });
  try {
    const envelope = await encryptContinuityData(localSnapshot(), identity);
    const result = await api('PUT', {
      envelope,
      baseRevision: previous.revision,
      mutationId,
      force
    });
    if (result.conflict) {
      remoteConflict = {
        ...result,
        data: await decryptContinuityData(result.envelope, identity)
      };
      conflictDialog?.showModal();
      setMessage('Há alterações em outro aparelho. Escolha qual versão manter.', 'warning');
      return;
    }
    setSyncState({ revision: result.revision, updatedAt: result.updatedAt, pendingMutationId: null });
    setMessage('Tudo sincronizado e criptografado.', 'success');
    setTopStatus(true);
  } catch {
    setMessage('Os dados seguem seguros neste aparelho. Tentaremos sincronizar novamente.', 'warning');
  } finally {
    syncing = false;
    if (queued) {
      queued = false;
      window.setTimeout(() => upload(), 500);
    }
  }
}

async function initialSync() {
  if (LOCAL_ONLY_MODE) return;
  if (!identity) return;
  setMessage('Verificando sua continuidade…');
  try {
    const remote = await api();
    const local = localSnapshot();
    if (!remote.exists) {
      if (hasLocalData(local)) await upload();
      else setMessage('Código ativo. Seu primeiro registro será sincronizado automaticamente.', 'success');
      return;
    }
    const remoteData = await decryptContinuityData(remote.envelope, identity);
    if (!hasLocalData(local)) {
      applyRemote(remoteData, remote.revision, remote.updatedAt);
      return;
    }
    const state = syncState();
    if (state.revision === remote.revision) {
      setMessage('Tudo sincronizado e criptografado.', 'success');
      return;
    }
    remoteConflict = { ...remote, data: remoteData };
    conflictDialog?.showModal();
    setMessage('Encontramos dados neste aparelho e na nuvem. Escolha qual versão manter.', 'warning');
  } catch (error) {
    if (/decrypt|operation|encrypted-envelope/i.test(String(error?.message || error))) {
      setMessage('O código salvo não abre esta cópia. Reconecte usando o código correto.', 'warning');
    } else {
      setMessage('Não foi possível consultar a nuvem. O modo local continua funcionando.', 'warning');
    }
  }
}

function queueSync() {
  if (LOCAL_ONLY_MODE) return;
  if (!identity) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => upload(), 1200);
}

async function connectWithCode(rawCode) {
  if (LOCAL_ONLY_MODE) throw new Error('local-only-mode');
  const candidate = await deriveContinuityIdentity(rawCode);
  const remote = await api('GET', undefined, candidate);
  if (!remote.exists) throw new Error('continuity-code-not-found');
  let remoteData = null;
  remoteData = await decryptContinuityData(remote.envelope, candidate);

  identity = candidate;
  localStorage.setItem(CODE_KEY, candidate.code);
  localStorage.removeItem(SYNC_KEY);
  if (!hasCloudConsent()) grantCloudConsent();
  renderAccount();

  const local = localSnapshot();
  if (!hasLocalData(local)) {
    applyRemote(remoteData, remote.revision, remote.updatedAt);
  } else {
    remoteConflict = { ...remote, data: remoteData };
    setMessage('Há uma jornada neste aparelho e outra nesse código. Escolha qual manter.', 'warning');
    return 'conflict';
  }
  return 'connected';
}

async function initialize() {
  if (!card) return;
  if (LOCAL_ONLY_MODE) {
    identity = null;
    card.dataset.account = 'local-only';
    document.getElementById('fb-account-email').textContent = '';
    ['fb-account-connect', 'fb-account-show-code', 'fb-account-sync-now', 'fb-account-logout', 'fb-account-cloud-delete']
      .forEach(id => { document.getElementById(id).hidden = true; });
    setMessage('A continuidade entre aparelhos está temporariamente pausada. Seus registros permanecem somente neste aparelho.', 'success');
    setTopStatus(false);
    return;
  }
  const savedCode = localStorage.getItem(CODE_KEY);
  if (savedCode) {
    try {
      identity = await deriveContinuityIdentity(savedCode);
    } catch {
      localStorage.removeItem(CODE_KEY);
    }
  }
  renderAccount();
  if (identity) await initialSync();
}

document.getElementById('fb-account-connect')?.addEventListener('click', () => {
  hideCode();
  setAuthMode('create');
  dialog?.showModal();
});
document.getElementById('fb-account-show-code')?.addEventListener('click', () => {
  setAuthMode('create');
  showCode(identity.code, 'Este é seu código atual. Não envie para outras pessoas.');
  dialog?.showModal();
});
document.getElementById('fb-account-close')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('close', () => {
  document.getElementById('fb-continuity-connect-form')?.reset();
  hideCode();
  setAuthMode(identity ? 'create' : 'create');
});
document.querySelectorAll('[data-fb-auth-mode]').forEach(button => button.addEventListener('click', () => {
  setAuthMode(button.dataset.fbAuthMode);
  if (button.dataset.fbAuthMode === 'create' && identity) {
    showCode(identity.code, 'Este é seu código atual. Não envie para outras pessoas.');
  }
}));

document.getElementById('fb-continuity-input')?.addEventListener('input', event => {
  const input = event.currentTarget;
  input.value = formatContinuityCode(input.value);
  input.setCustomValidity(normalizeContinuityCode(input.value).length === 32
    ? ''
    : 'Digite os 32 caracteres do código.');
});

document.getElementById('fb-continuity-create')?.addEventListener('click', async event => {
  const consent = document.getElementById('fb-continuity-create-consent');
  if (!consent?.checked) {
    consent?.reportValidity();
    authFeedback('Confirme a autorização para criar a continuidade.', 'error');
    return;
  }
  if (identity && !confirm('Criar um novo código? O código atual será desconectado deste aparelho.')) return;
  const button = event.currentTarget;
  setButtonLoading(button, true, 'Criando proteção…');
  try {
    const code = generateContinuityCode();
    identity = await deriveContinuityIdentity(code);
    localStorage.setItem(CODE_KEY, identity.code);
    localStorage.removeItem(SYNC_KEY);
    grantCloudConsent();
    renderAccount();
    showCode(code);
    await upload();
    authFeedback('Código criado. Copie e guarde antes de fechar.', 'success');
  } catch {
    authFeedback('Não foi possível criar o código agora. Tente novamente.', 'error');
  } finally {
    setButtonLoading(button, false);
  }
});

document.getElementById('fb-continuity-copy')?.addEventListener('click', copyCode);
document.getElementById('fb-continuity-connect-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const code = normalizeContinuityCode(form.elements.code.value);
  if (code.length !== 32) {
    form.elements.code.setCustomValidity('Digite os 32 caracteres do código.');
    form.elements.code.reportValidity();
    return;
  }
  if (!form.elements.cloudConsent.checked) {
    form.elements.cloudConsent.reportValidity();
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  setButtonLoading(submit, true, 'Conectando…');
  authFeedback();
  try {
    const result = await connectWithCode(code);
    dialog.close();
    if (result === 'conflict') window.setTimeout(() => conflictDialog?.showModal(), 40);
  } catch (error) {
    const invalid = /inválido|invalid|operation|decrypt|not-found/i.test(String(error?.message || error));
    authFeedback(
      invalid ? 'Código não encontrado ou incorreto. Confira os 32 caracteres.' : 'Não foi possível conectar agora. Tente novamente.',
      'error'
    );
  } finally {
    setButtonLoading(submit, false);
  }
});

document.getElementById('fb-account-sync-now')?.addEventListener('click', () => upload());
document.getElementById('fb-account-logout')?.addEventListener('click', () => {
  localStorage.removeItem(CODE_KEY);
  localStorage.removeItem(SYNC_KEY);
  identity = null;
  renderAccount();
  setMessage('Código desconectado. Os dados continuam neste aparelho.', 'success');
});
document.getElementById('fb-account-cloud-delete')?.addEventListener('click', async () => {
  if (!confirm('Excluir a cópia criptografada da nuvem? Os dados deste aparelho serão mantidos.')) return;
  try {
    await api('DELETE');
    localStorage.removeItem(CODE_KEY);
    localStorage.removeItem(SYNC_KEY);
    identity = null;
    renderAccount();
    setMessage('A cópia da nuvem foi excluída. Este aparelho continua com seus dados.', 'success');
  } catch {
    setMessage('Não foi possível excluir a cópia da nuvem agora.', 'warning');
  }
});
document.getElementById('fb-conflict-use-cloud')?.addEventListener('click', () => {
  if (!remoteConflict?.data) return;
  conflictDialog.close();
  applyRemote(remoteConflict.data, remoteConflict.revision, remoteConflict.updatedAt);
});
document.getElementById('fb-conflict-use-device')?.addEventListener('click', async () => {
  if (!hasCloudConsent()) grantCloudConsent();
  conflictDialog.close();
  await upload({ force: true });
});
document.getElementById('fb-conflict-cancel')?.addEventListener('click', () => conflictDialog?.close());

window.addEventListener('meuCaminhoBe:profile-updated', event => {
  if (!['cloud', 'cloud-consent'].includes(event.detail?.source)) queueSync();
});
window.addEventListener('meuCaminhoBe:tasks-changed', queueSync);
window.addEventListener('meuCaminhoBe:diary-changed', queueSync);
window.addEventListener('meuCaminhoBe:meals-changed', queueSync);
window.addEventListener('meuCaminhoBe:reset', queueSync);
window.addEventListener('online', () => identity && upload());

initialize();
