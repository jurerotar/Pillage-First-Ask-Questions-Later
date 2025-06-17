import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export type Resolver<T extends GameEvent> = (
  queryClient: QueryClient,
  args: T,
) => Promise<void>;

export type Point = {
  x: number;
  y: number;
};
