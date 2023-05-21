import Dexie, { Table } from 'dexie';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';

const DATABASE_NAME = 'crylite';

export class CryliteDatabase extends Dexie {
  servers!: Table<Server>;
  maps!: Table<Tile>;

  constructor() {
    super(DATABASE_NAME);
    // https://dexie.org/docs/Version/Version.stores()
    this.version(1).stores({
      servers: '&id',
      maps: '++id'
    });
  }
}

export const database = new CryliteDatabase();
