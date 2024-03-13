import Dexie, { Table } from 'dexie';
import { Server } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';
import { Hero } from 'interfaces/models/game/hero';
import { Village } from 'interfaces/models/game/village';
import { Report } from 'interfaces/models/game/report';
import { Quest } from 'interfaces/models/game/quest';
import { Achievement } from 'interfaces/models/game/achievement';
import { GameEvent } from 'interfaces/models/events/game-event';
import { Effect } from 'interfaces/models/game/effect';
import { ResearchLevel } from 'interfaces/models/game/research-level';
import { TableName } from 'interfaces/models/database/table-name';
import { Player } from 'interfaces/models/game/player';
import { Reputation } from 'interfaces/models/game/reputation';
import { MapFilters } from 'interfaces/models/game/map-filters';
import { MapMarker } from 'interfaces/models/game/map-marker';

type TableIndex = string;

const DEFAULT_TABLE_INDEX: TableIndex[] = ['++key'];

export const TABLES = new Map<TableName, TableIndex[]>([
  ['servers', ['id,slug']],
  ['mapFilters', ['serverId']],
  ['maps', ['serverId,[serverId+id]']],
  ['heroes', ['serverId,[serverId+id]']],
  ['villages', ['serverId,[serverId+slug],[serverId+id]']],
  ['reports', ['serverId,[serverId+id],&timestamp']],
  ['quests', ['serverId,[serverId+id]']],
  ['achievements', ['serverId,[serverId+id]']],
  ['events', ['serverId,[serverId+id]']],
  ['effects', ['serverId,[serverId+id]']],
  ['researchLevels', ['serverId,[serverId+unitId]']],
  ['players', ['serverId,[serverId+id]']],
  ['reputations', ['serverId,[serverId+id]']],
  ['mapMarkers', ['serverId']],
  ['auctions', ['serverId,[serverId+id]']],
  ['adventures', ['serverId,[serverId+id]']],
]);

export const TABLE_NAMES = TABLES.keys();

// https://dexie.org/docs/Version/Version.stores()
export class Database extends Dexie {
  // Common tables
  public servers!: Table<Server>;

  // Server specific tables
  public maps!: Table<Tile>;
  public heroes!: Table<Hero>;
  public villages!: Table<Village>;
  public reports!: Table<Report>;
  public quests!: Table<Quest>;
  public achievements!: Table<Achievement>;
  public events!: Table<GameEvent>;
  public effects!: Table<Effect>;
  public researchLevels!: Table<ResearchLevel>;
  public players!: Table<Player>;
  public reputations!: Table<Reputation>;
  public mapFilters!: Table<MapFilters>;
  public mapMarkers!: Table<MapMarker>;
  public auctions!: Table<unknown>;
  public adventures!: Table<unknown>;

  public amountOfTables: number;

  constructor() {
    super('echoes-of-travian');

    const schema = Object.fromEntries([
      ...Array.from(TABLES).map(([tableName, indexes]) => [tableName, [...DEFAULT_TABLE_INDEX, ...indexes].join(', ')]),
    ]);

    this.amountOfTables = Object.keys(schema).length;

    this.version(1).stores(schema);
  }
}

export const database = new Database();
