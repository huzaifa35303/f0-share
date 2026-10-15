// Service Worker for f0-Share PWA
const CACHE_NAME = 'f0-share-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Let browser handle API calls and blob URLs directly
  if (
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('/api/') ||
    event.request.method !== 'GET'
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html')
          }
        })
      )
    })
  )
})
