import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'components/buttons/button';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'interfaces/models/game/server';
import { CreateServerService } from 'services/create-server-service';
import { RandomizerService } from 'services/randomizer-service';
import { useAvailableServers } from 'hooks/use-available-servers';
import { ProgressBar } from 'components/progress-bar';
import { database } from 'database/database';
import { sleep } from 'utils/common';
import { useFormik } from 'formik';

type CreateServerFormValues = Pick<Server, 'seed' | 'name' | 'configuration'>;
type CreateServerModalView = 'configuration' | 'loader';

type CreateServerConfigurationViewProps = {
  onSubmit: (server: Server) => void;
};

const CreateServerConfigurationView: React.FC<CreateServerConfigurationViewProps> = (props) => {
  const { onSubmit } = props;

  const { values, handleSubmit } = useFormik<CreateServerFormValues>({
    initialValues: {
      seed: RandomizerService.generateSeed(),
      name: `server-${RandomizerService.generateSeed(4)}`,
      configuration: {
        tribe: 'gauls',
        mapSize: 200,
        speed: 1,
        difficulty: 1
      }
    },
    validate: (valuesToValidate) => {
      return {};
    },
    onSubmit: (submittedValues) => {
      const id = uuidv4();
      const slug = submittedValues.name;
      onSubmit({
        ...submittedValues,
        id,
        slug,
        startDate: new Date()
      });
    }
  });

  useEffect(() => {
    const id = uuidv4();
    const slug = values.name;
    onSubmit({
      ...values,
      id,
      slug,
      startDate: new Date()
    });
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit">Create server</Button>
    </form>
  );
};

type CreateServerLoaderViewProps = {
  server: Server;
};

const CreateServerLoaderView: React.FC<CreateServerLoaderViewProps> = (props) => {
  const { server } = props;

  const { createServer, deleteServer } = useAvailableServers();

  const { amountOfTables } = database;
  const percentageIncrease = Math.round(100 / amountOfTables);

  const isCreatingServer = useRef<boolean>(false);

  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressHistory, setProgressHistory] = useState<string[]>([]);
  const [hasCreatedServer, setHasCreatedServer] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const updateProgressHistory = (message: string) => {
    setProgressHistory((prev) => [...prev, message]);
  };

  useEffect(() => {
    if (isCreatingServer.current) {
      return;
    }
    isCreatingServer.current = true;
    (async () => {
      const updatePercentage = (percentage: number = percentageIncrease) => {
        setProgressPercentage((prevState) => prevState + percentage);
      };

      const executeStep = async (currentMessage: string, historyMessage: string, promise: () => Promise<void>) => {
        setProgressMessage(currentMessage);
        updatePercentage();
        await promise();
        updateProgressHistory(historyMessage);
      };

      try {
        // Server data
        await executeStep('Creating server data...', 'Created server data.', async () => {
          await createServer(server);
        });
        // Map data
        await executeStep('Creating map data...', 'Created map data.', async () => {
          await CreateServerService.createMapData(server);
        });
        // Bank data
        await executeStep('Creating bank data...', 'Created bank data.', async () => {
          await sleep(300);
        });
        // Hero data
        await executeStep('Creating hero data...', 'Created hero data.', async () => {
          await sleep(300);
        });
        // Reports
        await executeStep('Creating reports...', 'Created reports.', async () => {
          await sleep(300);
        });
        // Quests
        await executeStep('Creating quests...', 'Created quests.', async () => {
          await sleep(300);
        });
        // Achievements
        await executeStep('Creating achievements...', 'Created achievements.', async () => {
          await sleep(300);
        });
        // Event queue
        await executeStep('Creating event queue...', 'Created event queue.', async () => {
          await sleep(300);
        });
        // Effects
        await executeStep('Creating effects...', 'Created effects.', async () => {
          await sleep(300);
        });
        setHasCreatedServer(true);
      } catch (err) {
        setError(err as string);
        await deleteServer(server);
      } finally {
        isCreatingServer.current = false;
      }
    })();
  }, [createServer, deleteServer, percentageIncrease, server]);

  return (
    <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[50%]">
      {error && (
        <>
        </>
      )}
      {!error && (
        <>
          {hasCreatedServer && (
            <p>
              Server created!
            </p>
          )}
          {!hasCreatedServer && (
            <>
              <p>
                {progressMessage}
              </p>
              <ProgressBar value={progressPercentage} />
            </>
          )}
          <ol>
            {progressHistory.map((history: string) => (
              <li>{history}</li>
            ))}
          </ol>

        </>
      )}
    </div>
  );
};

export const CreateServerModalContent: React.FC = () => {
  const [view, setView] = useState<CreateServerModalView>('configuration');
  const [server, setServer] = useState<Server | null>(null);

  const onSubmit = (serverConfig: Server) => {
    setServer(serverConfig);
    setView('loader');
  };

  return (
    <div className="flex flex-col gap-4">
      {view === 'configuration' && (
        <CreateServerConfigurationView onSubmit={onSubmit} />
      )}
      {view === 'loader' && server !== null && (
        <CreateServerLoaderView server={server} />
      )}
    </div>
  );
};
