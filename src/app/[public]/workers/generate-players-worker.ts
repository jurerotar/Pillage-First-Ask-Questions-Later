import { generatePlayers } from 'app/factories/player-factory';
import type { Player, PlayerFaction } from 'interfaces/models/game/player';
import type { Server } from 'interfaces/models/game/server';
import { getServerHandle, writeFileContents } from 'app/utils/opfs';

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

  const players = generatePlayers(server, factions, PLAYER_COUNT);

  self.postMessage({ players });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Player[]>(serverHandle, 'players', players);

  self.close();
});
