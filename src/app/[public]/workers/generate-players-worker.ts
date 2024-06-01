import { playerFactory, userPlayerFactory } from 'app/factories/player-factory';
import { seededRandomArrayElement } from 'app/utils/common';
import type { Player, PlayerFaction } from 'interfaces/models/game/player';
import type { Server } from 'interfaces/models/game/server';
import { prng_alea } from 'esm-seedrandom';
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

  const prng = prng_alea(server.seed);

  const userPlayer = userPlayerFactory({ server });
  const npcPlayers = [...Array(PLAYER_COUNT)].map(() => {
    const faction = seededRandomArrayElement<PlayerFaction>(prng, factions);
    return playerFactory({ faction, prng });
  });

  const players = [userPlayer, ...npcPlayers];

  self.postMessage({ players });

  const serverHandle = await getServerHandle(server.slug);
  await writeFileContents<Player[]>(serverHandle, 'players', players);

  self.close();
});
