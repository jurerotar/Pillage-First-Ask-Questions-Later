import type { Player } from 'app/interfaces/models/game/player';
import { usernameRoots } from 'app/assets/player';

const decodePlayerName = (code: number): string => {
  const rootIndex = Math.floor(code / 10000);
  const id = `${code % 10000}`.padStart(4, '0');

  return `${usernameRoots[rootIndex]}#${id}`;
};

export const getPlayerName = (nameOrBitpackedName: Player['name']): string => {
  if (typeof nameOrBitpackedName === 'string') {
    return nameOrBitpackedName;
  }

  return decodePlayerName(nameOrBitpackedName);
};
