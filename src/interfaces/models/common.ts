import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent, GameEventType } from 'interfaces/models/events/game-event';

export type Resolver<T extends GameEventType> = (args: GameEvent<T>, queryClient: QueryClient) => Promise<void>;

export type Point = {
  x: number;
  y: number;
};
