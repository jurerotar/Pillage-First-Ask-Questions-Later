import Dexie, { Table } from 'dexie';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import { Hero } from 'interfaces/models/game/hero';
import { Village } from 'interfaces/models/game/village';
import { Report } from 'interfaces/models/game/report';
import { Quest } from 'interfaces/models/game/quest';
import { Achievement } from 'interfaces/models/game/achievement';
import { ResearchLevel } from 'interfaces/models/game/research-level';
import { GameEvent } from 'interfaces/models/events/game-event';
import { env } from 'config/env';

export class CryliteDatabase extends Dexie {
  servers!: Table<Server>;
  maps!: Table<Tile>;
  heroes!: Table<Hero>;
  villages!: Table<Village>;
  reports!: Table<Report>;
  quests!: Table<Quest>;
  achievements!: Table<Achievement>;
  researchLevels!: Table<ResearchLevel>;
  events!: Table<GameEvent>;

  constructor() {
    super(env.databaseName);
    // https://dexie.org/docs/Version/Version.stores()
    this.version(1).stores({
      servers: '++id',
      maps: '++id',
      heroes: '++id',
      villages: '++id',
      reports: '++id',
      quests: '++id',
      achievements: '++id',
      researchLevels: '++id',
      events: '++id'
    });
  }
}

export const database = new CryliteDatabase();
