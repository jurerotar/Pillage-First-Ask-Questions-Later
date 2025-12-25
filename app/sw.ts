/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

clientsClaim();
cleanupOutdatedCaches();

self.addEventListener('install', (event) => {
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      const isStandalone = clients.some((client) => {
        return (
          client.url.includes('standalone=true') ||
          client.frameType === 'top-level'
        );
      });

      if (isStandalone) {
        precacheAndRoute(self.__WB_MANIFEST);
      }
    }),
  );
});
