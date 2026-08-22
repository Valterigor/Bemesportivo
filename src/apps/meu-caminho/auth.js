import { createClient } from '@supabase/supabase-js';

const PROFILE_KEY = 'meuCaminhoBeProfileV1';
const TASK_KEY = 'meuCaminhoBeTasksV1';
const DIARY_KEY = 'meuCaminhoBeDiaryV1';
const MEALS_KEY = 'meuCaminhoBeMealsV1';
const GUEST_KEY = 'meuCaminhoBeLocalAccessV1';
const ACCOUNT_SYNC_KEY = 'meuCaminhoBeAccountSyncV1';
const PENDING_REGISTER_KEY = 'meuCaminhoBePendingRegisterV1';
const CONSENT_VERSION = '2026-08-21-account-sync-v2';
const ACCOUNT_TERMS_VERSION = '2026-08-21';
const PASSWORD_MIN_LENGTH = 12;
const JOURNEY_TABLE = 'meu_caminho_journeys';
const CONSENT_TABLE = 'meu_caminho_consent_records';
const LOCAL_ONLY_MODE = document.querySelector('meta[name="be-meu-caminho-mode"]')?.content === 'local-only';

const gateway = document.getElementById('be-auth-gateway');
const card = gateway?.querySelector('.be-auth-card');
const heading = document.getElementById('be-auth-title');
const intro = document.getElementById('be-auth-intro');
const closeButton = document.getElementById('be-auth-close');
const openButton = document.getElementById('be-auth-open');
const publicOptions = gateway?.querySelector('[data-auth-public-options]');
const setupMessage = document.getElementById('be-auth-setup');
const accountEmail = document.getElementById('be-auth-account-email');
const accountStatus = document.getElementById('be-auth-account-status');
const syncChoice = document.getElementById('be-auth-sync-choice');
const syncDisable = document.getElementById('be-auth-sync-disable');
let authClient = null;
let currentSession = null;
let authConfigured = false;
let syncTimer = 0;
let pendingRegistrationAction = null;
let pendingCloudSnapshot = null;
const replayingActions = new WeakSet();

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
    schemaVersion: 6,
    profile,
    tasks: Array.isArray(tasks) ? tasks.slice(-250) : [],
    diary: Array.isArray(diary)
      ? diary.slice(0, 3000).map(({ imageDataUrl, ...entry }) => entry)
      : [],
    meals: Array.isArray(meals) ? meals.slice(-1200) : []
  };
}

function cloudSnapshot() {
  const snapshot = localSnapshot();
  if (!snapshot.profile || typeof snapshot.profile !== 'object') return snapshot;
  const { email, ...profileWithoutAccountEmail } = snapshot.profile;
  return { ...snapshot, profile: profileWithoutAccountEmail };
}

function hasLocalData(snapshot = localSnapshot()) {
  return Boolean(snapshot.profile)
    || snapshot.tasks.length > 0
    || snapshot.diary.length > 0
    || snapshot.meals.length > 0;
}

function applySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  const values = [
    [PROFILE_KEY, snapshot.profile && typeof snapshot.profile === 'object'
      ? { ...snapshot.profile, email: snapshot.profile.email || currentSession?.user?.email || '' }
      : snapshot.profile],
    [TASK_KEY, Array.isArray(snapshot.tasks) ? snapshot.tasks : []],
    [DIARY_KEY, Array.isArray(snapshot.diary) ? snapshot.diary : []],
    [MEALS_KEY, Array.isArray(snapshot.meals) ? snapshot.meals : []]
  ];
  values.forEach(([key, value]) => {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  });
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:profile-updated', {
    detail: { ready: Boolean(snapshot.profile?.objective), source: 'account-cloud' }
  }));
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:tasks-changed'));
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:diary-changed'));
  window.dispatchEvent(new CustomEvent('meuCaminhoBe:meals-changed'));
}

function feedback(form, message = '', state = '') {
  const output = form?.querySelector('[data-auth-feedback]');
  if (!output) return;
  output.textContent = message;
  output.dataset.state = state;
}

function setLoading(button, loading, loadingLabel = 'Aguarde…') {
  if (!button) return;
  button.disabled = loading;
  button.setAttribute('aria-busy', String(loading));
  button.textContent = loading ? loadingLabel : button.dataset.idleLabel || button.textContent;
}

function friendlyError(error) {
  const message = String(error?.message || error || '');
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'Confirme o e-mail enviado antes de entrar.';
  if (/user already registered/i.test(message)) return 'Não foi possível criar a conta. Tente entrar ou recuperar sua senha.';
  if (/password.*(least|characters|weak)/i.test(message)) return `Use uma senha com pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (/rate limit|too many/i.test(message)) return 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.';
  if (/network|fetch/i.test(message)) return 'Não foi possível conectar agora. Confira sua internet.';
  return 'Não foi possível concluir agora. Tente novamente.';
}

function setView(view = 'login') {
  if (!card) return;
  const presentations = {
    login: ['Acesse sua conta', 'Continue sua trajetória esportiva com segurança.'],
    signup: ['Crie sua conta', 'Guarde sua história esportiva e continue em outros aparelhos.'],
    recovery: ['Recupere seu acesso', 'Você receberá um link seguro no e-mail cadastrado.'],
    update: ['Crie uma nova senha', 'Escolha uma senha segura para proteger sua conta.'],
    account: ['Seu acesso', 'Sua conta do Meu Caminho Be está conectada.']
  };
  const [title, description] = presentations[view] || presentations.login;
  card.dataset.authView = view;
  heading.textContent = title;
  intro.textContent = description;
  card.querySelectorAll('[data-auth-panel]').forEach(panel => {
    panel.hidden = panel.dataset.authPanel !== view;
    panel.querySelectorAll?.('[data-auth-feedback]').forEach(output => {
      output.textContent = '';
      output.dataset.state = '';
    });
  });
  publicOptions.hidden = !['login', 'signup'].includes(view);
  if (view === 'signup') {
    publicOptions.querySelector('p').innerHTML = 'Já tem uma conta? <button type="button" data-auth-view-target="login">Entrar</button>';
    bindViewTargets(publicOptions);
  } else if (view === 'login') {
    publicOptions.querySelector('p').innerHTML = 'Não tem uma conta? <button type="button" data-auth-view-target="signup">Cadastre-se</button>';
    bindViewTargets(publicOptions);
  }
  window.setTimeout(() => card.querySelector('[data-auth-panel]:not([hidden]) input')?.focus(), 40);
}

function showGateway(view = currentSession ? 'account' : 'login', { required = false } = {}) {
  if (!gateway) return;
  setView(view);
  closeButton.hidden = required;
  gateway.hidden = false;
  gateway.scrollTop = 0;
  document.body.classList.add('be-auth-locked');
}

function hideGateway() {
  if (!gateway) return;
  gateway.hidden = true;
  document.body.classList.remove('be-auth-locked');
  document.getElementById('fala-bem-app')?.focus?.({ preventScroll: true });
}

function rememberProtectedAction(element, type = 'click') {
  pendingRegistrationAction = { element, type };
  sessionStorage.setItem(PENDING_REGISTER_KEY, '1');
}

function resumeProtectedAction() {
  const pending = pendingRegistrationAction;
  pendingRegistrationAction = null;
  const hadStoredAction = sessionStorage.getItem(PENDING_REGISTER_KEY) === '1';
  sessionStorage.removeItem(PENDING_REGISTER_KEY);
  hideGateway();
  if (!pending?.element?.isConnected) {
    if (hadStoredAction) location.assign('/meu-caminho-be/registrar');
    return;
  }
  replayingActions.add(pending.element);
  if (pending.type === 'submit') pending.element.requestSubmit();
  else pending.element.click();
  window.setTimeout(() => replayingActions.delete(pending.element), 0);
}

function protectedActionTrigger(target) {
  return target?.closest?.([
    '[data-fb-view="registrar"]',
    '[data-be-new-entry]',
    '[data-be-arrival]',
    '[data-fb-now-status]',
    '[data-day-intent]',
    '[data-fb-start-objective]',
    '[data-fb-edit-onboarding]',
    '[data-fb-reset]',
    '[data-be-meal]',
    '[data-be-meal-remove]',
    '[data-be-public-edit]',
    '[data-be-public-remove]',
    '#fb-home-primary',
    '#fb-open-daily-form',
    '#fb-day-guide-done',
    '#fb-now-save-adaptation',
    '#fb-calendar-next',
    '#fb-task-new',
    '#fb-task-day-add',
    '#be-meal-add'
  ].join(','));
}

function protectedForm(form) {
  return new Set([
    'fb-safety-form',
    'be-quick-form',
    'be-ia-form',
    'fb-daily-form',
    'fb-week-review-form',
    'fb-progress-checkin',
    'fb-profile-form',
    'fb-goals-form',
    'platform-question-form',
    'community-form',
    'fb-task-form',
    'be-day-plan-form',
    'be-meal-detail-form',
    'be-public-compose-form',
    'be-entry-form'
  ]).has(form?.id);
}

function accessDecisionMade() {
  return LOCAL_ONLY_MODE || Boolean(currentSession) || localStorage.getItem(GUEST_KEY) === '1';
}

document.addEventListener('click', event => {
  const trigger = protectedActionTrigger(event.target);
  if (!trigger || replayingActions.has(trigger) || accessDecisionMade()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  rememberProtectedAction(trigger);
  showGateway('login');
  intro.textContent = 'Entre para incluir informações na sua trajetória ou escolha continuar apenas neste aparelho.';
}, true);

document.addEventListener('submit', event => {
  const form = event.target;
  if (!protectedForm(form) || replayingActions.has(form) || accessDecisionMade()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  rememberProtectedAction(form, 'submit');
  showGateway('login');
  intro.textContent = 'Entre para incluir informações na sua trajetória ou escolha continuar apenas neste aparelho.';
}, true);

function bindViewTargets(root = document) {
  root.querySelectorAll('[data-auth-view-target]:not([data-auth-bound])').forEach(button => {
    button.dataset.authBound = 'true';
    button.addEventListener('click', () => setView(button.dataset.authViewTarget));
  });
}

function renderSession() {
  const user = currentSession?.user;
  openButton.dataset.authenticated = String(Boolean(user));
  openButton.querySelector('b').textContent = user ? 'Minha conta' : 'Entrar';
  openButton.querySelector('span').textContent = user ? '●' : '○';
  accountEmail.textContent = user?.email || '';
}

async function loadConfiguration() {
  try {
    const response = await fetch('/api/auth-config', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('auth-config-unavailable');
    const config = await response.json();
    if (!config.enabled || !config.url || !config.publishableKey) return config;
    authClient = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
    authConfigured = true;
    const googleButton = document.getElementById('be-auth-google');
    googleButton.hidden = !config.googleEnabled;
    gateway.querySelector('.be-auth-divider').hidden = !config.googleEnabled;
    return config;
  } catch {
    return { enabled: false };
  }
}

function setUnavailable() {
  setupMessage.hidden = false;
  gateway.querySelectorAll('form button[type="submit"], #be-auth-google').forEach(button => {
    button.disabled = true;
  });
}

async function uploadJourney() {
  if (!authClient || !currentSession?.user || !readJSON(ACCOUNT_SYNC_KEY)) return;
  const { error } = await authClient.from(JOURNEY_TABLE).upsert({
    user_id: currentSession.user.id,
    snapshot: cloudSnapshot(),
    consent_version: CONSENT_VERSION,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  if (error) throw error;
  accountStatus.textContent = 'Jornada sincronizada com sua conta.';
}

async function recordSyncConsent(status) {
  if (!authClient || !currentSession?.user) return;
  const { error } = await authClient.from(CONSENT_TABLE).insert({
    user_id: currentSession.user.id,
    purpose: 'account_sync',
    consent_version: CONSENT_VERSION,
    status
  });
  if (error) throw error;
}

function queueJourneyUpload() {
  if (!currentSession || !readJSON(ACCOUNT_SYNC_KEY)) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => uploadJourney().catch(() => {
    accountStatus.textContent = 'A sincronização será tentada novamente quando houver conexão.';
  }), 900);
}

async function prepareAccount() {
  renderSession();
  syncChoice.hidden = true;
  syncDisable.hidden = true;
  accountStatus.textContent = '';
  if (!currentSession?.user || !authClient) return;

  pendingCloudSnapshot = null;

  const { data, error } = await authClient
    .from(JOURNEY_TABLE)
    .select('snapshot, updated_at')
    .eq('user_id', currentSession.user.id)
    .maybeSingle();

  if (error) {
    accountStatus.textContent = 'Sua conta está ativa. A sincronização será liberada após concluir a configuração segura do banco.';
    return;
  }

  const { data: consentRecord, error: consentError } = await authClient
    .from(CONSENT_TABLE)
    .select('status, consent_version, occurred_at')
    .eq('user_id', currentSession.user.id)
    .eq('purpose', 'account_sync')
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (consentError) {
    accountStatus.textContent = 'Sua conta está ativa. A sincronização aguarda a configuração do registro seguro de consentimento.';
    return;
  }

  const localData = localSnapshot();
  const localExists = hasLocalData(localData);
  const syncEnabled = consentRecord?.status === 'granted';
  syncDisable.hidden = !syncEnabled;
  if (syncEnabled) {
    localStorage.setItem(ACCOUNT_SYNC_KEY, JSON.stringify({
      consentVersion: consentRecord.consent_version,
      consentedAt: consentRecord.occurred_at
    }));
  } else {
    localStorage.removeItem(ACCOUNT_SYNC_KEY);
  }
  if (data?.snapshot && !localExists) {
    if (syncEnabled) {
      applySnapshot(data.snapshot);
      accountStatus.textContent = 'Sua jornada foi recuperada nesta conta.';
      window.setTimeout(() => window.location.reload(), 700);
      return;
    }
    pendingCloudSnapshot = data.snapshot;
    syncChoice.hidden = false;
    syncChoice.querySelector('strong').textContent = 'Trazer sua jornada para este aparelho?';
    syncChoice.querySelector('p').textContent = 'Existe uma jornada nesta conta. Nada será baixado até você autorizar.';
    document.getElementById('be-auth-sync-enable').textContent = 'Autorizar e baixar';
    accountStatus.textContent = 'Sua conta está conectada, mas a jornada continua protegida na nuvem.';
    return;
  }
  if (syncEnabled) {
    accountStatus.textContent = data?.snapshot
      ? 'Conta conectada e pronta para sincronizar.'
      : 'Conta conectada. Seus próximos registros serão sincronizados.';
    if (!data?.snapshot && localExists) await uploadJourney();
    return;
  }
  if (localExists) {
    syncChoice.hidden = false;
    syncChoice.querySelector('strong').textContent = 'Levar os dados deste aparelho para sua conta?';
    syncChoice.querySelector('p').textContent = 'Seu perfil, planos, atividades e refeições poderão continuar em outros dispositivos.';
    document.getElementById('be-auth-sync-enable').textContent = 'Salvar na minha conta';
    accountStatus.textContent = data?.snapshot
      ? 'Há dados nesta conta e neste aparelho. Nada será substituído sem sua escolha.'
      : 'Seus dados continuam somente neste aparelho até você autorizar.';
  }
}

async function handleAuthenticated(session, { openAccount = false } = {}) {
  currentSession = session;
  localStorage.removeItem(GUEST_KEY);
  renderSession();
  await prepareAccount();
  if (openAccount) showGateway('account');
  else hideGateway();
}

function validatePasswordPair(form) {
  const password = form.elements.password.value;
  const confirmation = form.elements.passwordConfirm.value;
  if (password.length < PASSWORD_MIN_LENGTH) {
    form.elements.password.setCustomValidity(`Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
    form.elements.password.reportValidity();
    return false;
  }
  form.elements.password.setCustomValidity('');
  if (password !== confirmation) {
    form.elements.passwordConfirm.setCustomValidity('As senhas precisam ser iguais.');
    form.elements.passwordConfirm.reportValidity();
    return false;
  }
  form.elements.passwordConfirm.setCustomValidity('');
  return true;
}

document.getElementById('be-auth-login-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity() || !authClient) return;
  const submit = form.querySelector('[type="submit"]');
  setLoading(submit, true, 'Entrando…');
  feedback(form);
  try {
    const { data, error } = await authClient.auth.signInWithPassword({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value
    });
    if (error) throw error;
    await handleAuthenticated(data.session, { openAccount: true });
    form.reset();
  } catch (error) {
    feedback(form, friendlyError(error), 'error');
  } finally {
    setLoading(submit, false);
  }
});

document.getElementById('be-auth-signup-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity() || !validatePasswordPair(form) || !authClient) return;
  const submit = form.querySelector('[type="submit"]');
  setLoading(submit, true, 'Criando conta…');
  feedback(form);
  try {
    const { data, error } = await authClient.auth.signUp({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
      options: {
        emailRedirectTo: `${location.origin}/meu-caminho-be?conta=confirmada`,
        data: {
          display_name: form.elements.name.value.trim(),
          terms_version: ACCOUNT_TERMS_VERSION,
          privacy_version: ACCOUNT_TERMS_VERSION,
          terms_accepted_at: new Date().toISOString()
        }
      }
    });
    if (error) throw error;
    if (data.session) await handleAuthenticated(data.session, { openAccount: true });
    else feedback(form, 'Conta criada. Confira seu e-mail para confirmar o acesso.', 'success');
  } catch (error) {
    feedback(form, friendlyError(error), 'error');
  } finally {
    setLoading(submit, false);
  }
});

document.getElementById('be-auth-recovery-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity() || !authClient) return;
  const submit = form.querySelector('[type="submit"]');
  setLoading(submit, true, 'Enviando…');
  try {
    const { error } = await authClient.auth.resetPasswordForEmail(form.elements.email.value.trim(), {
      redirectTo: `${location.origin}/meu-caminho-be?redefinir-senha=1`
    });
    if (error) throw error;
    feedback(form, 'Se o e-mail estiver cadastrado, enviaremos o link de recuperação.', 'success');
  } catch (error) {
    feedback(form, friendlyError(error), 'error');
  } finally {
    setLoading(submit, false);
  }
});

document.getElementById('be-auth-update-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity() || !validatePasswordPair(form) || !authClient) return;
  const submit = form.querySelector('[type="submit"]');
  setLoading(submit, true, 'Salvando…');
  try {
    const { error } = await authClient.auth.updateUser({ password: form.elements.password.value });
    if (error) throw error;
    feedback(form, 'Senha atualizada. Seu acesso está protegido.', 'success');
    window.setTimeout(() => setView('account'), 700);
  } catch (error) {
    feedback(form, friendlyError(error), 'error');
  } finally {
    setLoading(submit, false);
  }
});

document.getElementById('be-auth-google')?.addEventListener('click', async () => {
  if (!authClient) return;
  const { error } = await authClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/meu-caminho-be?conta=google` }
  });
  if (error) setupMessage.textContent = friendlyError(error);
});

document.querySelectorAll('[data-password-toggle]').forEach(button => button.addEventListener('click', () => {
  const field = document.getElementById(button.dataset.passwordToggle);
  if (!field) return;
  const visible = field.type === 'text';
  field.type = visible ? 'password' : 'text';
  button.setAttribute('aria-label', visible ? 'Mostrar senha' : 'Ocultar senha');
}));

document.getElementById('be-auth-local')?.addEventListener('click', () => {
  localStorage.setItem(GUEST_KEY, '1');
  resumeProtectedAction();
});
document.getElementById('be-auth-continue')?.addEventListener('click', resumeProtectedAction);
document.getElementById('be-auth-close')?.addEventListener('click', () => {
  pendingRegistrationAction = null;
  sessionStorage.removeItem(PENDING_REGISTER_KEY);
  hideGateway();
});
openButton?.addEventListener('click', () => showGateway(currentSession ? 'account' : 'login'));
document.getElementById('be-auth-signout')?.addEventListener('click', async () => {
  if (authClient) await authClient.auth.signOut();
  currentSession = null;
  localStorage.removeItem(ACCOUNT_SYNC_KEY);
  renderSession();
  setView('login');
});
document.getElementById('be-auth-delete-account')?.addEventListener('click', async event => {
  if (!authClient || !currentSession?.access_token || !currentSession.user?.email) return;
  const typedEmail = window.prompt('Para excluir sua conta e os dados sincronizados, digite o e-mail da conta:');
  if (typedEmail === null) return;
  if (typedEmail.trim().toLocaleLowerCase('pt-BR') !== currentSession.user.email.toLocaleLowerCase('pt-BR')) {
    accountStatus.textContent = 'O e-mail informado não corresponde à conta conectada.';
    return;
  }
  if (!window.confirm('Esta exclusão é definitiva. Os dados mantidos somente neste aparelho continuarão aqui. Deseja excluir a conta?')) return;
  const button = event.currentTarget;
  setLoading(button, true, 'Excluindo conta…');
  accountStatus.textContent = 'Confirmando sua identidade e excluindo os dados sincronizados…';
  try {
    const response = await fetch('/api/account/delete', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Não foi possível excluir a conta agora.');
    await authClient.auth.signOut({ scope: 'local' }).catch(() => {});
    currentSession = null;
    localStorage.removeItem(ACCOUNT_SYNC_KEY);
    renderSession();
    setView('login');
    feedback(document.getElementById('be-auth-login-form'), 'Conta e dados sincronizados excluídos. Os dados deste aparelho foram mantidos.', 'success');
  } catch (error) {
    accountStatus.textContent = error.message;
  } finally {
    setLoading(button, false);
  }
});
document.getElementById('be-auth-sync-enable')?.addEventListener('click', async () => {
  const consent = document.getElementById('be-auth-sync-consent');
  if (!consent.checked) {
    consent.reportValidity();
    accountStatus.textContent = 'Confirme a autorização antes de sincronizar.';
    return;
  }
  try {
    await recordSyncConsent('granted');
    localStorage.setItem(ACCOUNT_SYNC_KEY, JSON.stringify({
      consentVersion: CONSENT_VERSION,
      consentedAt: new Date().toISOString()
    }));
    if (pendingCloudSnapshot) {
      applySnapshot(pendingCloudSnapshot);
      pendingCloudSnapshot = null;
      accountStatus.textContent = 'Sua jornada foi recuperada nesta conta.';
      window.setTimeout(() => window.location.reload(), 700);
      return;
    }
    await uploadJourney();
    syncChoice.hidden = true;
    syncDisable.hidden = false;
  } catch {
    localStorage.removeItem(ACCOUNT_SYNC_KEY);
    accountStatus.textContent = 'Não foi possível sincronizar agora. Tente novamente.';
  }
});
syncDisable?.addEventListener('click', async () => {
  if (!window.confirm('Parar a sincronização? A cópia já salva permanecerá protegida na conta até você excluí-la.')) return;
  try {
    await recordSyncConsent('revoked');
    localStorage.removeItem(ACCOUNT_SYNC_KEY);
    syncDisable.hidden = true;
    accountStatus.textContent = 'Sincronização interrompida. Novas alterações ficarão somente neste aparelho.';
  } catch {
    accountStatus.textContent = 'Não foi possível interromper a sincronização agora. Tente novamente.';
  }
});
document.getElementById('be-auth-sync-later')?.addEventListener('click', () => {
  syncChoice.hidden = true;
  accountStatus.textContent = 'Seus dados continuam somente neste aparelho.';
});

['meuCaminhoBe:profile-updated', 'meuCaminhoBe:tasks-changed', 'meuCaminhoBe:diary-changed', 'meuCaminhoBe:meals-changed']
  .forEach(eventName => window.addEventListener(eventName, event => {
    if (event.detail?.source !== 'account-cloud') queueJourneyUpload();
  }));
window.addEventListener('online', queueJourneyUpload);

async function initialize() {
  if (!gateway || !card) return;
  if (LOCAL_ONLY_MODE) {
    localStorage.setItem(GUEST_KEY, '1');
    localStorage.removeItem(ACCOUNT_SYNC_KEY);
    sessionStorage.removeItem(PENDING_REGISTER_KEY);
    pendingRegistrationAction = null;
    currentSession = null;
    openButton.hidden = true;
    setupMessage.hidden = false;
    setupMessage.textContent = 'Acesso livre temporário: registros, diário e perfil ficam somente neste aparelho.';
    hideGateway();
    return;
  }
  bindViewTargets();
  const config = await loadConfiguration();
  if (!authConfigured) setUnavailable();
  if (authClient) {
    authClient.auth.onAuthStateChange((event, session) => {
      currentSession = session;
      renderSession();
      if (event === 'PASSWORD_RECOVERY') showGateway('update', { required: true });
      if (event === 'SIGNED_OUT') setView('login');
    });
    const { data } = await authClient.auth.getSession();
    currentSession = data.session;
    if (currentSession) await prepareAccount();
  }
  renderSession();
  const recovery = new URLSearchParams(location.search).has('redefinir-senha');
  if (recovery && authConfigured) showGateway('update', { required: true });
  else hideGateway();
  if (!config?.googleEnabled) document.getElementById('be-auth-google').hidden = true;
}

initialize();
