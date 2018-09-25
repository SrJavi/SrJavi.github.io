// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'ternium-v1';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
    './index.html',
    './',
    './?utm=homescreen',
    './index.html?utm=homescreen',
    './lib/bootstrap/dist/css/bootstrap.css',
    './lib/fontawesome/css/font-awesome.css',
    './lib/sweetalert2/sweetalert2.min.css',
    './styles/styles.css',
    './lib/fontawesome/fonts/fontawesome-webfont.woff',
    './favicon.ico',
    './images/icon192x192.png',
    './images/icon512x512.png',
    './lib/jquery/dist/jquery.js',
    './lib/bootstrap/dist/js/bootstrap.js',
    './lib/jquery-ui/jquery-ui.js',
    './lib/sweetalert2/sweetalert2.min.js',
    './scripts/main.js'
];

// The install handler takes care of precaching the resources we always need.
//skipWaiting forza al SW a activarse
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
      .catch(error => console.log(error.message) )
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'syncTest') {
    event.waitUntil(getAllVagons());
  }
});

function getAllVagons() {
  //Comprobamos todas las pestañas abiertas y les enviamos postMessage
  self.clients.matchAll({includeUncontrolled: true})
    .then(all => {
      return all.map(client => {
        return client.postMessage('syncTest')
      })
    })
    .catch( err => console.log(err) )
}