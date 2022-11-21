import React from 'react';
import { Server } from 'interfaces/models/game/server';
import { useLocalStorage } from 'utils/hooks/use-local-storage';
import localforage from 'localforage';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components/common/buttons/button';

type ServerCardProps = {
  server: Server;
  selectServerHandler: (server: Server) => void;
};

export const ServerCard: React.FC<ServerCardProps> = (props) => {
  const {
    server,
    selectServerHandler
  } = props;

  const navigate = useNavigate();

  const [servers, setServers] = useLocalStorage<Server[]>('servers', []);

  const selectServer = (s: Server): void => {
    selectServerHandler(s);
    navigate('/resources');
  };

  const deleteServer = async (serverId: Server['id']): Promise<void> => {
    setServers(servers.filter((s: Server) => s.id !== serverId));
    const keysInStorage = await localforage.keys();
    keysInStorage.forEach((key: string) => {
      if (key.startsWith(serverId)) {
        localforage.removeItem(key);
      }
    });
  };

  return (
      <div
        key={server.id}
        className="relative flex w-fit gap-16 rounded-md border border-gray-400 bg-transparent px-4 py-2"
      >
        <div className="flex flex-col gap-2">
          <span className="text-2xl font-semibold">
            {server.name}
          </span>
          <span className="flex gap-1 text-xs">
            <span className="font-semibold">
              Server id:
            </span>
            <span>
              {server.id}
            </span>
          </span>
          <span className="flex gap-1 text-xs">
            <span className="font-semibold">
              Server start date:
            </span>
            <span>
              {server.startDate.toString()}
            </span>
          </span>
        </div>
        <Button onClick={() => selectServer(server)}>
          Enter server
        </Button>
        <button
          type="button"
          className="absolute -top-2 -right-2 flex items-center justify-center rounded-full border border-gray-400 bg-white p-2"
          onClick={() => deleteServer(server.id)}
        >
          <span className="h-2 w-2 leading-none">
            x
          </span>
        </button>
      </div>
  );
};
