import { PLAYER_ID } from 'app/constants/player';
import type {
  PlayerVillage,
  Village,
} from 'app/interfaces/models/game/village';

export const isPlayerVillage = (village: Village): village is PlayerVillage => {
  return village.playerId === PLAYER_ID;
};
