'use strict';

const CACHE_PREFIX = 'meu-caminho-be-';
const CACHE_NAME = `${CACHE_PREFIX}v105`;
const CORE_SHELL = [
  '/meu-caminho-be',
  '/site-common.css',
  '/css/design-system.css',
  '/css/core/tokens.css',
  '/css/core/primitives.css',
  '/css/components/ui.css',
  '/css/components/privacy-consent.css',
  '/css/components/community-comments.css',
  '/css/coluna-valtinho.css',
  '/css/fala-bem-platform.css',
  '/css/be-ia.css',
  '/css/premium-refinement.css',
  '/css/routine-calendar.css',
  '/css/ui-polish.css',
  '/css/meu-caminho-modern.css',
  '/css/meu-caminho-diary.css',
  '/css/meu-caminho-auth.css',
  '/js/site-common.js',
  '/js/core/routes.js',
  '/js/components/site-navigation.js',
  '/js/components/site-breadcrumb.js',
  '/js/components/site-footer.js',
  '/js/components/privacy-consent.js',
  '/js/components/analytics.js',
  '/js/components/media-quality.js',
  '/js/components/back-to-top.js',
  '/js/components/community-comments.js',
  '/js/components/journey-reset.js',
  '/js/routine-calendar.js',
  '/js/meu-caminho-auth.js',
  '/js/meu-caminho-account.js',
  '/js/coluna-valtinho.js',
  '/js/be-knowledge-library.js',
  '/js/fala-bem-app.js',
  '/js/be-ia.js',
  '/js/meu-caminho-diary.js'
];
const OPTIONAL_SHELL = [
  '/img/logobemoficial.png',
  '/img/app-icon-192.png',
  '/img/app-icon-512.png',
  '/img/app-icon-maskable-512.png',
  '/img/Bem%20Esportivo%20Logo%20Laranja@33x.png',
  '/img/fala-bem-hero-pessoas-optimized.jpg',
  '/img/bruno-rafael-resende-treino-funcional.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    await cache.addAll(CORE_SHELL);
    await Promise.allSettled(OPTIONAL_SHELL.map(asset => cache.add(asset)));
  }));
  self.skipWaiting();
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch (error) { data = {}; }
  event.waitUntil(self.registration.showNotification(data.title || 'Meu Caminho Be', {
    body: data.body || 'Você tem um compromisso planejado para agora.',
    icon: '/img/logobemoficial.png',
    badge: '/img/logobemoficial.png',
    tag: data.tag || 'bem-rotina',
    renotify: false,
    data: { url: data.url || '/meu-caminho-be#agenda' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/meu-caminho-be#agenda', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => client.url.startsWith(self.location.origin));
    if (existing) { existing.navigate(target); return existing.focus(); }
    return self.clients.openWindow(target);
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
    .map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    const isAppNavigation = url.pathname === '/meu-caminho-be.html' || url.pathname === '/meu-caminho-be' || url.pathname.startsWith('/meu-caminho-be/');
    event.respondWith(fetch(request).then(response => {
      if (isAppNavigation && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('/meu-caminho-be', copy));
      }
      return response;
    }).catch(() => {
      if (isAppNavigation) return caches.match('/meu-caminho-be');
      return caches.match(request).then(cached => cached || new Response('Sem conexão. Abra o Meu Caminho Be para continuar offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      }));
    }));
    return;
  }

  const isCriticalAsset = url.pathname.endsWith('.css') || url.pathname.endsWith('.js');
  if (isCriticalAsset) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request, { ignoreSearch: true })));
    return;
  }

  const isCacheableMedia = ['/img/', '/videos/'].some(prefix => url.pathname.startsWith(prefix));
  if (!isCacheableMedia) return;
  event.respondWith(caches.match(request).then(cached => {
    const networkUpdate = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    });
    return cached || networkUpdate;
  }));
});
