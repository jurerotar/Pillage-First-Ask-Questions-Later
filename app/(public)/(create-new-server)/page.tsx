import type React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from 'app/components/buttons/button';
import type { CreateServerWorkerPayload } from 'app/(public)/workers/create-server-worker';
import CreateServerWorker from 'app/(public)/workers/create-server-worker?worker&url';
import type { GenerateMapWorkerPayload, GenerateMapWorkerReturn } from 'app/(public)/workers/generate-map-worker';
import GenerateMapWorker from 'app/(public)/workers/generate-map-worker?worker&url';
import type { GenerateTroopsWorkerPayload, GenerateTroopsWorkerReturn } from 'app/(public)/workers/generate-troops-worker';
import GenerateTroopsWorker from 'app/(public)/workers/generate-troops-worker?worker&url';
import type { GenerateVillageWorkerPayload, GenerateVillageWorkerReturn } from 'app/(public)/workers/generate-villages-worker';
import GenerateVillagesWorker from 'app/(public)/workers/generate-villages-worker?worker&url';
import type { GenerateWorldItemsWorkerPayload, GenerateWorldItemsWorkerReturn } from 'app/(public)/workers/generate-world-items-worker';
import GenerateWorldItemsWorker from 'app/(public)/workers/generate-world-items-worker?worker&url';
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
import type { Preferences } from 'app/interfaces/models/game/preferences';
import {
  achievementsCacheKey,
  currentServerCacheKey,
  effectsCacheKey,
  heroCacheKey,
  mapCacheKey,
  mapFiltersCacheKey,
  playersCacheKey,
  preferencesCacheKey,
  reputationsCacheKey,
  troopsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villagesCacheKey,
  worldItemsCacheKey,
} from 'app/(game)/constants/query-keys';
import { generateEffects } from 'app/factories/effect-factory';
import { heroFactory } from 'app/factories/hero-factory';
import { mapFiltersFactory } from 'app/factories/map-filters-factory';
import { generatePlayers } from 'app/factories/player-factory';
import { generateReputations } from 'app/factories/reputation-factory';
import { serverFactory } from 'app/factories/server-factory';
import { unitImprovementFactory } from 'app/factories/unit-improvement-factory';
import { unitResearchFactory } from 'app/factories/unit-research-factory';
import { userVillageFactory } from 'app/factories/village-factory';
import { preferencesFactory } from 'app/factories/preferences-factory';
import { dehydrate, QueryClient, useMutation } from '@tanstack/react-query';
import { workerFactory } from 'app/utils/workers';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import { useNavigate } from 'react-router';
import { Label } from 'app/components/label';
import { Input } from 'app/components/input';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

const PLAYER_COUNT = 50;

type CreateServerFormValues = Pick<Server, 'seed' | 'name' | 'configuration' | 'playerConfiguration'>;

type OnSubmitArgs = {
  server: Server;
};

const generateSeed = (length = 10): string => {
  return crypto.randomUUID().replaceAll('-', '').substring(0, length);
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
  const [{ villages }, { troops }, { worldItems }, effects, hero, mapFilters, unitResearch, unitImprovement, preferences] =
    await Promise.all([
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
      workerFactory<GenerateWorldItemsWorkerPayload, GenerateWorldItemsWorkerReturn>(GenerateWorldItemsWorker, {
        server,
        occupiedOccupiableTiles,
      }),
      generateEffects(server, playerStartingVillage),
      heroFactory(server),
      mapFiltersFactory(),
      unitResearchFactory({ initialVillageId: playerStartingVillage.id, tribe: server.playerConfiguration.tribe }),
      unitImprovementFactory(),
      preferencesFactory(),
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
  queryClient.setQueryData<Preferences>([preferencesCacheKey], preferences);
  queryClient.setQueryData<WorldItem[]>([worldItemsCacheKey], worldItems);

  await workerFactory<CreateServerWorkerPayload>(CreateServerWorker, { dehydratedState: dehydrate(queryClient), server });
};

const CreateNewServerPage: React.FC = () => {
  const navigate = useNavigate();
  const { addServer, deleteServer } = useAvailableServers();

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

  const {
    mutate: onSubmit,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation<void, Error, OnSubmitArgs>({
    mutationFn: ({ server }) => initializeServer({ server }),
    onSuccess: (_, { server }) => {
      addServer({ server });
      navigate(`/game/${server.slug}/v-1/resources`);
    },
    onError: (_, { server }) => deleteServer({ server }),
  });

  const submitForm = (data: CreateServerFormValues) => {
    const server = serverFactory({ ...data });
    onSubmit({ server });
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-md mx-auto">
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">{error.message}</div>
      </div>
    );
  }

  if (isSuccess) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit(submitForm)}
          className="space-y-8 bg-card p-6 rounded-lg shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Server Configuration</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-seed">Server Seed</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-seed"
                      {...register('seed')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-name">Server Name</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-name"
                      {...register('name')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Game Configuration</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-world-size">World Size</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-world-size"
                      type="number"
                      {...register('configuration.mapSize')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-tribe">Tribe</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-tribe"
                      {...register('playerConfiguration.tribe')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-speed">Game Speed</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-speed"
                      type="number"
                      min="1"
                      max="10"
                      {...register('configuration.speed')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              size="lg"
              variant="confirm"
              disabled={isPending}
            >
              Create Server
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNewServerPage;
