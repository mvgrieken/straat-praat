/**
 * Service Worker voor Straat-Praat - Offline functionaliteit
 */

const CACHE_NAME = 'straat-praat-v1';
const STATIC_CACHE = 'straat-praat-static-v1';
const DYNAMIC_CACHE = 'straat-praat-dynamic-v1';

// Statische assets om te cachen
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints om te cachen
const API_CACHE_PATTERNS = [
  '/api/words',
  '/api/user-progress',
  '/api/quiz'
];

// Install event - cache statische assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching statische assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Cache installatie mislukt:', error);
      })
  );
});

// Activate event - cleanup oude caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Verwijderen oude cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

// Fetch event - network first met cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls - network first met cache fallback
  if (isApiRequest(url.pathname)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Statische assets - cache first met network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Overige requests - network first
  event.respondWith(fetch(request));
});

/**
 * Check of het een API request is
 */
function isApiRequest(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

/**
 * Check of het een statisch asset is
 */
function isStaticAsset(pathname) {
  return STATIC_ASSETS.some(asset => pathname === asset || pathname.startsWith('/static/'));
}

/**
 * Handle API requests met network first strategie
 */
async function handleApiRequest(request) {
  try {
    // Probeer eerst network request
    const networkResponse = await fetch(request);
    
    // Cache succesvolle responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request mislukt, probeer cache:', error);
    
    // Fallback naar cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Geen cache beschikbaar, return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline mode - geen verbinding beschikbaar',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle statische assets met cache first strategie
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Static asset fetch mislukt:', error);
    return new Response('Offline - Asset niet beschikbaar', { status: 503 });
  }
}

/**
 * Background sync voor offline data
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

/**
 * Sync offline data wanneer verbinding hersteld is
 */
async function syncOfflineData() {
  try {
    // Haal offline data op uit IndexedDB
    const offlineData = await getOfflineData();
    
    if (offlineData.length > 0) {
      console.log('Syncing offline data:', offlineData.length, 'items');
      
      // Sync elk offline item
      for (const item of offlineData) {
        try {
          await syncOfflineItem(item);
          await removeOfflineData(item.id);
        } catch (error) {
          console.error('Sync item mislukt:', error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync mislukt:', error);
  }
}

/**
 * Haal offline data op uit IndexedDB
 */
async function getOfflineData() {
  // Implementeer IndexedDB logica hier
  return [];
}

/**
 * Sync een offline item
 */
async function syncOfflineItem(item) {
  // Implementeer sync logica hier
  console.log('Syncing item:', item);
}

/**
 * Verwijder gesyncde offline data
 */
async function removeOfflineData(id) {
  // Implementeer verwijder logica hier
  console.log('Removing offline data:', id);
}

/**
 * Push notifications
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle specifieke acties
    console.log('Notification action clicked:', event.action);
  } else {
    // Open app bij klik op notification
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
