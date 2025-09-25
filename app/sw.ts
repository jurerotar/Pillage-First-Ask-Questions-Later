/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

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
