// Incrementing OFFLINE_VERSION will kick off the install event and force
// previously cached resources to be updated from the network.
const OFFLINE_VERSION = 1;
const OFFLINE_CACHE_NAME = 'offline';
// Customize this with a different URL if needed.
const OFFLINE_URL = 'offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    // Setting {cache: 'reload'} in the new request will ensure that the response
    // isn't fulfilled from the HTTP cache; i.e., it will be from the network.
    await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Enable navigation preload if it's supported.
    // See https://developers.google.com/web/updates/2017/02/navigation-preload
    if ('navigationPreload' in self.registration) {
      await self.registration.navigationPreload.enable();
    }
  })());

  // Tell the active service worker to take control of the page immediately.
  self.clients.claim();
});

self.addEventListener('push', function (e) {
  const data = e.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    badge: "/oldui/favicon.ico",
    icon: "/oldui/pigonicon.png",
    data: {
      url: data.url // Add a custom property to hold the URL
    }
  });
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Close the notification when clicked
  const url = event.notification.data.url;
  if (url) {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Check if the URL is already open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If the URL is not open, open a new tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  // We only want to call event.respondWith() if this is a navigation request
  // for an HTML page.

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // First, try to use the navigation preload response if it's supported.
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }

        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        // catch is only triggered if an exception is thrown, which is likely
        // due to a network error.
        // If fetch() returns a valid HTTP response with a response code in
        // the 4xx or 5xx range, the catch() will NOT be called.
        console.log('Fetch failed; returning offline page instead.', error);

        const cache = await caches.open(OFFLINE_CACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        return cachedResponse;
      }
    })());
  }

  // If our if() condition is false, then this fetch handler won't intercept the
  // request. If there are any other fetch handlers registered, they will get a
  // chance to call event.respondWith(). If no fetch handlers call
  // event.respondWith(), the request will be handled by the browser as if there
  // were no service worker involvement.
});

//Cache handling
const CACHE_NAME = 'webapp-cache';
const VERSION_URL = '/api/v1/cacheversion'; // URL to fetch the version number
const ASSETS = [
  '/oldui/',
  '/oldui/webui/'
];

// Install event: Cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate event: Clean old caches if necessary
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event: Serve assets from cache or fetch from the network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// Function to check version and update cache
async function updateCacheIfVersionChanged() {
  try {
    const response = await fetch(VERSION_URL);
    if (!response.ok) throw new Error('Failed to fetch version');
    const newVersion = await response.text();

    // Compare with stored version
    const storedVersion = await caches.match(VERSION_URL)?.then((res) => res?.text());
    if (newVersion !== storedVersion) {
      console.log("Updating cache...");
      // Clear old cache
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      await cache.put(VERSION_URL, new Response(newVersion));
    }
  } catch (error) {
    console.error('Error updating cache:', error);
  }
}

// Periodically check for version updates
setInterval(updateCacheIfVersionChanged, 60 * 60 * 1000); // Check every hour

updateCacheIfVersionChanged();

setInterval(() => {
  console.log("Updating...");
  self.registration.update();
  console.log("Update finished");
}, 1000 * 60 * 10);

//cache pfp
let pfpCache = async () => {
  let cache = await caches.open("PFP");
  await cache.add("/api/v1/auth/pfp");
}

pfpCache();