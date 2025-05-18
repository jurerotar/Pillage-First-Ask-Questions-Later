import { generateNpcPlayers, userPlayerFactory } from 'app/factories/player-factory';
import { workerFactory } from 'app/utils/workers';
import { playerVillageFactory } from 'app/factories/village-factory';
import { heroFactory } from 'app/factories/hero-factory';
import { generateEffects } from 'app/factories/effect-factory';
import { mapFiltersFactory } from 'app/factories/map-filters-factory';
import { unitResearchFactory } from 'app/factories/unit-research-factory';
import { unitImprovementFactory } from 'app/factories/unit-improvement-factory';
import { preferencesFactory } from 'app/factories/preferences-factory';
import { adventurePointsFactory } from 'app/factories/adventure-points-factory';
import { generateEvents } from 'app/factories/event-factory';
import { generateReputations } from 'app/factories/reputation-factory';
import { generateNewServerQuests } from 'app/factories/quest-factory';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
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
  preferencesCacheKey,
  questsCacheKey,
  reputationsCacheKey,
  serverCacheKey,
  troopsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villagesCacheKey,
  worldItemsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Player } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { PlayerVillage, Village } from 'app/interfaces/models/game/village';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Quest } from 'app/interfaces/models/game/quest';
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

export const initializeServer = async (server: Server): Promise<void> => {
  const player = userPlayerFactory(server);
  const npcPlayers = generateNpcPlayers(server);

  const players = [player, ...npcPlayers];

  // Map data
  const { tiles, occupiedOccupiableTiles, occupiableOasisTiles } = await workerFactory<GenerateMapWorkerPayload, GenerateMapWorkerReturn>(
    GenerateMapWorker,
    { server, npcPlayers },
  );

  const playerStartingTile = occupiedOccupiableTiles.find(({ id }) => id === 0)!;

  const playerStartingVillage = playerVillageFactory({ player, tile: playerStartingTile, slug: 'v-1' });

  const hero = heroFactory(server);

  // Non-dependant factories can run in sync
  const [
    { villages },
    { playerTroops, npcTroops },
    { worldItems },
    effects,
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
    generateEffects(server, playerStartingVillage, hero),
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
  queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], [playerStartingVillage]);
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
