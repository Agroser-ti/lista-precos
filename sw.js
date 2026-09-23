// Service Worker do app Gestão de Equipamentos (Agroser)
// Guarda em cache a "casca" do app para abrir mesmo sem internet.
// Suba este arquivo junto com index.html na raiz do repositório.

var CACHE = 'agroser-v1';
var ARQUIVOS_BASE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ARQUIVOS_BASE).catch(function () {
        // Se algum arquivo falhar (ex: ainda não subiu), não trava a instalação.
      });
    })
  );
});

self.addEventListener('activate', function (e) {
  self.clients.claim();
  e.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(
        nomes.filter(function (n) { return n !== CACHE; })
             .map(function (n) { return caches.delete(n); })
      );
    })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  // Chamadas para o Google Apps Script (dados da planilha) sempre vão para a
  // rede — nunca guardamos os produtos em cache do Service Worker (isso já
  // é feito à parte, no localStorage, pelo próprio app).
  if (e.request.url.indexOf('script.google.com') !== -1) return;

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetchPromise = fetch(e.request).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});
