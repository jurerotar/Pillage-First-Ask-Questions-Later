import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'components/common/buttons/button';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'interfaces/models/game/server';
import { CreateServerService } from 'services/create-server-service';
import { useLocalStorage } from 'utils/hooks/use-local-storage';
import { Tribe } from 'interfaces/models/game/tribe';
import { RandomizerService } from 'services/randomizer-service';
import { useContextSelector } from 'use-context-selector';
import { ModalContext } from 'providers/global/modal-context';
import { ApplicationContext } from 'providers/global/application-context';

export const CreateServerModalContent: React.FC = () => {
  const { t } = useTranslation();
  const closeModal = useContextSelector(ModalContext, (v) => v.closeModal);

  const serverName = useRef<string>('');
  const serverSeed = useRef<string>('');
  const selectedTribe = useRef<Tribe>('gauls');

  const setServers = useContextSelector(ApplicationContext, (v) => v.setServers);

  const createNewServer = async (): Promise<void> => {
    const a = RandomizerService.generateSeed();
    // Create a random name if user hasn't set one themselves
    const name = serverName.current !== '' ? serverName.current : `server_${a}`;
    const seed = serverSeed.current !== '' ? serverSeed.current : a;
    const tribe = selectedTribe.current;

    try {
      const id = uuidv4();
      const serverConfiguration: Server = {
        id,
        name,
        seed,
        startDate: new Date(),
        configuration: {
          mapSize: 200,
          speed: 1,
          difficulty: 1,
          tribe
        }
      };
      const server = new CreateServerService(serverConfiguration);
      const result = await server.init(seed);
      console.log(result);
      if (result) {
        setServers((prevState: Server[]) => [...prevState, serverConfiguration]);
      }
    } catch (e) {
      console.error('Error creating a new server', e);
    } finally {
      closeModal();
    }
  };

  return (
    <div className="flex flex-col">
      <h2>
        Create new server
      </h2>
      <form>
        <Button onClick={createNewServer}>
          Create new server
        </Button>
      </form>
    </div>
  );
};
