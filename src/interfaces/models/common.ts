import { GameEvent, GameEventType } from 'interfaces/models/events/game-event';
import { QueryClient } from '@tanstack/react-query';

export type Resolver<T extends GameEventType> = (args: GameEvent<T>, queryClient: QueryClient) => Promise<void>;

export type Size = {
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Device = {
  size: Size;
};
