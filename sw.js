// Service worker de l'application Bassin : rend l'application installable et
// garde une copie de la page pour l'ouvrir même avec un réseau capricieux.
// La page est toujours rechargée depuis le site quand c'est possible, pour
// que les mises à jour soient prises en compte tout de suite.
const CACHE = 'bassin-v1';
const FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(noms => Promise.all(noms.filter(n => n !== CACHE).map(n => caches.delete(n)))));
  self.clients.claim();
});

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.origin !== location.origin) return;
  ev.respondWith(
    fetch(ev.request)
      .then(reponse => {
        const copie = reponse.clone();
        caches.open(CACHE).then(c => c.put(ev.request, copie));
        return reponse;
      })
      .catch(() => caches.match(ev.request))
  );
});
