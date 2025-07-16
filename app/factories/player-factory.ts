import type { Player, PlayerFaction } from 'app/interfaces/models/game/player';
import type { Server } from 'app/interfaces/models/game/server';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import {
  seededRandomArrayElement,
  seededRandomIntFromInterval,
} from 'app/utils/common';
import { prngMulberry32, type PRNGFunction } from 'ts-seedrandom';
import { npcFactions } from 'app/factories/reputation-factory';
import { usernameRoots } from 'app/assets/player';
import { calculateGridLayout } from 'app/utils/map';

const generateName = (prng: PRNGFunction): number => {
  const id = seededRandomIntFromInterval(prng, 1, 1000);
  const rootIndex = seededRandomIntFromInterval(
    prng,
    0,
    usernameRoots.length - 1,
  );

  // Pack into a single number: rootIndex * 10000 + id
  return rootIndex * 10000 + id;
};

type PlayerFactoryProps = {
  faction: PlayerFaction;
  prng: PRNGFunction;
  id: number;
};

const playerFactory = ({ faction, prng, id }: PlayerFactoryProps): Player => {
  const tribe = seededRandomArrayElement<PlayableTribe>(prng, [
    'romans',
    'gauls',
    'teutons',
    'egyptians',
    'huns',
  ]);

  return {
    id,
    name: generateName(prng),
    tribe,
    faction,
  };
};

export const userPlayerFactory = (server: Server): Player => {
  const {
    playerConfiguration: { name, tribe },
  } = server;
  return {
    id: 'player',
    name,
    tribe,
    faction: 'player',
  };
};

export const generateNpcPlayers = (server: Server) => {
  const prng = prngMulberry32(server.seed);

  const { mapSize } = server.configuration;

  // Players per tile. Is roughly equal to 1100 players per 100x100 map, 4200 for 200x000, 8500 for 300x300
  const playerDensity = 0.046;

  const { totalTiles } = calculateGridLayout(mapSize);

  const playerCount = Math.round((playerDensity * totalTiles) / 100) * 100;

  return [...Array(playerCount)].map((_, index) => {
    const faction = seededRandomArrayElement<PlayerFaction>(prng, npcFactions);
    return playerFactory({ faction, prng, id: index });
  });
};
