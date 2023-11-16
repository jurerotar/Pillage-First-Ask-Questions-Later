import { Quest } from 'interfaces/models/game/quest';
import { Server } from 'interfaces/models/game/server';
import { globalQuests, villageQuests } from 'assets/quests';
import { Village } from 'interfaces/models/game/village';

type QuestFactoryProps = {
  server: Server;
};

export const questFactory = ({ server, ...quest }: QuestFactoryProps & Omit<Quest, 'serverId'>): Quest => {
  return {
    serverId: server.id,
    ...quest
  };
};

export const newVillageQuestsFactory = ({ server, village }: QuestFactoryProps & { village: Village; }): Quest[] => {
  return villageQuests.map((quest) => questFactory({ server, villageId: village.id, ...quest }));
}

export const globalQuestsFactory = ({ server }: QuestFactoryProps): Quest[] => {
  return globalQuests.map((quest) => questFactory({ server, ...quest }));
}
