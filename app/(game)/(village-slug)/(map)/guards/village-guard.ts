import type {
  PlayerVillage,
  Village,
} from 'app/interfaces/models/game/village';
import { PLAYER_ID } from 'app/constants/player';

export const isPlayerVillage = (village: Village): village is PlayerVillage => {
  return village.playerId === PLAYER_ID;
};
