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
import { Effect } from 'interfaces/models/game/effect';

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
  effects!: Table<Effect>;

  constructor() {
    super(env.databaseName);
    // https://dexie.org/docs/Version/Version.stores()
    this.version(1).stores({
      servers: '++id, name',
      maps: '++id, serverId',
      heroes: '++id, serverId',
      villages: '++id, serverId, slug',
      reports: '++id, serverId',
      quests: '++id, serverId',
      achievements: '++id, serverId',
      researchLevels: '++id, serverId',
      events: '++id, serverId',
      effects: '++id, serverId'
    });
  }
}

export const database = new CryliteDatabase();
