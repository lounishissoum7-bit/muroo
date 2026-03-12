// Fichier : public/sw.js
// Service Worker MURO by L&Y — Offline support + cache
const CACHE_NAME    = 'muro-v1'
const STATIC_CACHE  = 'muro-static-v1'
const DYNAMIC_CACHE = 'muro-dynamic-v1'

// Assets à précacher
const PRECACHE_URLS = [
  '/',
  '/simulation',
  '/boutique',
  '/devis',
  '/manifest.json',
]

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing MURO service worker…')
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Precaching static assets')
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Precache failed (normal en dev):', err)
      })
    })
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating…')
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k)
            return caches.delete(k)
          })
      )
    )
  )
  self.clients.claim()
})

// ── Fetch — Stale-While-Revalidate ───────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, non-same-origin, WebXR, camera API
  if (
    request.method !== 'GET' ||
    !url.origin.includes(self.location.origin) ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('.glb')   // modèles 3D : toujours réseau
  ) return

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached) // offline fallback

      // Retourne le cache immédiatement si disponible, màj en fond
      return cached || networkFetch
    })
  )
})

// ── Background sync (devis WhatsApp) ─────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-devis') {
    event.waitUntil(
      // Retry WhatsApp message si offline au moment de l'envoi
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_DEVIS' }))
      })
    )
  }
})

// ── Push notifications (future: promo Oran) ──────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'MURO by L&Y', {
      body:  data.body  || 'Nouvelle offre disponible',
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data:  { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
