import { dehydrate, QueryClient, useMutation } from '@tanstack/react-query';
import type { CreateServerWorkerPayload } from 'app/(public)/workers/create-server-worker';
import CreateServerWorker from 'app/(public)/workers/create-server-worker?worker&url';
import type { GenerateMapWorkerPayload, GenerateMapWorkerReturn } from 'app/(public)/workers/generate-map-worker';
import GenerateMapWorker from 'app/(public)/workers/generate-map-worker?worker&url';
import type { GenerateTroopsWorkerPayload, GenerateTroopsWorkerReturn } from 'app/(public)/workers/generate-troops-worker';
import GenerateTroopsWorker from 'app/(public)/workers/generate-troops-worker?worker&url';
import type { GenerateVillageWorkerPayload, GenerateVillageWorkerReturn } from 'app/(public)/workers/generate-villages-worker';
import GenerateVillagesWorker from 'app/(public)/workers/generate-villages-worker?worker&url';
import { Button } from 'app/components/buttons/button';
import { generateEffects } from 'app/factories/effect-factory';
import { heroFactory } from 'app/factories/hero-factory';
import { mapFiltersFactory } from 'app/factories/map-filters-factory';
import { generatePlayers } from 'app/factories/player-factory';
import { generateReputations } from 'app/factories/reputation-factory';
import { serverFactory } from 'app/factories/server-factory';
import { unitImprovementFactory } from 'app/factories/unit-improvement-factory';
import { unitResearchFactory } from 'app/factories/unit-research-factory';
import { userVillageFactory } from 'app/factories/village-factory';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Achievement } from 'app/interfaces/models/game/achievement';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import type { Player } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Server } from 'app/interfaces/models/game/server';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { Village } from 'app/interfaces/models/game/village';
import { workerFactory } from 'app/utils/workers';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  achievementsCacheKey,
  currentServerCacheKey,
  effectsCacheKey,
  heroCacheKey,
  mapCacheKey,
  mapFiltersCacheKey,
  playersCacheKey,
  reputationsCacheKey,
  troopsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villagesCacheKey,
} from 'app/query-keys';

const PLAYER_COUNT = 50;

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

// All of these factories have to be executed in a worker env due to them using OPFS
export const initializeServer = async ({ server }: OnSubmitArgs) => {
  const reputations = generateReputations();
  const npcFactions = reputations.filter(({ faction }) => faction !== 'player').map(({ faction }) => faction);

  const { players, userPlayer } = generatePlayers(server, npcFactions, PLAYER_COUNT);

  // Map data
  const { tiles, occupiedOccupiableTiles, occupiableOasisTiles } = await workerFactory<GenerateMapWorkerPayload, GenerateMapWorkerReturn>(
    GenerateMapWorker,
    { server, players },
  );

  const playerStartingTile = occupiedOccupiableTiles.find(({ coordinates: { x, y } }) => x === 0 && y === 0)!;

  const playerStartingVillage = userVillageFactory({ player: userPlayer, tile: playerStartingTile, slug: 'v-1' });

  // Non-dependant factories can run in sync
  const [{ villages }, { troops }, effects, hero, mapFilters, unitResearch, unitImprovement] = await Promise.all([
    workerFactory<GenerateVillageWorkerPayload, GenerateVillageWorkerReturn>(GenerateVillagesWorker, {
      server,
      occupiedOccupiableTiles,
      players,
    }),
    workerFactory<GenerateTroopsWorkerPayload, GenerateTroopsWorkerReturn>(GenerateTroopsWorker, {
      server,
      occupiedOccupiableTiles,
      occupiableOasisTiles,
      players,
    }),
    generateEffects(server, playerStartingVillage),
    heroFactory(server),
    mapFiltersFactory(),
    unitResearchFactory({ initialVillageId: playerStartingVillage.id, tribe: server.playerConfiguration.tribe }),
    unitImprovementFactory(),
  ]);

  const queryClient = new QueryClient();

  queryClient.setQueryData<Server>([currentServerCacheKey], server);
  queryClient.setQueryData<Player[]>([playersCacheKey], players);
  queryClient.setQueryData<Reputation[]>([reputationsCacheKey], reputations);
  queryClient.setQueryData<Achievement[]>([achievementsCacheKey], []);
  queryClient.setQueryData<Effect[]>([effectsCacheKey], effects);
  queryClient.setQueryData<Hero>([heroCacheKey], hero);
  queryClient.setQueryData<Tile[]>([mapCacheKey], tiles);
  queryClient.setQueryData<Village[]>([villagesCacheKey], [playerStartingVillage, ...villages]);
  queryClient.setQueryData<MapFilters>([mapFiltersCacheKey], mapFilters);
  queryClient.setQueryData<Troop[]>([troopsCacheKey], troops);
  queryClient.setQueryData<UnitResearch[]>([unitResearchCacheKey], unitResearch);
  queryClient.setQueryData<UnitImprovement[]>([unitImprovementCacheKey], unitImprovement);

  await workerFactory<CreateServerWorkerPayload>(CreateServerWorker, { dehydratedState: dehydrate(queryClient), server });
};

export const CreateServerModalContent = () => {
  const { deleteServer, availableServers, addServer } = useAvailableServers();

  const latestServer = availableServers.at(-1);

  const {
    mutate: onSubmit,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation<void, Error, OnSubmitArgs>({
    mutationFn: ({ server }) => initializeServer({ server }),
    onSuccess: (_, { server }) => addServer({ server }),
    onError: (_, { server }) => deleteServer({ server }),
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
      {isSuccess && (
        <Link
          viewTransition
          to={`/game/${latestServer?.slug}/v-1/resources`}
        >
          <Button variant="confirm">Enter server</Button>
        </Link>
      )}
    </div>
  );
};
