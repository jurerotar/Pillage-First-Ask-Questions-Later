import { useMutation } from '@tanstack/react-query';
import type {
  GenerateAchievementsWorkerPayload,
  GenerateAchievementsWorkerReturn,
} from 'app/[public]/workers/generate-achievements-worker';
import CreateAchievementsWorker from 'app/[public]/workers/generate-achievements-worker?worker&url';
import type { GenerateEffectsWorkerPayload, GenerateEffectsWorkerReturn } from 'app/[public]/workers/generate-effects-worker';
import CreateEffectsWorker from 'app/[public]/workers/generate-effects-worker?worker&url';
import type { GeneratePlayersWorkerPayload, GeneratePlayersWorkerReturn } from 'app/[public]/workers/generate-players-worker';
import CreatePlayersWorker from 'app/[public]/workers/generate-players-worker?worker&url';
import type { GenerateQuestsWorkerPayload, GenerateQuestsWorkerReturn } from 'app/[public]/workers/generate-quests-worker';
import CreateQuestsWorker from 'app/[public]/workers/generate-quests-worker?worker&url';
import type { GenerateReputationsWorkerPayload, GenerateReputationsWorkerReturn } from 'app/[public]/workers/generate-reputations-worker';
import CreateReputationsWorker from 'app/[public]/workers/generate-reputations-worker?worker&url';
import type { GenerateTroopsWorkerPayload, GenerateTroopsWorkerReturn } from 'app/[public]/workers/generate-troops-worker';
import CreateTroopsWorker from 'app/[public]/workers/generate-troops-worker?worker&url';
import type { GenerateVillageWorkerPayload, GenerateVillageWorkerReturn } from 'app/[public]/workers/generate-villages-worker';
import CreateVillagesWorker from 'app/[public]/workers/generate-villages-worker?worker&url';
import type { GenerateMapWorkerPayload, GenerateMapWorkerReturn } from 'app/[public]/workers/generate-map-worker';
import CreateMapWorker from 'app/[public]/workers/generate-map-worker?worker&url';
import { Button } from 'app/components/buttons/button';
import { heroFactory } from 'app/factories/hero-factory';
import { mapFiltersFactory } from 'app/factories/map-filters-factory';
import { serverFactory } from 'app/factories/server-factory';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import { workerFactory } from 'app/utils/workers';
import { database } from 'database/database';
import type { Server } from 'interfaces/models/game/server';
import type React from 'react';
import { useForm } from 'react-hook-form';

type CreateServerFormValues = Pick<Server, 'seed' | 'name' | 'configuration' | 'playerConfiguration'>;

type OnSubmitArgs = {
  server: Server;
};

type CreateServerConfigurationViewProps = {
  onSubmit: (params: OnSubmitArgs) => void;
};

const generateSeed = (length = 10): string => {
  return crypto.randomUUID().replaceAll('-', '').substring(0, length);
};

const CreateServerConfigurationView: React.FC<CreateServerConfigurationViewProps> = (props) => {
  const { onSubmit } = props;

  const { handleSubmit, register } = useForm<CreateServerFormValues>({
    defaultValues: {
      seed: generateSeed(),
      name: 'Server name',
      configuration: {
        mapSize: 100,
        speed: 1,
      },
      playerConfiguration: {
        name: 'Player name',
        tribe: 'gauls',
      },
    },
  });

  const submitForm = (data: CreateServerFormValues) => {
    const server = serverFactory({ ...data });
    onSubmit({ server });
  };

  return (
    <form onSubmit={handleSubmit(submitForm)}>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex flex-col gap-4">
          <h3>Server configuration</h3>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-seed">Server seed</label>
            <input
              id="server-configuration-seed"
              {...register('seed')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-name">Server name</label>
            <input
              id="server-configuration-name"
              {...register('name')}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3>Game configuration</h3>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-world-size">World size</label>
            <input
              id="server-configuration-world-size"
              {...register('configuration.mapSize')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-tribe">Tribe</label>
            <input
              id="server-configuration-tribe"
              {...register('playerConfiguration.tribe')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="server-configuration-speed">Game speed</label>
            <input
              id="server-configuration-speed"
              {...register('configuration.speed')}
            />
          </div>
        </div>
      </div>
      <Button
        type="submit"
        onClick={handleSubmit(submitForm)}
      >
        Create server
      </Button>
    </form>
  );
};

export const initializeServer = async ({ server }: OnSubmitArgs) => {
  // Reputations
  const { reputations } = await workerFactory<GenerateReputationsWorkerPayload, GenerateReputationsWorkerReturn>(
    CreateReputationsWorker,
    { server },
    ''
  );

  const npcFactions = reputations.filter(({ faction }) => faction !== 'player').map(({ faction }) => faction);

  // Players/factions
  const { players } = await workerFactory<GeneratePlayersWorkerPayload, GeneratePlayersWorkerReturn>(
    CreatePlayersWorker,
    { server, factions: npcFactions },
    ''
  );

  // Map data
  const { occupiedOccupiableTiles, occupiableOasisTiles } = await workerFactory<GenerateMapWorkerPayload, GenerateMapWorkerReturn>(
    CreateMapWorker,
    { server, players },
    ''
  );

  // Villages
  const { playerStartingVillage } = await workerFactory<GenerateVillageWorkerPayload, GenerateVillageWorkerReturn>(
    CreateVillagesWorker,
    { server, occupiedOccupiableTiles, players },
    ''
  );

  // Non-dependant factories can run in sync
  await Promise.all([
    // Troops
    workerFactory<GenerateTroopsWorkerPayload, GenerateTroopsWorkerReturn>(
      CreateTroopsWorker,
      { server, occupiedOccupiableTiles, occupiableOasisTiles, players },
      ''
    ),

    // Hero data
    (async () => {
      const hero = heroFactory({ server });
      await database.heroes.add(hero);
    })(),

    // Quests
    workerFactory<GenerateQuestsWorkerPayload, GenerateQuestsWorkerReturn>(
      CreateQuestsWorker,
      { server, villageId: playerStartingVillage.id },
      ''
    ),

    // Achievements
    workerFactory<GenerateAchievementsWorkerPayload, GenerateAchievementsWorkerReturn>(CreateAchievementsWorker, { server }, ''),

    // Effects
    workerFactory<GenerateEffectsWorkerPayload, GenerateEffectsWorkerReturn>(
      CreateEffectsWorker,
      { server, village: playerStartingVillage },
      ''
    ),

    // Map filters
    (async () => {
      const mapFilters = mapFiltersFactory({ server });

      await database.mapFilters.add(mapFilters);
    })(),
  ]);
};

export const CreateServerModalContent = () => {
  const { createServer, deleteServer } = useAvailableServers();

  const {
    mutate: onSubmit,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation<void, Error, OnSubmitArgs>({
    mutationFn: async ({ server }) => {
      await initializeServer({ server });
    },
    onSuccess: async (_, { server }) => {
      await createServer({ server });
    },
    onError: async (_, { server }) => {
      await deleteServer({ server });
    },
  });

  if (error !== null) {
    return (
      <div className="flex flex-col gap-4">
        <span>{error.message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!isPending && !isSuccess && !isError && <CreateServerConfigurationView onSubmit={onSubmit} />}
      {isPending && <div className="mx-auto flex w-full flex-col gap-4 md:max-w-[50%]">Loading</div>}
      {isSuccess && <div>Success</div>}
    </div>
  );
};
