import type { PlayerFaction } from 'interfaces/models/game/player';
import type { Reputation, ReputationLevel } from 'interfaces/models/game/reputation';

type PlayerFactionFactoryProps = {
  faction: PlayerFaction;
};

// Players start at different levels of reputation with each faction
const factionToPredefinedReputationLevelMap = new Map<PlayerFaction, ReputationLevel>([
  ['player', 'player'],
  ['npc1', 'friendly'],
  ['npc2', 'friendly'],
  ['npc3', 'neutral'],
  ['npc4', 'neutral'],
  ['npc5', 'unfriendly'],
  ['npc6', 'unfriendly'],
  ['npc7', 'hostile'],
  ['npc8', 'hostile'],
]);

const reputationFactory = ({ faction }: PlayerFactionFactoryProps): Reputation => {
  const reputationLevel = factionToPredefinedReputationLevelMap.get(faction)!;

  return {
    faction,
    percentage: 0,
    reputationLevel,
  };
};

export const generateReputations = () => {
  const factions: PlayerFaction[] = Array.from(factionToPredefinedReputationLevelMap.keys());
  return factions.map((faction) => reputationFactory({ faction }));
};
