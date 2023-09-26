import React, { useState } from 'react';
import { Button } from 'components/buttons/button';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'interfaces/models/game/server';
import { CreateServerService } from 'services/create-server-service';
import { RandomizerService } from 'services/randomizer-service';
import { useAvailableServers } from 'hooks/use-available-servers';
import { ProgressBar } from 'components/progress-bar';
import { database } from 'database/database';
import { useFormik } from 'formik';
import { Tile } from 'interfaces/models/game/tile';

type CreateServerFormValues = Pick<Server, 'seed' | 'name' | 'configuration'>;
type CreateServerModalView = 'configuration' | 'loader';

type CreateServerConfigurationViewProps = {
  onSubmit: (server: Server) => void;
};

const CreateServerConfigurationView: React.FC<CreateServerConfigurationViewProps> = (props) => {
  const { onSubmit } = props;

  const {
    values,
    handleSubmit,
    submitForm
  } = useFormik<CreateServerFormValues>({
    initialValues: {
      seed: RandomizerService.generateSeed(),
      name: `server-${RandomizerService.generateSeed(4)}`,
      configuration: {
        tribe: 'gauls',
        mapSize: 100,
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
        startDate: (new Date()).toString()
      });
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
              defaultValue={values.configuration.tribe}
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

  const onSubmit = (serverConfig: Server) => {
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
          await createServer(serverConfig);
        });
        // Map data
        const tiles = await executeStep<Tile[]>('Creating map data...', 'Created map data.', async () => {
          const mapData = await CreateServerService.createMapData(serverConfig);
          await database.maps.bulkAdd(mapData);
          return mapData;
        });
        // Villages
        await executeStep('Creating village data...', 'Created village data.', async () => {
          const villages = await CreateServerService.createVillages(serverConfig, tiles);
          await database.villages.bulkAdd(villages);
        });
        // Research levels
        await executeStep('Creating research levels data...', 'Created research levels data.', async () => {
          const researchLevels = CreateServerService.createResearchLevels(serverConfig);
          await database.researchLevels.bulkAdd(researchLevels);
        });
        // Bank data
        await executeStep('Creating bank data...', 'Created bank data.', async () => {
          const bank = CreateServerService.createBank(serverConfig);
          await database.banks.add(bank);
        });
        // Hero data
        await executeStep('Creating hero data...', 'Created hero data.', async () => {
          const hero = CreateServerService.createHero(serverConfig);
          await database.heroes.add(hero);
        });
        // Quests
        await executeStep('Creating quests...', 'Created quests.', async () => {
          const quests = CreateServerService.createQuests();
          await database.quests.bulkAdd(quests);
        });
        // Achievements
        await executeStep('Creating achievements...', 'Created achievements.', async () => {
          const achievements = CreateServerService.createAchievements();
          await database.achievements.bulkAdd(achievements);
        });
        // Effects
        await executeStep('Creating effects...', 'Created effects.', async () => {
          const effects = CreateServerService.createAccountEffects();
          await database.effects.bulkAdd(effects);
        });
        setHasCreatedServer(true);
      } catch (err) {
        setError(err as string);
        await deleteServer(serverConfig);
      }
    })();
    setView('loader');
  };

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
