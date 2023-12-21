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
import { workerFactory } from 'utils/workers';
import { GeneratePlayersWorkerPayload, GeneratePlayersWorkerReturn } from 'app/__public/workers/generate-players-worker';
import { GenerateReputationsWorkerPayload, GenerateReputationsWorkerReturn } from 'app/__public/workers/generate-reputations-worker';
import { GenerateWorldMapWorkerPayload, GenerateWorldMapWorkerReturn } from 'app/__public/workers/generate-world-map-worker';
import { GenerateVillageWorkerPayload, GenerateVillageWorkerReturn } from 'app/__public/workers/generate-villages-worker';
import { GenerateQuestsWorkerPayload, GenerateQuestsWorkerReturn } from 'app/__public/workers/generate-quests-worker';
import { GenerateAchievementsWorkerPayload, GenerateAchievementsWorkerReturn } from 'app/__public/workers/generate-achievements-worker';
import { GenerateEffectsWorkerPayload, GenerateEffectsWorkerReturn } from 'app/__public/workers/generate-effects-worker';
import CreateVillagesWorker from '../workers/generate-villages-worker?worker&url';
import CreateMapWorker from '../workers/generate-world-map-worker?worker&url';
import CreatePlayersWorker from '../workers/generate-players-worker?worker&url';
import CreateReputationsWorker from '../workers/generate-reputations-worker?worker&url';
import CreateQuestsWorker from '../workers/generate-quests-worker?worker&url';
import CreateAchievementsWorker from '../workers/generate-achievements-worker?worker&url';
import CreateEffectsWorker from '../workers/generate-effects-worker?worker&url';

type CreateServerFormValues = Pick<Server, 'seed' | 'name' | 'configuration' | 'playerConfiguration'>;
type CreateServerModalView = 'configuration' | 'loader';

type CreateServerConfigurationViewProps = {
  onSubmit: (server: Server) => void;
};

const generateSeed = (length: number = 10): string => {
  return crypto.randomUUID().replaceAll('-', '').substring(0, length);
};

const CreateServerConfigurationView: React.FC<CreateServerConfigurationViewProps> = (props) => {
  const { onSubmit } = props;

  const {
    values,
    handleSubmit,
    submitForm,
  } = useFormik<CreateServerFormValues>({
    initialValues: {
      seed: generateSeed(),
      name: `server-${generateSeed(4)}`,
      configuration: {
        mapSize: 100,
        speed: 1,
      },
      playerConfiguration: {
        tribe: 'gauls',
      },
    },
    validate: (valuesToValidate) => {
      return {};
    },
    onSubmit: (submittedValues) => {
      const server = serverFactory({ ...submittedValues });
      onSubmit(server);
    },
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
    errorMessage,
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
    deleteServer,
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

      const executeStep = async <T, >(currentMessage: string, historyMessage: string, promise: () => Promise<T>): Promise<T> => {
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

        // Players/factions
        const players = await executeStep('Creating factions...', 'Created factions.', async () => {
          const { players: generatedPlayers } = await workerFactory<GeneratePlayersWorkerReturn, GeneratePlayersWorkerPayload>(
            CreatePlayersWorker,
            { server },
            ''
          );
          await database.players.bulkAdd(generatedPlayers);
          return generatedPlayers;
        });

        const userPlayer = players.find(({ faction }) => faction === 'player')!;

        // Reputations
        await executeStep('Creating reputations...', 'Created reputations.', async () => {
          const { reputations } = await workerFactory<GenerateReputationsWorkerReturn, GenerateReputationsWorkerPayload>(
            CreateReputationsWorker,
            { server, players },
            ''
          );
          await database.reputations.bulkAdd(reputations);
        });

        // Map data
        const tiles = await executeStep<Tile[]>('Creating map data...', 'Created map data.', async () => {
          const { tiles: generatedTiles } = await workerFactory<GenerateWorldMapWorkerReturn, GenerateWorldMapWorkerPayload>(
            CreateMapWorker,
            { server, players },
            ''
          );
          await database.maps.bulkAdd(generatedTiles);
          return generatedTiles;
        });

        // Villages
        const villages = await executeStep('Creating village data...', 'Created village data.', async () => {
          const { villages: generatedVillages } = await workerFactory<GenerateVillageWorkerReturn, GenerateVillageWorkerPayload>(
            CreateVillagesWorker,
            { server, tiles, players },
            ''
          );
          await database.villages.bulkAdd(generatedVillages);
          return generatedVillages;
        });

        const playerStartingVillage = villages.find(({ playerId }) => playerId === userPlayer.id)!;

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
          const { quests } = await workerFactory<GenerateQuestsWorkerReturn, GenerateQuestsWorkerPayload>(
            CreateQuestsWorker,
            { server, village: playerStartingVillage },
            ''
          );
          await database.quests.bulkAdd(quests);
        });

        // Achievements
        await executeStep('Creating achievements...', 'Created achievements.', async () => {
          const { achievements } = await workerFactory<GenerateAchievementsWorkerReturn, GenerateAchievementsWorkerPayload>(
            CreateAchievementsWorker,
            { server },
            ''
          );
          await database.achievements.bulkAdd(achievements);
        });

        // Effects
        await executeStep('Creating effects...', 'Created effects.', async () => {
          const { effects } = await workerFactory<GenerateEffectsWorkerReturn, GenerateEffectsWorkerPayload>(
            CreateEffectsWorker,
            { server, village: playerStartingVillage },
            ''
          );
          await database.effects.bulkAdd(effects);
        });

        // Map filters
        await executeStep('Creating effects...', 'Created effects.', async () => {
          await database.mapFilters.add({
            serverId: server.id,
            shouldShowFactionReputation: true,
            shouldShowOasisIcons: true,
            shouldShowTroopMovements: true,
            shouldShowWheatFields: true,
            shouldShowTileTooltips: true,
            shouldShowTreasureIcons: true,
          });
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
