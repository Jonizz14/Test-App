// Service Worker for API Caching and Offline Support
const CACHE_NAME = 'testapp-cache-v1';
const API_CACHE_NAME = 'testapp-api-cache-v1';

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  // Cache static assets for 30 days
  STATIC: 30 * 24 * 60 * 60 * 1000,
  
  // Cache API responses for different durations based on endpoint
  API: {
    // User data - cache for 5 minutes
    '/users/': 5 * 60 * 1000,
    '/users/me/': 5 * 60 * 1000,
    '/users/profile/': 5 * 60 * 1000,
    
    // Test data - cache for 10 minutes
    '/tests/': 10 * 60 * 1000,
    '/questions/': 10 * 60 * 1000,
    '/attempts/': 10 * 60 * 1000,
    
    // Session data - cache for 2 minutes (more dynamic)
    '/sessions/': 2 * 60 * 1000,
    
    // Static data - cache for 30 minutes
    '/pricing/': 30 * 60 * 1000,
    '/star-packages/': 30 * 60 * 1000,
    '/gifts/': 30 * 60 * 1000,
    
    // Statistics - cache for 1 minute
    '/statistics/': 1 * 60 * 1000,
    '/stats/': 1 * 60 * 1000,
    
    // Default API cache duration
    DEFAULT: 5 * 60 * 1000
  }
};

// Endpoints that should never be cached
const NO_CACHE_ENDPOINTS = [
  '/login/',
  '/register/',
  '/token/refresh/',
  '/sessions/start_session/',
  '/sessions/complete_session/',
  '/users/ban_user/',
  '/users/unban_user/',
  '/attempts/create/'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache the app shell and essential files
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json'
        ]);
      })
      .then(() => {
        console.log('[SW] Essential files cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache-first strategy for GET, network-first for others
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Skip caching for POST, PUT, PATCH, DELETE requests
  if (request.method !== 'GET') {
    try {
      return await fetch(request);
    } catch (error) {
      console.error('[SW] Network request failed:', error);
      return new Response(JSON.stringify({ error: 'Network request failed' }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Skip caching for specific endpoints
  if (NO_CACHE_ENDPOINTS.some(endpoint => pathname.includes(endpoint))) {
    try {
      return await fetch(request);
    } catch (error) {
      console.error('[SW] Network request failed:', error);
      return new Response(JSON.stringify({ error: 'Network request failed' }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  const cacheKey = `${request.method}-${pathname}`;
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Check cache first
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time')).getTime();
      const now = Date.now();
      const cacheDuration = getCacheDuration(pathname);
      
      if (now - cachedTime < cacheDuration) {
        console.log('[SW] Serving from cache:', pathname);
        
        // Return cached response with cache info
        const response = cachedResponse.clone();
        response.headers.set('X-Served-From', 'cache');
        return response;
      } else {
        console.log('[SW] Cache expired, removing:', pathname);
        await cache.delete(cacheKey);
      }
    }
    
    // Fetch from network
    console.log('[SW] Fetching from network:', pathname);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(cacheKey, cachedResponse);
      console.log('[SW] Cached response:', pathname);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Request failed:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      console.log('[SW] Serving stale cache as fallback:', pathname);
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'stale-cache');
      return response;
    }
    
    // Return offline response
    return new Response(JSON.stringify({ 
      error: 'Network unavailable',
      offline: true,
      message: 'Ma\'lumotlar internet aloqasi yo\'qligi sababli yuklanmadi'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static requests (pages, assets) with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    
    // Return cached version if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Return generic offline response
    return new Response('Offline - Internet aloqasi yo\'q', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Get cache duration for a specific endpoint
function getCacheDuration(pathname) {
  // Find matching endpoint
  for (const [endpoint, duration] of Object.entries(CACHE_DURATIONS.API)) {
    if (pathname.includes(endpoint)) {
      return duration;
    }
  }
  
  return CACHE_DURATIONS.API.DEFAULT;
}

// Handle cache cleanup and maintenance
async function cleanupCache() {
  const cache = await caches.open(API_CACHE_NAME);
  const cacheKeys = await cache.keys();
  const now = Date.now();
  
  for (const request of cacheKeys) {
    const response = await cache.match(request);
    const cachedTime = new Date(response.headers.get('sw-cached-time')).getTime();
    const pathname = new URL(request.url).pathname;
    const cacheDuration = getCacheDuration(pathname);
    
    if (now - cachedTime > cacheDuration) {
      console.log('[SW] Cleaning expired cache:', pathname);
      await cache.delete(request);
    }
  }
}

// Run cache cleanup periodically
setInterval(cleanupCache, 15 * 60 * 1000); // Every 15 minutes

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME);
      caches.delete(API_CACHE_NAME);
      console.log('[SW] All caches cleared');
      break;
      
    case 'CLEAR_API_CACHE':
      caches.delete(API_CACHE_NAME);
      console.log('[SW] API cache cleared');
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Get cache status for debugging
async function getCacheStatus() {
  const cache = await caches.open(API_CACHE_NAME);
  const cacheKeys = await cache.keys();
  const now = Date.now();
  
  const cacheInfo = cacheKeys.map(request => {
    const url = new URL(request.url);
    const response = cache.match(request);
    return {
      url: url.pathname,
      method: request.method,
      cachedTime: response.headers.get('sw-cached-time'),
      age: now - new Date(response.headers.get('sw-cached-time')).getTime()
    };
  });
  
  return {
    cacheName: API_CACHE_NAME,
    totalEntries: cacheKeys.length,
    entries: cacheInfo
  };
}

console.log('[SW] Service worker loaded');