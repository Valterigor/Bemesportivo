'use strict';

const CACHE_NAME = 'meu-caminho-be-v39';
const APP_SHELL = [
  '/meu-caminho-be',
  '/site-common.css?v=20260723-1',
  '/css/design-system.css?v=20260723-1',
  '/css/core/tokens.css?v=20260723-1',
  '/css/core/primitives.css?v=20260718-1',
  '/css/components/ui.css?v=20260722-1',
  '/css/coluna-valtinho.css?v=20260721-1',
  '/css/fala-bem-platform.css?v=20260722-2',
  '/css/components/privacy-consent.css',
  '/css/premium-refinement.css?v=20260723-1',
  '/css/photo-checkin.css?v=20260723-1',
  '/css/routine-calendar.css?v=20260722-1',
  '/js/site-common.js?v=20260723-1',
  '/js/core/routes.js',
  '/js/components/site-navigation.js?v=20260723-1',
  '/js/components/site-breadcrumb.js',
  '/js/components/site-footer.js?v=20260723-1',
  '/js/components/privacy-consent.js',
  '/js/components/media-quality.js?v=20260723-1',
  '/js/photo-checkin.js?v=20260723-1',
  '/js/routine-calendar.js?v=20260722-1',
  '/js/components/back-to-top.js',
  '/js/coluna-valtinho.js?v=20260722-2',
  '/js/fala-bem-app.js?v=20260722-2',
  '/img/logobemoficial.png',
  '/img/Bem%20Esportivo%20Logo%20Laranja@33x.png',
  '/img/fala-bem-hero-pessoas-optimized.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
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
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('/meu-caminho-be'))));
    return;
  }

  const isCriticalAsset = url.pathname.endsWith('.css') || url.pathname.endsWith('.js');
  if (isCriticalAsset) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(caches.match(request).then(cached => {
    const networkUpdate = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    });
    return cached || networkUpdate;
  }));
});
