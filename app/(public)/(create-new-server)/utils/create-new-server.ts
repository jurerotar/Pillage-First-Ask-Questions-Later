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
import { mapFiltersFactory } from 'app/factories/map-filters-factory';
import { newVillageUnitResearchFactory } from 'app/factories/unit-research-factory';
import { unitImprovementFactory } from 'app/factories/unit-improvement-factory';
import { preferencesFactory } from 'app/factories/preferences-factory';
import { adventurePointsFactory } from 'app/factories/adventure-points-factory';
import { generateEvents } from 'app/factories/event-factory';
import { generateReputations } from 'app/factories/reputation-factory';
import { generateNewServerQuests } from 'app/factories/quest-factory';
import { QueryClient } from '@tanstack/react-query';
import type { Server } from 'app/interfaces/models/game/server';
import {
  adventurePointsCacheKey,
  bookmarksCacheKey,
  effectsCacheKey,
  eventsCacheKey,
  heroCacheKey,
  mapCacheKey,
  mapFiltersCacheKey,
  playersCacheKey,
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
import type { Village } from 'app/interfaces/models/game/village';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { UnitImprovement } from 'app/interfaces/models/game/unit-improvement';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import type { AdventurePoints } from 'app/interfaces/models/game/adventure-points';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { bookmarkFactory } from 'app/factories/bookmark-factory';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';
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
  const mapFilters = mapFiltersFactory();
  const unitResearch = newVillageUnitResearchFactory(
    playerStartingVillage.id,
    player.tribe,
  );
  const unitImprovement = unitImprovementFactory(player.tribe);
  const preferences = preferencesFactory();
  const adventurePoints = adventurePointsFactory();
  const events = generateEvents(server);
  const reputations = generateReputations();
  const quests = generateNewServerQuests(
    playerStartingVillage.id,
    server.playerConfiguration.tribe,
  );
  const bookmarks = bookmarkFactory();

  const queryClient = new QueryClient();

  queryClient.setQueryData<Server>([serverCacheKey], server);
  queryClient.setQueryData<Player[]>([playersCacheKey], players);
  queryClient.setQueryData<Reputation[]>([reputationsCacheKey], reputations);
  queryClient.setQueryData<Effect[]>([effectsCacheKey], effects);
  queryClient.setQueryData<Hero>([heroCacheKey], hero);
  queryClient.setQueryData<Tile[]>([mapCacheKey], tiles);
  queryClient.setQueryData<Village[]>(
    [villagesCacheKey],
    [playerStartingVillage, ...villages],
  );
  queryClient.setQueryData<MapFilters>([mapFiltersCacheKey], mapFilters);
  queryClient.setQueryData<Troop[]>(
    [troopsCacheKey],
    [...playerTroops, ...npcTroops],
  );
  queryClient.setQueryData<UnitResearch[]>(
    [unitResearchCacheKey],
    unitResearch,
  );
  queryClient.setQueryData<UnitImprovement[]>(
    [unitImprovementCacheKey],
    unitImprovement,
  );
  queryClient.setQueryData<Preferences>([preferencesCacheKey], preferences);
  queryClient.setQueryData<WorldItem[]>([worldItemsCacheKey], worldItems);
  queryClient.setQueryData<AdventurePoints>(
    [adventurePointsCacheKey],
    adventurePoints,
  );
  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], events);
  queryClient.setQueryData<Quest[]>([questsCacheKey], quests);
  queryClient.setQueryData<Bookmarks>([bookmarksCacheKey], bookmarks);

  return queryClient;
};
