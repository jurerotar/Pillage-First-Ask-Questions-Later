/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

clientsClaim();
cleanupOutdatedCaches();

const handleInstall = async (): Promise<void> => {
  try {
    const allClients = await self.clients.matchAll();

    const isStandalone = allClients.some((client) => {
      return (
        client.url.includes('standalone=true') ||
        client.frameType === 'top-level'
      );
    });

    if (isStandalone) {
      precacheAndRoute(self.__WB_MANIFEST);
    }
  } catch (err) {
    console.error('Service worker install handler failed:', err);
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(handleInstall());
});
