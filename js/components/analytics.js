const CONSENT_KEY = 'bemEsportivoPrivacyConsentV1';
const CONSENT_VERSION = 2;
const ENDPOINT = '/api/analytics/events';
const ALLOWED_ACTIVITY_TYPES = new Set([
  'community',
  'content',
  'daily',
  'journey',
  'profile',
  'sport',
  'task',
  'tool',
  'video'
]);

let enabled = false;
let pageViewSent = false;
let queue = [];
let flushTimer = 0;

function hasMeasurementConsent() {
  try {
    const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    return consent?.version === CONSENT_VERSION && consent?.measurement === true;
  } catch {
    return false;
  }
}

function pageName() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (path.startsWith('/reportagens/')) return '/reportagens/artigo';
  return path
    .replace(/\.html$/i, '')
    .replace(/^\/reportagem-[a-z0-9-]+$/i, '/reportagens/artigo')
    .slice(0, 80);
}

function scheduleFlush() {
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flush, 1200);
}

function send(payload) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'same-origin',
    keepalive: true
  }).catch(() => {});
}

function flush() {
  window.clearTimeout(flushTimer);
  if (!enabled || !queue.length) return;
  const events = queue.splice(0, 20);
  send({ events });
  if (queue.length) scheduleFlush();
}

export function trackEvent(name, detail = '') {
  if (!enabled || !/^[a-z][a-z0-9_]{1,39}$/.test(String(name))) return;
  queue.push({
    name: String(name),
    page: pageName(),
    detail: String(detail || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32),
    occurredAt: new Date().toISOString()
  });
  if (queue.length >= 10) flush();
  else scheduleFlush();
}

function activate() {
  enabled = hasMeasurementConsent();
  if (enabled && !pageViewSent) {
    pageViewSent = true;
    trackEvent('page_view');
  }
}

function classifyClick(target) {
  const link = target.closest('a');
  if (link?.href.includes('wa.me/')) return ['contact_open', 'whatsapp'];
  if (link?.href.startsWith('mailto:')) return ['contact_open', 'email'];
  if (link?.matches('[href*="/reportagens/"], [href*="reportagem-"]')) return ['content_open', 'reportagem'];
  if (target.closest('#playButton, [data-video-id], .video-card')) return ['video_play', 'beplay'];
  if (target.closest('[data-tool]')) return ['tool_open', target.closest('[data-tool]').dataset.tool];
  if (target.closest('[data-fb-view]')) return ['path_view', target.closest('[data-fb-view]').dataset.fbView];
  return null;
}

export function initAnalytics() {
  activate();

  window.addEventListener('bemEsportivo:privacy-consent', event => {
    enabled = event.detail?.measurement === true;
    if (enabled) activate();
    else {
      queue = [];
      window.clearTimeout(flushTimer);
    }
  });

  document.addEventListener('click', event => {
    const classification = classifyClick(event.target);
    if (classification) trackEvent(classification[0], classification[1]);
  }, { passive: true });

  window.addEventListener('meuCaminhoBe:activity', event => {
    const type = String(event.detail?.type || '');
    if (ALLOWED_ACTIVITY_TYPES.has(type)) trackEvent('path_activity', type);
  });

  window.addEventListener('bemEsportivo:analytics', event => {
    trackEvent(event.detail?.name, event.detail?.detail);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}
