import { Server } from 'interfaces/models/game/server';
import { database } from 'database/database';
import { useAsyncLiveQuery } from 'hooks/database/use-async-live-query';
import { Village } from 'interfaces/models/game/village';

export const usePlayerVillages = (serverId: Server['id']) => {
  const {
    data: villages
  } = useAsyncLiveQuery<Village[]>(async () => {
    return database.villages.where({ serverId }).toArray();
  }, [serverId], []);

  return {
    villages
  };
};
