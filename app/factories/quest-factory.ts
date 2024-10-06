import { globalQuests, villageQuests } from 'app/assets/quests';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Village } from 'app/interfaces/models/game/village';

export const questFactory = ({ ...quest }: Quest): Quest => {
  return {
    ...quest,
  };
};

const newVillageQuestsFactory = (villageId: Village['id']): Quest[] => {
  return villageQuests.map((quest) => questFactory({ villageId, ...quest }));
};

const globalQuestsFactory = (): Quest[] => {
  return globalQuests.map((quest) => questFactory({ ...quest }));
};

export const generateQuests = (villageId: Village['id']) => {
  const villageQuests = newVillageQuestsFactory(villageId);
  const globalQuests = globalQuestsFactory();
  return [...villageQuests, ...globalQuests];
};
