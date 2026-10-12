
const CACHE_NAME = "tutor-teo-pwa-v2";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of APP_SHELL) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn("Não foi possível armazenar:", url, error);
        }
      }
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("tutor-teo-pwa-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Não intercepta APIs, outros domínios ou requisições que não sejam GET.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();

          // Falhas no cache não devem impedir a resposta da página.
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch((error) => console.warn("Falha no cache:", error))
          );
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        if (request.mode === "navigate") {
          const fallback = await caches.match("/index.html");
          if (fallback) return fallback;
        }

        return new Response("Você está sem conexão. Tente novamente.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
  );
});
