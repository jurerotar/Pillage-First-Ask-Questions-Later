/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

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
  } catch (error) {
    console.error('Service worker install handler failed:', error);
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(handleInstall());
});
