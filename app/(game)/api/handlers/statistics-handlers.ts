import type { ApiHandler } from 'app/interfaces/api';
import { playersCacheKey, reputationsCacheKey, villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Player } from 'app/interfaces/models/game/player';
import type { Village } from 'app/interfaces/models/game/village';
import { calculatePopulationFromBuildingFields } from 'app/(game)/(village-slug)/utils/building';

type PopulatedPlayer = {
  player: Player;
  reputation: Reputation;
  villages: Village[];
  population: number;
};

export const getStatistics: ApiHandler<PopulatedPlayer[]> = async (queryClient) => {
  const playersData = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  const villagesData = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const reputationsData = queryClient.getQueryData<Reputation[]>([reputationsCacheKey])!;

  const statistics = playersData.map((player) => {
    const reputation = reputationsData.find((reputation) => reputation.faction === player.faction)!;
    const villages = villagesData.filter((village) => village.playerId === player.id)!;

    const population = villages.reduce((total, village) => {
      return total + calculatePopulationFromBuildingFields(village.buildingFields, village.buildingFieldsPresets);
    }, 0);

    return {
      player,
      reputation,
      villages,
      population,
    };
  });

  statistics.sort((a, b) => b.population - a.population);

  return statistics;
};
