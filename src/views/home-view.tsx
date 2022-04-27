import React, { useEffect } from 'react';
import useLocalStorage from 'helpers/hooks/use-local-storage';
import { Server } from 'interfaces/models/game/server';
import Button from 'components/common/button';
import { v4 as uuidv4 } from 'uuid';
import { useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game-context';
import { useNavigate } from 'react-router-dom';
import { Tile } from 'interfaces/models/game/tile';
import CreateServerService from 'services/create-server-service';
import * as localforage from 'localforage';
import { Village } from 'interfaces/models/game/village';
import { Hero } from 'interfaces/models/game/hero';

const HomeView: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const setServerId = useContextSelector(GameContext, (v) => v.setServer);
  const hasGameDataLoaded = useContextSelector(GameContext, (v) => v.hasGameDataLoaded);
  const [servers, setServers] = useLocalStorage<Server[]>('servers', []);

  useEffect(() => {
    if (hasGameDataLoaded) {
      navigate('/map');
    }
  }, [hasGameDataLoaded]);

  const createNewServer = async (): Promise<void> => {
    try {
      const serverId = uuidv4();
      const server: Server = {
        id: serverId,
        name: `server_${servers.length}`,
        startDate: new Date(),
        configuration: {
          mapSize: 200,
          speed: 1,
          difficulty: 1
        }
      };
      const tiles: Tile[] = CreateServerService.createMapData(server.configuration.mapSize);
      const heroData: Hero = {
        name: 'Unnamed hero',
        inventory: {}
      };

      await localforage.setItem<Tile[]>(`${serverId}-mapData`, tiles);
      await localforage.setItem<Village[]>(`${serverId}-playerVillageData`, []);
      await localforage.setItem<Hero>(`${serverId}-heroData`, heroData);
      setServers([server, ...servers]);
    } catch (e) {
      console.error('Error creating a new server', e);
    }
  };

  const deleteServer = async (serverId: Server['id']): Promise<void> => {
    setServers(servers.filter((server: Server) => server.id !== serverId));
    const keysInStorage = await localforage.keys();
    keysInStorage.forEach((key: string) => {
      if (key.startsWith(serverId)) {
        localforage.removeItem(key);
      }
    });
  };

  const selectServer = (server: Server): void => {
    setServerId(server);
  };

  return (
    <main className="h-screen w-full bg-gray-100">
      <div className="container mx-auto flex flex-col gap-4">
        Home page
        <div className="flex flex-col gap-4">
          {servers.map((server: Server) => (
            <div
              key={server.id}
              className="flex border border-gray-400 px-4 py-2 rounded-md bg-transparent w-fit relative gap-16"
            >
              <div className="flex flex-col gap-2">
                <span className="text-2xl font-semibold">
                  {server.name}
                </span>
                <span className="text-xs flex gap-1">
                  <span className="font-semibold">
                    Server id:
                  </span>
                  <span>
                    {server.id}
                  </span>
                </span>
                <span className="text-xs flex gap-1">
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
                className="absolute flex justify-center items-center rounded-full border border-gray-400 bg-white -top-2 -right-2 p-2"
                onClick={() => deleteServer(server.id)}
              >
                <span className="w-2 h-2 leading-none">
                  x
                </span>
              </button>
            </div>
          ))}
        </div>
        <Button onClick={createNewServer}>
          Create new server
        </Button>
      </div>
    </main>
  );
};

export default HomeView;
