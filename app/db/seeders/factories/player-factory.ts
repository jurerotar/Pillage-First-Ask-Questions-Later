import type { Player } from 'app/interfaces/models/game/player';
import type { Server } from 'app/interfaces/models/game/server';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import { seededRandomArrayElement } from 'app/utils/common';
import { prngMulberry32, type PRNGFunction } from 'ts-seedrandom';
import { usernameAdjectives, usernameNouns } from 'app/assets/player';
import { calculateGridLayout } from 'app/utils/map';
import { PLAYER_ID } from 'app/constants/player';
import type { Faction } from 'app/interfaces/models/game/faction';

type PlayerFactoryProps = {
  faction: Faction;
  prng: PRNGFunction;
  id: number;
};

const npcPlayerFactory = ({
  faction,
  prng,
  id,
}: PlayerFactoryProps): Omit<Player, 'slug'> => {
  const adjective = seededRandomArrayElement(prng, usernameAdjectives);
  const noun = seededRandomArrayElement(prng, usernameNouns);

  const paddedDiscriminator = `${id % 10_000}`.padStart(4, '0');

  const tribe = seededRandomArrayElement<PlayableTribe>(prng, [
    'romans',
    'gauls',
    'teutons',
    'egyptians',
    'huns',
  ]);

  return {
    id,
    name: `${adjective}${noun}#${paddedDiscriminator}`,
    tribe,
    faction,
  };
};

export const playerFactory = (
  server: Server,
  faction: Faction,
): Omit<Player, 'slug'> => {
  const {
    playerConfiguration: { name, tribe },
  } = server;
  return {
    id: PLAYER_ID,
    name,
    tribe,
    faction,
  };
};

export const generateNpcPlayers = (server: Server, npcFactions: Faction[]) => {
  const prng = prngMulberry32(server.seed);

  const { mapSize } = server.configuration;

  // Players per tile. Is roughly equal to 1100 players per 100x100 map, 4200 for 200x000, 8500 for 300x300
  const playerDensity = 0.046;

  const { totalTiles } = calculateGridLayout(mapSize);

  const totalPlayerCount =
    Math.round((playerDensity * totalTiles + 1) / 100) * 100;

  // Subtract 1 player to account for player
  const npcCount = totalPlayerCount - 1;

  return [...Array(npcCount)].map((_, index) => {
    const faction = seededRandomArrayElement<Faction>(prng, npcFactions);
    // We do +2 because user's player always has the id of 1
    return npcPlayerFactory({ faction, prng, id: index + 2 });
  });
};
