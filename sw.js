'use strict';

const CACHE_NAME = 'meu-caminho-be-v7';
const APP_SHELL = [
  '/coluna-valtinho.html',
  '/site-common.css',
  '/css/coluna-valtinho.css',
  '/css/fala-bem-platform.css',
  '/js/site-common.js',
  '/js/coluna-valtinho.js',
  '/js/fala-bem-app.js',
  '/img/logobemoficial.png',
  '/img/Bem%20Esportivo%20Logo%20Laranja@33x.png',
  '/img/fala-bem-hero-pessoas-optimized.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
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
    }).catch(() => caches.match(request).then(cached => cached || caches.match('/coluna-valtinho.html'))));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  })));
});
