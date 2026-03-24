const CACHE_NAME = 'martin-cache-v1';
const ASSETS_TO_CACHE = [
	'/',
	'/bundle.js',
	'/styles.css',
];

// Установка — кэшируем основные файлы
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS_TO_CACHE);
		})
	);
});

// Fetch — отдаём из кэша если есть, иначе загружаем и кэшируем
self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;

			return fetch(event.request).then((response) => {
				// Кэшируем видео и аудио
				if (
					event.request.url.match(/\.(mp4|webm|mp3|wav)$/i) ||
					event.request.url.includes('dropbox')
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