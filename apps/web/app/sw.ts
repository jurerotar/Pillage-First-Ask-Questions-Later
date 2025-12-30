/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

clientsClaim();
cleanupOutdatedCaches();

const handleInstall = async (): Promise<void> => {
  try {
    const allClients = await sw.clients.matchAll();

    const isStandalone = allClients.some((client) => {
      return (
        client.url.includes('standalone=true') ||
        client.frameType === 'top-level'
      );
    });

    if (isStandalone) {
      precacheAndRoute(sw.__WB_MANIFEST);
    }
  } catch (error) {
    console.error('Service worker install handler failed:', error);
  }
};

sw.addEventListener('install', (event) => {
  event.waitUntil(handleInstall());
});
