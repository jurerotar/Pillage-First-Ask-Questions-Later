import type { QueryClient } from '@tanstack/react-query';
import type { QuestWithStatus } from 'app/interfaces/models/game/quest';

type QuestsWorkerPayload = {
  client: QueryClient;
};

export type QuestsWorkerReturn = {
  completedQuestIds: QuestWithStatus[];
};

self.addEventListener('message', async (event: MessageEvent<QuestsWorkerPayload>) => {
  const { client } = event.data;

  self.postMessage({
    completedQuestIds: [],
  })
});
