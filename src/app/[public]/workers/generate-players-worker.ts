import { Server } from 'interfaces/models/game/server';
import { playerFactory, userPlayerFactory } from 'app/factories/player-factory';
import { Player, PlayerFaction } from 'interfaces/models/game/player';
import { seededRandomArrayElement } from 'app/utils/common';
import { database } from 'database/database';

export type GeneratePlayersWorkerPayload = {
  server: Server;
  factions: PlayerFaction[];
};

export type GeneratePlayersWorkerReturn = {
  players: Player[];
};

const PLAYER_COUNT = 50;

self.addEventListener('message', async (event: MessageEvent<GeneratePlayersWorkerPayload>) => {
  const { server, factions } = event.data;
  const userPlayer = userPlayerFactory({ server });
  const npcPlayers = [...Array(PLAYER_COUNT)].map((_, index) => {
    const faction = seededRandomArrayElement<PlayerFaction>(server.id, factions);
    return playerFactory({ server, faction, index });
  });

  const players = [userPlayer, ...npcPlayers];

  self.postMessage({ players });
  await database.players.bulkAdd(players);
  self.close();
});
