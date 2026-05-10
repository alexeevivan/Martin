const CACHE_NAME = 'martin-cache-v1';

// Эти файлы кэшируем сразу при установке
const PRECACHE_ASSETS = [
	'/Martin/',
	'/Martin/bundle.js',
	'/Martin/three.bundle.js',
	'/Martin/vendors.bundle.js',
	'/Martin/styles.css',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(PRECACHE_ASSETS);
		})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	// Удаляем старые кэши
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			);
		})
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((cached) => {
			// Если есть в кэше — отдаём сразу
			if (cached) return cached;

			return fetch(event.request).then((response) => {
				// Кэшируем все статические ресурсы
				if (
					event.request.method === 'GET' &&
					(
						event.request.url.match(/\.(js|css|webp|jpg|png|gif|svg|mp4|mp3|woff2?)$/i) ||
						event.request.url.includes('dropbox')
					)
				) {
					const responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseClone);
					});
				}
				return response;
			});
		})
	);
});