import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { Reputation, ReputationLevel } from 'app/interfaces/models/game/reputation';

// Players start at different levels of reputation with each faction
const factionToPredefinedReputationLevelMap = new Map<PlayerFaction, ReputationLevel>([
  ['npc1', 'friendly'],
  ['npc2', 'friendly'],
  ['npc3', 'neutral'],
  ['npc4', 'neutral'],
  ['npc5', 'unfriendly'],
  ['npc6', 'unfriendly'],
  ['npc7', 'hostile'],
  ['npc8', 'hostile'],
]);

export const npcFactions = Array.from(factionToPredefinedReputationLevelMap.keys());

const reputationFactory = (faction: PlayerFaction): Reputation => {
  const reputationLevel = factionToPredefinedReputationLevelMap.get(faction)!;

  return {
    faction,
    percentage: 0,
    reputationLevel,
  };
};

export const generateReputations = () => {
  const factions: PlayerFaction[] = Array.from(factionToPredefinedReputationLevelMap.keys());
  return factions.map((faction) => reputationFactory(faction));
};
