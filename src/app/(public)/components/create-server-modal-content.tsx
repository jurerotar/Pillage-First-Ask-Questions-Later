import React, { useCallback, useState } from 'react';
import { Button } from 'components/buttons/button';
import { Server } from 'interfaces/models/game/server';
import { useAvailableServers } from 'hooks/use-available-servers';
import { ProgressBar } from 'components/progress-bar';
import { database } from 'database/database';
import { useFormik } from 'formik';
import { Tile } from 'interfaces/models/game/tile';
import { serverFactory } from 'factories/server-factory';
import { researchLevelsFactory } from 'factories/research-levels-factory';
import { bankFactory } from 'factories/bank-factory';
import { heroFactory } from 'factories/hero-factory';
import { Village } from 'interfaces/models/game/village';
import { v4 as uuidv4 } from 'uuid';

type CreateServerFormValues = Pick<Server, 'seed' | 'name' | 'configuration' | 'playerConfiguration'>;
type CreateServerModalView = 'configuration' | 'loader';

type CreateServerConfigurationViewProps = {
  onSubmit: (server: Server) => void;
};

const generateSeed = (length: number = 10): string => {
  return uuidv4().replaceAll('-', '').substring(0, length);
};

const CreateServerConfigurationView: React.FC<CreateServerConfigurationViewProps> = (props) => {
  const { onSubmit } = props;

  const {
    values,
    handleSubmit,
    submitForm
  } = useFormik<CreateServerFormValues>({
    initialValues: {
      seed: generateSeed(),
      name: `s-${generateSeed(4)}`,
      configuration: {
        mapSize: 100,
        speed: 1
      },
      playerConfiguration: {
        tribe: 'gauls'
      }
    },
    validate: (valuesToValidate) => {
      return {};
    },
    onSubmit: (submittedValues) => {
      const server = serverFactory({ ...submittedValues });
      onSubmit(server);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex flex-col gap-4">
          <h3>Server configuration</h3>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-seed">Server seed</label>
            <input
              id="server-configuration-seed"
              defaultValue={values.seed}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-name">Server name</label>
            <input
              id="server-configuration-name"
              defaultValue={values.name}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3>Game configuration</h3>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-world-size">World size</label>
            <input
              id="server-configuration-world-size"
              defaultValue={values.configuration.mapSize}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-tribe">Tribe</label>
            <input
              id="server-configuration-tribe"
              defaultValue={values.playerConfiguration.tribe}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-speed">Game speed</label>
            <input
              id="server-configuration-speed"
              defaultValue={values.configuration.speed}
            />
          </div>
        </div>
      </div>
      <Button
        type="submit"
        onClick={submitForm}
      >
        Create server
      </Button>
    </form>
  );
};

type CreateServerLoaderViewProps = {
  progressMessage: string;
  progressHistory: string[];
  progressPercentage: number;
  hasCreatedServer: boolean;
  errorMessage: string | null;
};

const CreateServerLoaderView: React.FC<CreateServerLoaderViewProps> = (props) => {
  const {
    progressMessage,
    progressHistory,
    progressPercentage,
    hasCreatedServer,
    errorMessage
  } = props;

  return (
    <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[50%]">
      {!!errorMessage && (
        <span>
          {errorMessage.toString()}
        </span>
      )}
      {!errorMessage && (
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
              <li key={history}>{history}</li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
};

export const CreateServerModalContent: React.FC = () => {
  const {
    createServer,
    deleteServer
  } = useAvailableServers();

  const [view, setView] = useState<CreateServerModalView>('configuration');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressHistory, setProgressHistory] = useState<string[]>([]);
  const [hasCreatedServer, setHasCreatedServer] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { amountOfTables } = database;
  const percentageIncrease = Math.round(100 / amountOfTables);

  const updateProgressHistory = (message: string) => {
    setProgressHistory((prev) => [...prev, message]);
  };

  const onSubmit = useCallback((server: Server) => {
    setView('loader');

    (async () => {
      const updatePercentage = (percentage: number = percentageIncrease) => {
        setProgressPercentage((prevState) => prevState + percentage);
      };

      const executeStep = async <T,>(currentMessage: string, historyMessage: string, promise: () => Promise<T>): Promise<T> => {
        setProgressMessage(currentMessage);
        updatePercentage();
        const result = await promise();
        updateProgressHistory(historyMessage);
        return result;
      };

      try {
        // Server data
        await executeStep('Creating server data...', 'Created server data.', async () => {
          await createServer(server);
        });
        // Map data
        const tiles = await executeStep<Tile[]>('Creating map data...', 'Created map data.', async () => {
          const mapData = await new Promise<Tile[]>((resolve, reject) => {
            const createMapWorker = new Worker(new URL('../workers/generate-world-map-worker', import.meta.url), {
              type: 'module'
            });
            createMapWorker.postMessage({ server });
            createMapWorker.addEventListener('message', async (event: MessageEvent<{ tiles: Tile[] }>) => {
              const { tiles } = event.data;
              resolve(tiles);
            });
            createMapWorker.addEventListener('error', () => {
              reject(new Error('Error occurred when creating world data'));
            });
          });

          await database.maps.bulkAdd(mapData);
          return mapData;
        });
        // Villages
        await executeStep('Creating village data...', 'Created village data.', async () => {
          const villages = await new Promise<Village[]>((resolve, reject) => {
            const createVillagesWorker = new Worker(new URL('../workers/generate-villages-worker', import.meta.url), {
              type: 'module'
            });
            createVillagesWorker.postMessage({
              server,
              tiles
            });
            createVillagesWorker.addEventListener('message', async (event: MessageEvent<{ villages: Village[] }>) => {
              const { villages } = event.data;
              resolve(villages);
            });
            createVillagesWorker.addEventListener('error', () => {
              reject(new Error('Error occurred when creating villages'));
            });
          });
          await database.villages.bulkAdd(villages);
        });
        // Research levels
        await executeStep('Creating research levels data...', 'Created research levels data.', async () => {
          const researchLevels = researchLevelsFactory({ server });
          await database.researchLevels.bulkAdd(researchLevels);
        });
        // Bank data
        await executeStep('Creating bank data...', 'Created bank data.', async () => {
          const bank = bankFactory({ server });
          await database.banks.add(bank);
        });
        // Hero data
        await executeStep('Creating hero data...', 'Created hero data.', async () => {
          const hero = heroFactory({ server });
          await database.heroes.add(hero);
        });
        // Quests
        await executeStep('Creating quests...', 'Created quests.', async () => {
          // const quests = CreateServerService.createQuests();
          await database.quests.bulkAdd([]);
        });
        // Achievements
        await executeStep('Creating achievements...', 'Created achievements.', async () => {
          // const achievements = CreateServerService.createAchievements();
          await database.achievements.bulkAdd([]);
        });
        // Effects
        await executeStep('Creating effects...', 'Created effects.', async () => {
          // const effects = CreateServerService.createAccountEffects();
          await database.effects.bulkAdd([]);
        });
        setHasCreatedServer(true);
      } catch (err) {
        setError(err as string);
        await deleteServer(server);
      }
    })();
    setView('loader');
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {view === 'configuration' && (
        <CreateServerConfigurationView onSubmit={onSubmit} />
      )}
      {view === 'loader' && (
        <CreateServerLoaderView
          progressMessage={progressMessage}
          progressPercentage={progressPercentage}
          progressHistory={progressHistory}
          hasCreatedServer={hasCreatedServer}
          errorMessage={error}
        />
      )}
    </div>
  );
};
