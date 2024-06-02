import type { QueryClient } from '@tanstack/react-query';
import type { GameEvent, GameEventType } from 'interfaces/models/events/game-event';

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

export type OPFSFileName =
  | 'server'
  | 'map'
  | 'hero'
  | 'villages'
  | 'reports'
  | 'quests'
  | 'achievements'
  | 'events'
  | 'effects'
  | 'players'
  | 'reputations'
  | 'auctions'
  | 'mapMarkers'
  | 'adventures'
  | 'mapFilters'
  | 'troops';
