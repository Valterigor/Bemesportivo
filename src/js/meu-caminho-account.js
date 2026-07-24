import {
  getSettings,
  getUser,
  handleAuthCallback,
  login,
  logout,
  requestPasswordRecovery,
  signup,
  updateUser
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
  if (/email.*not confirmed|confirm.*email/i.test(message)) return 'Confirme seu e-mail antes de entrar. Verifique também a caixa de spam.';
  if (/already registered/i.test(message)) return 'Este e-mail já possui uma conta.';
  if (/signup.*disabled/i.test(message)) return 'A criação de contas ainda não está liberada.';
  if (/rate|too many|429/i.test(message)) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  if (/network|fetch|offline/i.test(message)) return 'Sem conexão com o serviço de acesso. Verifique sua internet e tente novamente.';
  if (/password/i.test(message)) return 'Use uma senha com pelo menos 10 caracteres.';
  return 'Não foi possível concluir agora. Tente novamente em instantes.';
}

function authFeedback(message = '', type = '') {
  const feedback = document.getElementById('fb-auth-feedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = type;
}

function setAuthMode(mode = 'login') {
  if (!dialog) return;
  dialog.dataset.mode = mode;
  document.querySelectorAll('[data-fb-auth-mode][role="tab"]').forEach(item => {
    item.setAttribute('aria-selected', String(item.dataset.fbAuthMode === mode));
  });
  authFeedback();
  const focusTargets = {
    login: '#fb-login-email',
    signup: '#fb-signup-email',
    forgot: '#fb-recovery-email',
    reset: '#fb-reset-password'
  };
  window.setTimeout(() => dialog.querySelector(focusTargets[mode])?.focus(), 40);
}

function setButtonLoading(button, loading, label = 'Aguarde…') {
  if (!button) return;
  button.disabled = loading;
  button.setAttribute('aria-busy', String(loading));
  button.textContent = loading ? label : button.dataset.idleLabel || button.textContent;
}

function passwordScore(value) {
  const password = String(value || '');
  let score = 0;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

function renderPasswordStrength(input) {
  const component = document.querySelector(`[data-fb-strength-for="${input.id}"]`);
  if (!component) return;
  const score = passwordScore(input.value);
  const labels = ['Muito curta', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  component.dataset.score = String(score);
  component.querySelector('small').textContent = input.value
    ? `${labels[score]}. ${score < 3 ? 'Combine mais palavras, números ou símbolos.' : 'Boa escolha para proteger sua conta.'}`
    : 'Use 10 ou mais caracteres, combinando letras, número e símbolo.';
}

function passwordsMatch(form, targetId) {
  const password = form.elements.password.value;
  const confirmation = form.elements.passwordConfirm.value;
  const target = document.getElementById(targetId);
  const matches = password === confirmation;
  if (target) {
    target.textContent = confirmation ? matches ? 'As senhas coincidem.' : 'As senhas não coincidem.' : '';
    target.dataset.valid = String(matches && Boolean(confirmation));
  }
  form.elements.passwordConfirm.setCustomValidity(matches ? '' : 'As senhas precisam ser iguais.');
  return matches;
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
  let confirmedAccount = false;
  try {
    await getSettings();
    available = true;
    const callback = await handleAuthCallback();
    user = callback?.user || await getUser();
    if (callback?.type === 'recovery') {
      renderAccount();
      setAuthMode('reset');
      dialog?.showModal();
      authFeedback('Link validado. Crie sua nova senha para concluir.', 'success');
      return;
    }
    if (callback?.type === 'confirmation') {
      confirmedAccount = true;
    }
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
  if (confirmedAccount) setMessage('E-mail confirmado. Sua conta está conectada e pronta para continuar.', 'success');
}

document.getElementById('fb-account-connect')?.addEventListener('click', () => {
  setAuthMode('login');
  dialog?.showModal();
});
document.getElementById('fb-account-close')?.addEventListener('click', () => dialog?.close());
dialog?.addEventListener('close', () => {
  dialog.querySelectorAll('input[type="password"],input[type="text"][autocomplete*="password"]').forEach(input => {
    input.value = '';
    input.type = 'password';
  });
  dialog.querySelectorAll('[data-fb-password-toggle]').forEach(button => {
    button.textContent = 'Mostrar';
    button.setAttribute('aria-pressed', 'false');
  });
  dialog.querySelectorAll('.fb-password-strength').forEach(component => {
    component.dataset.score = '0';
    component.querySelector('small').textContent = 'Use 10 ou mais caracteres, combinando letras, número e símbolo.';
  });
  dialog.querySelectorAll('.fb-field-validation').forEach(target => {
    target.textContent = '';
    target.removeAttribute('data-valid');
  });
  setAuthMode('login');
});
document.querySelectorAll('[data-fb-auth-mode]').forEach(button => button.addEventListener('click', () => {
  setAuthMode(button.dataset.fbAuthMode);
}));
document.querySelectorAll('[data-fb-password-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    if (!input) return;
    const willShow = input.type === 'password';
    input.type = willShow ? 'text' : 'password';
    button.textContent = willShow ? 'Ocultar' : 'Mostrar';
    button.setAttribute('aria-pressed', String(willShow));
    input.focus({ preventScroll: true });
  });
});
document.querySelectorAll('.fb-password-field input').forEach(input => {
  input.addEventListener('input', () => {
    renderPasswordStrength(input);
    const form = input.closest('form');
    if (form?.elements.passwordConfirm) {
      passwordsMatch(form, form.id === 'fb-signup-form' ? 'fb-signup-match' : 'fb-reset-match');
    }
  });
  input.addEventListener('keyup', event => {
    const warning = input.closest('label')?.querySelector('[data-fb-caps-warning]');
    if (warning) warning.hidden = !event.getModifierState?.('CapsLock');
  });
  input.addEventListener('blur', () => {
    const warning = input.closest('label')?.querySelector('[data-fb-caps-warning]');
    if (warning) warning.hidden = true;
  });
});

document.getElementById('fb-forgot-password')?.addEventListener('click', () => {
  document.getElementById('fb-recovery-email').value = document.getElementById('fb-login-email').value.trim();
  setAuthMode('forgot');
});

document.getElementById('fb-login-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  setButtonLoading(submit, true, 'Entrando…');
  authFeedback();
  try {
    user = await login(form.elements.email.value.trim(), form.elements.password.value);
    if (form.elements.cloudConsent.checked) grantCloudConsent();
    dialog.close();
    renderAccount();
    await initialSync();
  } catch (error) {
    authFeedback(errorMessage(error), 'error');
  } finally {
    setButtonLoading(submit, false);
  }
});

document.getElementById('fb-signup-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!passwordsMatch(form, 'fb-signup-match')) {
    form.elements.passwordConfirm.reportValidity();
    return;
  }
  if (!form.elements.cloudConsent.checked) {
    authFeedback('Confirme a autorização de sincronização para criar a continuidade.', 'error');
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  setButtonLoading(submit, true, 'Criando conta…');
  authFeedback();
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
      setAuthMode('login');
      document.getElementById('fb-login-email').value = form.elements.email.value.trim();
      authFeedback('Conta criada. Enviamos um e-mail de confirmação. Verifique também a caixa de spam.', 'success');
    }
  } catch (error) {
    authFeedback(errorMessage(error), 'error');
  } finally {
    setButtonLoading(submit, false);
  }
});

document.getElementById('fb-recovery-request-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  setButtonLoading(submit, true, 'Enviando…');
  authFeedback();
  try {
    await requestPasswordRecovery(form.elements.email.value.trim());
    setAuthMode('login');
    document.getElementById('fb-login-email').value = form.elements.email.value.trim();
    authFeedback('Se o e-mail estiver cadastrado, você receberá um link seguro. Verifique também a caixa de spam.', 'success');
  } catch (error) {
    authFeedback(errorMessage(error), 'error');
  } finally {
    setButtonLoading(submit, false);
  }
});

document.getElementById('fb-password-reset-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!passwordsMatch(form, 'fb-reset-match')) {
    form.elements.passwordConfirm.reportValidity();
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  setButtonLoading(submit, true, 'Salvando…');
  authFeedback();
  try {
    user = await updateUser({ password: form.elements.password.value });
    dialog.close();
    renderAccount();
    await initialSync();
    setMessage('Senha atualizada e conta conectada com segurança.', 'success');
  } catch (error) {
    authFeedback(errorMessage(error), 'error');
  } finally {
    setButtonLoading(submit, false);
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
