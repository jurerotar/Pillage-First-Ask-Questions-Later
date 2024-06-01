import { globalQuests, villageQuests } from 'assets/quests';
import type { Quest } from 'interfaces/models/game/quest';
import type { Village } from 'interfaces/models/game/village';

export const questFactory = ({ ...quest }: Quest): Quest => {
  return {
    ...quest,
  };
};

export const newVillageQuestsFactory = ({ villageId }: { villageId: Village['id'] }): Quest[] => {
  return villageQuests.map((quest) => questFactory({ villageId, ...quest }));
};

export const globalQuestsFactory = (): Quest[] => {
  return globalQuests.map((quest) => questFactory({ ...quest }));
};
