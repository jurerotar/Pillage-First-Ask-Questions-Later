import React from 'react';
import useLocalStorage from 'utils/hooks/use-local-storage';
import { Server } from 'interfaces/models/game/server';
import Button from 'components/common/buttons/button';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import CreateServerService from 'services/create-server-service';
import * as localforage from 'localforage';
import Paragraph from 'components/common/paragraph';
import AppHelmet from 'components/common/head/app-helmet';

type HomeViewProps = {
  selectServerHandler: (server: Server) => void;
};

// TODO: Implement automatic redirect to server if server name is in the url
// useEffect(() => {
//   // Try to get server name from url to try to redirect user to the server directly
//   const [serverName, villageName, page] = window.location.pathname.split('/')
//     .filter((path, index) => index !== 0);
//   console.log(serverName, villageName, page);
//   if (!(serverName && villageName)) {
//     navigate('/');
//   }
//   const serverData: Server | undefined = servers.find((server: Server) => server.name === serverName);
//   if (!serverData) {
//     navigate('/');
//   }
//   // Validate villageName
//   const village = serverData!.gameData.playerVillages.find((playerVillage: Village) => playerVillage.name === villageName);
//   navigate(`/${serverName}/${vi}`);
//
// }, []);

const HomeView: React.FC<HomeViewProps> = (props): JSX.Element => {
  const { selectServerHandler } = props;

  const navigate = useNavigate();
  const [servers, setServers] = useLocalStorage<Server[]>('servers', []);

  const createNewServer = async (): Promise<void> => {
    try {
      const serverId = uuidv4();
      const serverConfiguration: Server = {
        id: serverId,
        name: `server_${servers.length}`,
        startDate: new Date(),
        configuration: {
          mapSize: 200,
          speed: 1,
          difficulty: 1,
          tribe: 'gauls'
        }
      };
      const server = new CreateServerService(serverConfiguration);
      await server.init();
      setServers([serverConfiguration, ...servers]);
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
    selectServerHandler(server);
    navigate('/resources');
  };

  return (
    <>
      {/* <AppHelmet viewName="home" /> */}
      <main className="h-screen w-full pt-16">
        {/* Background vector */}
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          viewBox="0 0 533.1 324"
          className="absolute top-0 left-0 h-[50vh] lg:h-auto lg:w-2/3"
        >
          <path
            className="transition-colors duration-default fill-gray-400 dark:fill-neutral-800"
            d="M0,324c0,0,12.9-0.5,27-5.7c14.1-5.2,34.9-17.2,48-28.1s27.6-16.7,54.7-25.5c27.1-8.9,44.3-23.5,57.3-32.3
          s36-15.1,48.5-24.5c12.5-9.4,21.9-16.7,34.4-28.7c12.5-12,38.1-26.1,52.6-37.5c14.6-11.5,32.8-25.5,49-38.1s55.3-37.5,68.8-44.3
          c13.5-6.8,28.7-19.3,45.9-30.2C503.4,18,524.8,8.6,533.1,0L0,0L0,324z"
          />
        </svg>

        <div className="container mx-auto flex flex-col lg:flex-row gap-4 relative">
          <div className="flex flex-col gap-2 min-h-[40vh] justify-center p-4 flex-1">
            <h1 className="text-3xl font-permanent-marker transition-colors duration-default dark:text-white">
              Crylite
            </h1>
            <h2 className="text-xl font-permanent-marker transition-colors duration-default dark:text-white">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            </h2>
            <Paragraph>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid assumenda, blanditiis consequatur, culpa dolorem doloremque
              dolorum ea, et excepturi exercitationem facere iure mollitia nihil officia quas sunt unde velit voluptate.
            </Paragraph>
            <Button onClick={createNewServer}>
              Create new server
            </Button>
          </div>
          <div className="flex flex-col gap-4 flex-1">
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
        </div>
      </main>
    </>
  );
};

export default HomeView;
