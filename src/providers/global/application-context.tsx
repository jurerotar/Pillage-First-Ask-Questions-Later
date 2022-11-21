import React, { ReactElement, useState } from 'react';
import { createContext } from 'use-context-selector';
import { Server } from 'interfaces/models/game/server';
import { useLocalStorage } from 'utils/hooks/use-local-storage';

type ApplicationProviderValues = {
  servers: Server[];
  setServers: React.Dispatch<React.SetStateAction<Server[]>>;
  selectedServer: Server | null;
  setSelectedServer: React.Dispatch<React.SetStateAction<Server | null>>;
};

type ApplicationProviderProps = {
  children: React.ReactNode;
};

const ApplicationContext = createContext<ApplicationProviderValues>({} as ApplicationProviderValues);

const ApplicationProvider: React.FC<ApplicationProviderProps> = (props): ReactElement => {
  const {
    children
  } = props;

  const [servers, setServers] = useLocalStorage<Server[]>('servers', []);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  const value: ApplicationProviderValues = {
    servers,
    setServers,
    selectedServer,
    setSelectedServer
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export {
  ApplicationContext,
  ApplicationProvider
};
