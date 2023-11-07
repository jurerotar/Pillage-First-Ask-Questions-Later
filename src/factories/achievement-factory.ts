import { Achievement } from 'interfaces/models/game/achievement';
import { Server } from 'interfaces/models/game/server';

type AchievementFactoryProps = {
  server: Server;
}
export const achievementFactory = ({ server: { id: serverId } }: AchievementFactoryProps): Achievement => {

  return {
    serverId,
    achievementId: '',
    isCompleted: false,
    achievedAt: null,
  }
};
