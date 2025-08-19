import {
  generateNpcPlayers,
  playerFactory,
} from 'app/factories/player-factory';
import {
  generateVillages,
  playerVillageFactory,
} from 'app/factories/village-factory';
import { heroFactory } from 'app/factories/hero-factory';
import { generateEffects } from 'app/factories/effect-factory';
import { newVillageUnitResearchFactory } from 'app/factories/unit-research-factory';
import { generateEvents } from 'app/factories/event-factory';
import { generateReputations } from 'app/factories/reputation-factory';
import { generateNewServerQuests } from 'app/factories/quest-factory';
import { QueryClient } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import {
  effectsCacheKey,
  eventsCacheKey,
  heroCacheKey,
  mapCacheKey,
  playersCacheKey,
  questsCacheKey,
  reputationsCacheKey,
  troopsCacheKey,
  unitResearchCacheKey,
  villagesCacheKey,
  worldItemsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Player } from 'app/interfaces/models/game/player';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Quest } from 'app/interfaces/models/game/quest';
import { mapFactory } from 'app/factories/map-factory';
import {
  isOccupiedOccupiableTile,
  isUnoccupiedOasisTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { generateTroops } from 'app/factories/troop-factory';
import { prngMulberry32 } from 'ts-seedrandom';
import { worldItemsFactory } from 'app/factories/world-items-factory';

export const initializeServer = async (
  server: Server,
): Promise<QueryClient> => {
  const prng = prngMulberry32(server.seed);

  const player = playerFactory(server);
  const npcPlayers = generateNpcPlayers(server);

  const players = [player, ...npcPlayers];

  const tiles = mapFactory({ server, npcPlayers });
  const occupiableOasisTiles = tiles.filter(isUnoccupiedOasisTile);
  const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

  const playerStartingTile = occupiedOccupiableTiles.find(
    ({ id }) => id === 0,
  )!;

  const playerStartingVillage = playerVillageFactory({
    player,
    tile: playerStartingTile,
    slug: 'v-1',
  });

  const hero = heroFactory(server);

  const { playerTroops, npcTroops } = generateTroops({
    server,
    occupiedOccupiableTiles,
    occupiableOasisTiles,
    players,
  });

  const villages = generateVillages({
    prng,
    server,
    occupiedOccupiableTiles,
    npcPlayers,
  });

  const worldItems = worldItemsFactory({
    prng,
    server,
    occupiedOccupiableTiles,
  });

  const effects = generateEffects(server, playerStartingVillage, hero);
  const unitResearch = newVillageUnitResearchFactory(
    playerStartingVillage.id,
    player.tribe,
  );
  const events = generateEvents(server);
  const reputations = generateReputations();
  const quests = generateNewServerQuests(
    playerStartingVillage.id,
    server.playerConfiguration.tribe,
  );

  const queryClient = new QueryClient();

  queryClient.setQueryData<Player[]>([playersCacheKey], players);
  queryClient.setQueryData<Reputation[]>([reputationsCacheKey], reputations);
  queryClient.setQueryData<Effect[]>([effectsCacheKey], effects);
  queryClient.setQueryData<Hero>([heroCacheKey], hero);
  queryClient.setQueryData<Tile[]>([mapCacheKey], tiles);
  queryClient.setQueryData<Village[]>(
    [villagesCacheKey],
    [playerStartingVillage, ...villages],
  );
  queryClient.setQueryData<Troop[]>(
    [troopsCacheKey],
    [...playerTroops, ...npcTroops],
  );
  queryClient.setQueryData<UnitResearch[]>(
    [unitResearchCacheKey],
    unitResearch,
  );
  queryClient.setQueryData<WorldItem[]>([worldItemsCacheKey], worldItems);
  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], events);
  queryClient.setQueryData<Quest[]>([questsCacheKey], quests);

  return queryClient;
};
