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
  adventurePointsCacheKey,
  effectsCacheKey,
  eventsCacheKey,
  heroCacheKey,
  mapCacheKey,
  mapFiltersCacheKey,
  playersCacheKey,
  playerTroopsCacheKey,
  playerVillagesCacheKey,
  preferencesCacheKey, questsCacheKey,
  reputationsCacheKey,
  serverCacheKey,
  troopsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villagesCacheKey,
  worldItemsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { generateEffects } from 'app/factories/effect-factory';
import { heroFactory } from 'app/factories/hero-factory';
import { mapFiltersFactory } from 'app/factories/map-filters-factory';
import { generateNpcPlayers, userPlayerFactory } from 'app/factories/player-factory';
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
import { useTranslation } from 'react-i18next';
import { adventurePointsFactory } from 'app/factories/adventure-points-factory';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';
import { generateEvents } from 'app/factories/event-factory';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Quest } from 'app/interfaces/models/game/quest';
import { generateNewServerQuests } from 'app/factories/quest-factory';

type CreateServerFormValues = Pick<Server, 'seed' | 'name' | 'configuration' | 'playerConfiguration'>;

type OnSubmitArgs = {
  server: Server;
};

const generateSeed = (length = 10): string => {
  return crypto.randomUUID().replaceAll('-', '').substring(0, length);
};

export const initializeServer = async ({ server }: OnSubmitArgs) => {
  const player = userPlayerFactory(server);
  const npcPlayers = generateNpcPlayers(server);

  const players = [player, ...npcPlayers];

  // Map data
  const { tiles, occupiedOccupiableTiles, occupiableOasisTiles } = await workerFactory<GenerateMapWorkerPayload, GenerateMapWorkerReturn>(
    GenerateMapWorker,
    { server, npcPlayers },
  );

  const playerStartingTile = occupiedOccupiableTiles.find(({ id }) => id === '0|0')!;

  const playerStartingVillage = userVillageFactory({ player, tile: playerStartingTile, slug: 'v-1' });

  // Non-dependant factories can run in sync
  const [
    { villages },
    { playerTroops, npcTroops },
    { worldItems },
    effects,
    hero,
    mapFilters,
    unitResearch,
    unitImprovement,
    preferences,
    adventurePoints,
    events,
    reputations,
    quests,
  ] = await Promise.all([
    workerFactory<GenerateVillageWorkerPayload, GenerateVillageWorkerReturn>(GenerateVillagesWorker, {
      server,
      occupiedOccupiableTiles,
      npcPlayers,
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
    adventurePointsFactory(),
    generateEvents(server),
    generateReputations(),
    generateNewServerQuests(playerStartingVillage.id, server.playerConfiguration.tribe),
  ]);

  const queryClient = new QueryClient();

  queryClient.setQueryData<Server>([serverCacheKey], server);
  queryClient.setQueryData<Player[]>([playersCacheKey], players);
  queryClient.setQueryData<Reputation[]>([reputationsCacheKey], reputations);
  queryClient.setQueryData<Effect[]>([effectsCacheKey], effects);
  queryClient.setQueryData<Hero>([heroCacheKey], hero);
  queryClient.setQueryData<Tile[]>([mapCacheKey], tiles);
  queryClient.setQueryData<Village[]>([playerVillagesCacheKey], [playerStartingVillage]);
  queryClient.setQueryData<Village[]>([villagesCacheKey], villages);
  queryClient.setQueryData<MapFilters>([mapFiltersCacheKey], mapFilters);
  queryClient.setQueryData<Troop[]>([troopsCacheKey], npcTroops);
  queryClient.setQueryData<Troop[]>([playerTroopsCacheKey], playerTroops);
  queryClient.setQueryData<UnitResearch[]>([unitResearchCacheKey], unitResearch);
  queryClient.setQueryData<UnitImprovement[]>([unitImprovementCacheKey], unitImprovement);
  queryClient.setQueryData<Preferences>([preferencesCacheKey], preferences);
  queryClient.setQueryData<WorldItem[]>([worldItemsCacheKey], worldItems);
  queryClient.setQueryData<AdventurePoints>([adventurePointsCacheKey], adventurePoints);
  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], events);
  queryClient.setQueryData<Quest[]>([questsCacheKey], quests);

  await workerFactory<CreateServerWorkerPayload>(CreateServerWorker, { dehydratedState: dehydrate(queryClient), server });
};

const CreateNewServerPage = () => {
  const { t } = useTranslation();
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
        name: 'Player',
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
                <h3 className="text-lg font-semibold mb-4">{t('Server Configuration')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-seed">{t('Server Seed')}</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-seed"
                      {...register('seed')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-name">{t('Server Name')}</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-name"
                      {...register('name')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-world-size">{t('World Size')}</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-world-size"
                      type="number"
                      {...register('configuration.mapSize')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-speed">{t('Game Speed')}</Label>
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

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('Game Configuration')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="player-name">{t('Player name')}</Label>
                    <Input
                      disabled={isPending}
                      id="player-name"
                      defaultValue="Player"
                      {...register('playerConfiguration.name')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server-configuration-tribe">{t('Tribe')}</Label>
                    <Input
                      disabled={isPending}
                      id="server-configuration-tribe"
                      {...register('playerConfiguration.tribe')}
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
              {t('Create Server')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNewServerPage;
