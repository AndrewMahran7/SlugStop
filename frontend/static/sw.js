// SlugStop Service Worker - Offline-First Transit Experience
const CACHE_NAME = 'slugstop-v1.2.0';
const STATIC_CACHE = 'slugstop-static-v1.2.0';
const DYNAMIC_CACHE = 'slugstop-dynamic-v1.2.0';

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/home.css',
  '/static/rider_smart.css',
  '/static/track_premium.css',
  '/static/trip_planner.css',
  '/static/home.js',
  '/static/rider_smart.js',
  '/static/track_premium.js',
  '/static/trip_planner.js',
  '/static/manifest.json',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  // Map resources
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Routes and data that should be cached with network-first strategy
const DYNAMIC_ROUTES = [
  '/api/metro/routes',
  '/api/location',
  '/health'
];

// Routes that work offline with cached data
const OFFLINE_FALLBACK_ROUTES = [
  '/rider',
  '/track',
  '/trip-planner',
  '/metro'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache offline fallback pages
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Caching offline fallbacks...');
        return Promise.all(
          OFFLINE_FALLBACK_ROUTES.map(route => {
            return fetch(route).then(response => {
              if (response.ok) {
                return cache.put(route, response.clone());
              }
            }).catch(err => {
              console.log(`[SW] Could not cache ${route}:`, err);
            });
          })
        );
      })
    ]).then(() => {
      console.log('[SW] Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome extension requests
  if (request.method !== 'GET' || 
      url.protocol === 'chrome-extension:' ||
      url.protocol === 'moz-extension:') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request.url)) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request));
  } else if (isDynamicRoute(request.url)) {
    // Network-first for dynamic data
    event.respondWith(networkFirst(request));
  } else if (isAPIRequest(request.url)) {
    // Network-first with offline fallback for API requests
    event.respondWith(networkFirstWithFallback(request));
  } else if (isPageRequest(request)) {
    // Network-first with offline page fallback
    event.respondWith(pageRequest(request));
  } else {
    // Default network-first strategy
    event.respondWith(networkFirst(request));
  }
});

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first failed:', error);
    throw error;
  }
}

// Network-first strategy (for dynamic content)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network-first with offline fallback
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } else {
      throw new Error(`Network response not ok: ${networkResponse.status}`);
    }
  } catch (error) {
    console.log('[SW] API request failed, checking cache:', error);
    
    // Try to get cached response
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to the response
      const response = cachedResponse.clone();
      const data = await response.json();
      data._offline = true;
      data._cachedAt = new Date().toISOString();
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cached': 'true',
          'X-Offline': 'true'
        }
      });
    }
    
    // Return offline fallback data
    return createOfflineFallback(request);
  }
}

// Handle page requests with offline fallback
async function pageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error(`Page request failed: ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] Page request failed, serving cached version:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Serve offline page
    return caches.match('/') || new Response(
      createOfflinePage(),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Create offline fallback responses
function createOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/routes')) {
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Route data unavailable offline. Please check your connection.',
      routes: [],
      _offline: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.pathname.includes('/etas')) {
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Real-time data unavailable offline.',
      etas: [],
      _offline: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({
    error: 'Offline',
    message: 'This feature requires an internet connection.',
    _offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Create offline page HTML
function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline | SlugStop</title>
      <style>
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 2rem;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .offline-content {
          max-width: 400px;
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 2rem;
        }
        .btn {
          background: #ffd700;
          color: #2d3748;
          padding: 1rem 2rem;
          border: none;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 2rem;
        }
      </style>
    </head>
    <body>
      <div class="offline-content">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>SlugStop needs an internet connection for real-time bus data. Some cached information may still be available.</p>
        <button class="btn" onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;
}

// Helper functions
function isStaticAsset(url) {
  return url.includes('/static/') || 
         url.includes('googleapis.com') ||
         url.includes('cdnjs.cloudflare.com') ||
         url.includes('unpkg.com') ||
         url.includes('leaflet');
}

function isDynamicRoute(url) {
  return DYNAMIC_ROUTES.some(route => url.includes(route));
}

function isAPIRequest(url) {
  return url.includes('/api/');
}

function isPageRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  } else if (event.tag === 'sync-trip-history') {
    event.waitUntil(syncTripHistory());
  }
});

async function syncFavorites() {
  try {
    // Get pending favorites from IndexedDB and sync with server
    console.log('[SW] Syncing favorites...');
    // Implementation would sync local favorites with server
  } catch (error) {
    console.log('[SW] Failed to sync favorites:', error);
  }
}

async function syncTripHistory() {
  try {
    console.log('[SW] Syncing trip history...');
    // Implementation would sync trip history with server
  } catch (error) {
    console.log('[SW] Failed to sync trip history:', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Your bus is arriving soon!',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/static/icons/action-view.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/static/icons/action-close.png'
      }
    ]
  };
  
  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.data = { ...options.data, ...payload.data };
  }
  
  event.waitUntil(
    self.registration.showNotification('SlugStop', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/track')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

console.log('[SW] Service Worker script loaded');
