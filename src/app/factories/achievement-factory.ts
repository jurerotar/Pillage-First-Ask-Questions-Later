import type { Achievement } from 'interfaces/models/game/achievement';

export const achievementFactory = ({ ...achievement }: Achievement): Achievement => {
  return {
    ...achievement,
  };
};
