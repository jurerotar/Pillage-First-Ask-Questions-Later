import { Server } from 'interfaces/models/game/server';
import { useLiveQuery } from 'dexie-react-hooks';
import { database } from 'database/database';

export const useAvailableServers = () => {
  const availableServers = useLiveQuery<Server[], Server[]>(async () => {
    return database.servers.toArray();
  }, [], []);

  const createServer = async (server: Server) => {
    await database.servers.add(server, server.id);
  };

  const deleteServer = async (server: Server) => {
    await database.servers.delete(server.id);
  };

  return {
    availableServers,
    createServer,
    deleteServer
  };
};
