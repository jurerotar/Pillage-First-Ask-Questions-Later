import Dexie, { Table } from 'dexie';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import { Hero } from 'interfaces/models/game/hero';
import { Village } from 'interfaces/models/game/village';
import { Report } from 'interfaces/models/game/report';
import { Quest } from 'interfaces/models/game/quest';
import { Achievement } from 'interfaces/models/game/achievement';
import { GameEvent } from 'interfaces/models/events/game-event';
import { env } from 'config/env';
import { Effect } from 'interfaces/models/game/effect';
import { Bank } from 'interfaces/models/game/bank';
import { ResearchLevel } from 'interfaces/models/game/research-level';

export class CryliteDatabase extends Dexie {
  servers!: Table<Server>;
  maps!: Table<Tile>;
  heroes!: Table<Hero>;
  villages!: Table<Village>;
  reports!: Table<Report>;
  quests!: Table<Quest>;
  achievements!: Table<Achievement>;
  events!: Table<GameEvent>;
  effects!: Table<Effect>;
  banks!: Table<Bank>;
  researchLevels!: Table<ResearchLevel>;

  public amountOfTables: number;

  constructor() {
    super(env.databaseName);
    // https://dexie.org/docs/Version/Version.stores()
    const schema = {
      servers: '++id, slug',
      maps: '++id, serverId',
      heroes: '++id, serverId',
      villages: '++id, serverId, slug',
      reports: '++id, serverId',
      quests: '++id, serverId',
      achievements: '++id, serverId',
      events: '++id, serverId',
      effects: '++id, serverId',
      banks: '++id, serverId',
      researchLevels: '++id, serverId'
    };

    this.amountOfTables = Object.keys(schema).length;

    this.version(1).stores(schema);
  }
}

export const database = new CryliteDatabase();
