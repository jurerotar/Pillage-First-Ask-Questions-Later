import type { Achievement } from 'app/interfaces/models/game/achievement';

export const achievementFactory = ({ ...achievement }: Achievement): Achievement => {
  return {
    ...achievement,
  };
};
