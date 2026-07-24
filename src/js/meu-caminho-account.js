import {
  getSettings,
  getUser,
  handleAuthCallback,
  login,
  logout,
  signup
} from '@netlify/identity';

const PROFILE_KEY = 'meuCaminhoBeProfileV1';
const TASK_KEY = 'meuCaminhoBeTasksV1';
const SYNC_KEY = 'meuCaminhoBeSyncStateV1';
const CONSENT_VERSION = '2026-07-23';
const endpoint = '/api/meu-caminho-sync';

const card = document.getElementById('fb-account-card');
const dialog = document.getElementById('fb-account-dialog');
const conflictDialog = document.getElementById('fb-sync-conflict-dialog');
const status = document.getElementById('fb-account-status');
const topStatus = document.getElementById('fb-connectivity-status');
let user = null;
let available = false;
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
  return { profile, tasks: Array.isArray(tasks) ? tasks.slice(-250) : [] };
}

function syncState() {
  return readJSON(SYNC_KEY, { revision: 0, updatedAt: null });
}

function setSyncState(next) {
  localStorage.setItem(SYNC_KEY, JSON.stringify(next));
}

function hasLocalData(snapshot = localSnapshot()) {
  return Boolean(snapshot.profile) || snapshot.tasks.length > 0;
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
      consentedAt: new Date().toISOString()
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

function renderAccount() {
  if (!card) return;
  card.dataset.account = user ? 'connected' : available ? 'available' : 'unavailable';
  document.getElementById('fb-account-email').textContent = user?.email || '';
  document.getElementById('fb-account-connect').hidden = Boolean(user) || !available;
  document.getElementById('fb-account-sync-now').hidden = !user;
  document.getElementById('fb-account-logout').hidden = !user;
  document.getElementById('fb-account-cloud-delete').hidden = !user;

  if (user) {
    setMessage('Conta conectada. Suas alterações podem continuar em outros aparelhos.', 'success');
    if (topStatus) topStatus.innerHTML = '<i aria-hidden="true"></i>Dados sincronizados';
  } else if (available) {
    setMessage('Seus dados continuam somente neste aparelho até você conectar uma conta.');
    if (topStatus) topStatus.innerHTML = '<i aria-hidden="true"></i>Dados ficam neste aparelho';
  } else {
    setMessage('A continuidade entre aparelhos ainda precisa ser ativada na hospedagem.', 'warning');
  }
}

function errorMessage(error) {
  const message = String(error?.message || '');
  if (/invalid login|credentials|email or password/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/already registered/i.test(message)) return 'Este e-mail já possui uma conta.';
  if (/signup.*disabled/i.test(message)) return 'A criação de contas ainda não está liberada.';
  if (/password/i.test(message)) return 'Use uma senha com pelo menos 10 caracteres.';
  return 'Não foi possível concluir agora. Tente novamente em instantes.';
}

async function api(method = 'GET', body) {
  const response = await fetch(endpoint, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
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
  setSyncState({ revision, updatedAt });
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:tasks-imported'));
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:profile-updated', {
    detail: { ready: Boolean(data?.profile?.objective), source: 'cloud' }
  }));
  location.reload();
}

async function upload({ force = false } = {}) {
  if (!user || syncing) {
    queued = Boolean(user);
    return;
  }
  const snapshot = localSnapshot();
  if (snapshot.profile && !hasCloudConsent(snapshot.profile)) {
    setMessage('Confirme o consentimento de sincronização antes de enviar seus dados.', 'warning');
    dialog?.showModal();
    return;
  }

  syncing = true;
  setMessage('Sincronizando com segurança…');
  try {
    const result = await api('PUT', {
      data: snapshot,
      baseRevision: syncState().revision,
      force
    });
    if (result.conflict) {
      remoteConflict = result;
      conflictDialog?.showModal();
      setMessage('Existem alterações em outro aparelho. Escolha qual versão manter.', 'warning');
      return;
    }
    setSyncState({ revision: result.revision, updatedAt: result.updatedAt });
    setMessage('Tudo sincronizado agora.', 'success');
    if (topStatus) topStatus.innerHTML = '<i aria-hidden="true"></i>Dados sincronizados';
  } catch {
    setMessage('Seus dados continuam seguros neste aparelho. A sincronização será tentada novamente.', 'warning');
  } finally {
    syncing = false;
    if (queued) {
      queued = false;
      window.setTimeout(() => upload(), 500);
    }
  }
}

async function initialSync() {
  if (!user) return;
  setMessage('Verificando sua continuidade…');
  try {
    const remote = await api();
    const local = localSnapshot();
    if (!remote.exists) {
      if (hasLocalData(local)) await upload();
      else setMessage('Conta conectada. Seu primeiro registro será sincronizado automaticamente.', 'success');
      return;
    }
    if (!hasLocalData(local)) {
      applyRemote(remote.data, remote.revision, remote.updatedAt);
      return;
    }
    const state = syncState();
    if (state.revision === remote.revision) {
      setMessage('Tudo sincronizado agora.', 'success');
      return;
    }
    remoteConflict = remote;
    conflictDialog?.showModal();
    setMessage('Encontramos dados neste aparelho e na nuvem. Escolha qual versão manter.', 'warning');
  } catch {
    setMessage('Não foi possível consultar a nuvem. O modo local continua funcionando.', 'warning');
  }
}

function queueSync() {
  if (!user) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => upload(), 1200);
}

async function initialize() {
  if (!card) return;
  try {
    await getSettings();
    available = true;
    const callback = await handleAuthCallback();
    user = callback?.user || await getUser();
  } catch {
    try {
      user = await getUser();
      available = Boolean(user);
    } catch {
      available = false;
    }
  }
  renderAccount();
  if (user) await initialSync();
}

document.getElementById('fb-account-connect')?.addEventListener('click', () => dialog?.showModal());
document.getElementById('fb-account-close')?.addEventListener('click', () => dialog?.close());
document.querySelectorAll('[data-fb-auth-mode]').forEach(button => button.addEventListener('click', () => {
  dialog.dataset.mode = button.dataset.fbAuthMode;
  document.querySelectorAll('[data-fb-auth-mode]').forEach(item => {
    item.setAttribute('aria-selected', String(item === button));
  });
}));

document.getElementById('fb-login-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    user = await login(form.elements.email.value.trim(), form.elements.password.value);
    if (form.elements.cloudConsent.checked) grantCloudConsent();
    dialog.close();
    renderAccount();
    await initialSync();
  } catch (error) {
    document.getElementById('fb-auth-feedback').textContent = errorMessage(error);
  } finally {
    submit.disabled = false;
  }
});

document.getElementById('fb-signup-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById('fb-auth-feedback');
  if (!form.elements.cloudConsent.checked) {
    feedback.textContent = 'Confirme a autorização de sincronização para criar a continuidade.';
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    grantCloudConsent();
    await signup(form.elements.email.value.trim(), form.elements.password.value, {
      full_name: localSnapshot().profile?.name || ''
    });
    user = await getUser();
    if (user) {
      dialog.close();
      renderAccount();
      await initialSync();
    } else {
      feedback.textContent = 'Conta criada. Confirme o e-mail recebido para entrar e sincronizar.';
    }
  } catch (error) {
    feedback.textContent = errorMessage(error);
  } finally {
    submit.disabled = false;
  }
});

document.getElementById('fb-account-sync-now')?.addEventListener('click', () => upload());
document.getElementById('fb-account-logout')?.addEventListener('click', async () => {
  await logout();
  user = null;
  localStorage.removeItem(SYNC_KEY);
  renderAccount();
});
document.getElementById('fb-account-cloud-delete')?.addEventListener('click', async () => {
  if (!confirm('Excluir a cópia sincronizada da sua conta? Os dados deste aparelho serão mantidos.')) return;
  try {
    await api('DELETE');
    localStorage.removeItem(SYNC_KEY);
    await logout();
    user = null;
    renderAccount();
    setMessage('A cópia da nuvem foi excluída e a conta foi desconectada. Este aparelho continua com seus dados.', 'success');
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
window.addEventListener('meuCaminhoBe:reset', queueSync);
window.addEventListener('online', () => user && upload());

initialize();
