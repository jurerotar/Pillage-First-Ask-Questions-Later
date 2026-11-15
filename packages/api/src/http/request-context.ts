import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Player } from '@pillage-first/types/models/player';

export type RequestContext = {
  readonly playerId: Player['id'];
};

// The local worker has one player. A future HTTP adapter should resolve this
// identity from a validated session before passing context to the router.
export const createRequestContext = (): RequestContext => ({
  playerId: PLAYER_ID,
});
