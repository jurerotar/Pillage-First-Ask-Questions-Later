import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export type Resolver<T extends GameEvent> = (args: T, queryClient: QueryClient) => Promise<void>;

export type Point = {
  x: number;
  y: number;
};
