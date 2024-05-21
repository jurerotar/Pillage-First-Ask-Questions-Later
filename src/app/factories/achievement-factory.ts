import type { Achievement } from 'interfaces/models/game/achievement';
import type { Server } from 'interfaces/models/game/server';

type AchievementFactoryProps = {
  server: Server;
} & Omit<Achievement, 'serverId'>;

export const achievementFactory = ({ server, ...achievement }: AchievementFactoryProps): Achievement => {
  return {
    serverId: server.id,
    ...achievement,
  };
};
