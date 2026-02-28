import type { EventApiNotificationEvent } from '@pillage-first/types/api-events';

export let broadcastChannel: BroadcastChannel | null = null;

export const setBroadcastChannel = (channel: BroadcastChannel | null) => {
  broadcastChannel = channel;
};

export const broadcast = (message: EventApiNotificationEvent) => {
  broadcastChannel?.postMessage(message);
  globalThis.postMessage(message);
};
