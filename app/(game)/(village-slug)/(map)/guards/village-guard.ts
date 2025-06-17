import type {
  PlayerVillage,
  Village,
} from 'app/interfaces/models/game/village';

export const isPlayerVillage = (village: Village): village is PlayerVillage => {
  return village.playerId === 'player';
};
