import { Server } from 'interfaces/models/game/server';
import { Reputation, ReputationLevel } from 'interfaces/models/game/reputation';
import { PlayerFaction } from 'interfaces/models/game/player';

type ReputationFactoryProps = {
  server: Server;
  faction: PlayerFaction;
};

// Players start at different levels of reputation with each faction
const factionToPredefinedReputationLevelMap = new Map<PlayerFaction, ReputationLevel>([
  ['npc1', 'friendly'],
  ['npc2', 'neutral'],
  ['npc3', 'unfriendly'],
  ['npc4', 'hostile'],
]);

export const reputationFactory = ({ server, faction }: ReputationFactoryProps): Reputation => {
  const reputationLevel = factionToPredefinedReputationLevelMap.get(faction)!;

  return {
    serverId: server.id,
    faction,
    percentage: 0,
    reputationLevel
  };
};
