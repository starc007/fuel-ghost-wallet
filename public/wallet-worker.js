self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("message", (event) => {
  // Broadcast to all clients except sender
  clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      if (client.id !== event.source.id) {
        client.postMessage(event.data);
      }
    });
  });
});
