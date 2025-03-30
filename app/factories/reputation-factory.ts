import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { Reputation, ReputationLevel } from 'app/interfaces/models/game/reputation';

const npcFactionToPredefinedReputationLevelMap = new Map<PlayerFaction, ReputationLevel>([
  ['npc1', 'friendly'],
  ['npc2', 'friendly'],
  ['npc3', 'neutral'],
  ['npc4', 'neutral'],
  ['npc5', 'unfriendly'],
  ['npc6', 'unfriendly'],
  ['npc7', 'hostile'],
  ['npc8', 'hostile'],
]);

export const npcFactions = Array.from(npcFactionToPredefinedReputationLevelMap.keys());

// Players start at different levels of reputation with each faction
const allFactionToPredefinedReputationLevelMap = new Map<PlayerFaction, ReputationLevel>([
  ['player', 'player'],
  ...npcFactionToPredefinedReputationLevelMap,
]);

const reputationFactory = (faction: PlayerFaction): Reputation => {
  const reputationLevel = allFactionToPredefinedReputationLevelMap.get(faction)!;

  return {
    faction,
    percentage: 0,
    reputationLevel,
  };
};

export const generateReputations = () => {
  const factions: PlayerFaction[] = Array.from(allFactionToPredefinedReputationLevelMap.keys());
  return factions.map((faction) => reputationFactory(faction));
};
