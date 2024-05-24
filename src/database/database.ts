import Dexie, { type Table } from 'dexie';
import type { TableName } from 'interfaces/models/database/table-name';
import type { GameEvent } from 'interfaces/models/events/game-event';
import type { Achievement } from 'interfaces/models/game/achievement';
import type { Effect } from 'interfaces/models/game/effect';
import type { Hero } from 'interfaces/models/game/hero';
import type { MapFilters } from 'interfaces/models/game/map-filters';
import type { MapMarker } from 'interfaces/models/game/map-marker';
import type { Player } from 'interfaces/models/game/player';
import type { Quest } from 'interfaces/models/game/quest';
import type { Report } from 'interfaces/models/game/report';
import type { Reputation } from 'interfaces/models/game/reputation';
import type { ResearchLevel } from 'interfaces/models/game/research-level';
import type { Server } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';
import type { Troop } from 'interfaces/models/game/troop';
import type { Village } from 'interfaces/models/game/village';

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
  ['effects', ['serverId,[serverId+villageId+id],[serverId+id]']],
  ['researchLevels', ['serverId,[serverId+unitId]']],
  ['players', ['serverId,[serverId+id]']],
  ['reputations', ['serverId,[serverId+id]']],
  ['mapMarkers', ['serverId']],
  ['auctions', ['serverId,[serverId+id]']],
  ['adventures', ['serverId,[serverId+id]']],
  ['troops', ['serverId,[serverId+villageId]']],
]);

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
  public troops!: Table<Troop>;

  constructor() {
    super('echoes-of-travian');

    const schema = Object.fromEntries([
      ...Array.from(TABLES).map(([tableName, indexes]) => [tableName, [...DEFAULT_TABLE_INDEX, ...indexes].join(', ')]),
    ]);

    this.version(1).stores(schema);
  }
}

export const database = new Database();
