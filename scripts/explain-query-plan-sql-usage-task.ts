import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { BindableValue } from '@sqlite.org/sqlite-wasm';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { migrateAndSeed, prepareTestDatabase } from '@pillage-first/db';
import { serverMock } from '@pillage-first/mocks/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createDbFacade } from '@pillage-first/utils/facades/database';

const EXPORT_PATH = join('node_modules', '@pillage-first', 'dev');
const STATEMENTS_EXPORT_PATH = join(EXPORT_PATH, 'statements.sql');
const RESULTS_EXPORT_PATH = join(
  EXPORT_PATH,
  'statements-explain-query-plan.md',
);

const extractBindableParameters = (sql: string): string[] => {
  return Array.from(
    new Set(
      Array.from(sql.matchAll(/\$[A-Za-z_][A-Za-z0-9_]*/gu), ([match]) => {
        return match;
      }),
    ),
  ).sort();
};

const jsonArrayParameters = new Set([
  '$animal_filters',
  '$building_ids',
  '$damaged_buildings',
  '$effect_ids',
  '$effects',
  '$everyQuestId',
  '$fields',
  '$itemsUsed',
  '$listings',
  '$participants',
  '$quests',
  '$report_ids',
  '$requested_slot_bonuses',
  '$structures',
  '$tags',
  '$troops',
  '$types',
  '$unit_ids',
  '$units',
  '$updates',
  '$wounded_troops',
]);

const stringParameterValues = new Map<string, string>([
  ['$building_id', 'MAIN_BUILDING'],
  ['$color', '#ffffff'],
  ['$description', 'explain query plan'],
  ['$effect_id', 'woodProduction'],
  ['$itemId', 'silver'],
  ['$item_id', 'silver'],
  ['$movement_type', 'attack'],
  ['$name', 'explain query plan'],
  ['$outcome', 'none'],
  ['$perspective', 'attacker'],
  ['$player_slug', 'romans'],
  ['$resource', 'wood'],
  ['$rfc_param', '3339'],
  ['$scope', 'global'],
  ['$slug', 'explain-query-plan'],
  ['$source', 'building'],
  ['$tab_name', 'overview'],
  ['$target', 'resources'],
  ['$type', 'battle'],
  ['$unit_id', 'LEGIONNAIRE'],
]);

const booleanParameters = new Set([
  '$available',
  '$can_attacker_see_full_report',
  '$exclude_no_loss',
  '$exclude_own_trades',
  '$include_adventure',
  '$include_battle',
  '$include_gathering_expedition',
  '$include_hunting_party',
  '$include_movement',
  '$include_scouting',
  '$include_trade',
  '$is_raid',
  '$only_unoccupied_oases',
  '$show_occupied_tiles',
  '$successful',
]);

const timestampParameters = new Set([
  '$collected_at',
  '$completed_at',
  '$last_updated_at',
  '$now',
  '$resolves_at',
  '$sells_at',
  '$starts_at',
  '$timestamp',
  '$updatedAt',
  '$updated_at',
]);

type QueryPlanResult =
  | {
      status: 'ok';
      rows: ReturnType<DbFacade['explain']>;
    }
  | {
      status: 'error';
      error: string;
    };

const createSeededDbBuffer = async (): Promise<Uint8Array> => {
  const sqlite3 = await sqlite3InitModule();
  const oo1Db = new sqlite3.oo1.DB(':memory:', 'c');
  const database = createDbFacade(oo1Db, false);

  database.exec({
    sql: `
      PRAGMA page_size = 4096;
      PRAGMA locking_mode = EXCLUSIVE;
      PRAGMA journal_mode = OFF;
      PRAGMA synchronous = OFF;
      PRAGMA foreign_keys = OFF;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_spill = OFF;
      PRAGMA count_changes = OFF;
      PRAGMA cache_size = -2000;
      PRAGMA secure_delete = OFF;
    `,
  });

  migrateAndSeed(database, serverMock);

  const cachedDb = sqlite3.capi.sqlite3_js_db_export(oo1Db.pointer!, 'main');

  oo1Db.close();

  return cachedDb;
};

const bindValueForParameter = (parameter: string): BindableValue => {
  if (jsonArrayParameters.has(parameter)) {
    return '[]';
  }

  const stringValue = stringParameterValues.get(parameter);
  if (stringValue !== undefined) {
    return stringValue;
  }

  if (booleanParameters.has(parameter)) {
    return 1;
  }

  if (timestampParameters.has(parameter)) {
    return Date.now();
  }

  return 1;
};

const createBind = (sql: string): Record<`$${string}`, BindableValue> => {
  return Object.fromEntries(
    extractBindableParameters(sql).map((parameter) => {
      return [parameter, bindValueForParameter(parameter)];
    }),
  ) as Record<`$${string}`, BindableValue>;
};

const stripSqlComments = (sql: string): string => {
  let result = '';
  let quotedString: '"' | "'" | null = null;
  let isLineComment = false;
  let isBlockComment = false;

  for (let index = 0; index < sql.length; index++) {
    const character = sql[index];
    const nextCharacter = sql[index + 1];

    if (isLineComment) {
      if (character === '\n') {
        result += '\n';
        isLineComment = false;
      }
      continue;
    }

    if (isBlockComment) {
      if (character === '*' && nextCharacter === '/') {
        index++;
        isBlockComment = false;
      } else if (character === '\n') {
        result += '\n';
      }
      continue;
    }

    if (quotedString !== null) {
      result += character;

      if (character === quotedString) {
        if (nextCharacter === quotedString) {
          result += nextCharacter;
          index++;
        } else {
          quotedString = null;
        }
      }

      continue;
    }

    if (character === '"' || character === "'") {
      result += character;
      quotedString = character;
      continue;
    }

    if (character === '-' && nextCharacter === '-') {
      index++;
      isLineComment = true;
      continue;
    }

    if (character === '/' && nextCharacter === '*') {
      index++;
      isBlockComment = true;
      continue;
    }

    result += character;
  }

  return result;
};

const splitSqlStatements = (sql: string): string[] => {
  const cleanedSql = stripSqlComments(sql);
  const statements: string[] = [];
  let statement = '';
  let quotedString: '"' | "'" | null = null;

  for (let index = 0; index < cleanedSql.length; index++) {
    const character = cleanedSql[index];
    const nextCharacter = cleanedSql[index + 1];

    statement += character;

    if (quotedString !== null) {
      if (character === quotedString) {
        if (nextCharacter === quotedString) {
          statement += nextCharacter;
          index++;
        } else {
          quotedString = null;
        }
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quotedString = character;
      continue;
    }

    if (character === ';') {
      const trimmedStatement = statement.trim();

      if (trimmedStatement !== '') {
        statements.push(trimmedStatement);
      }

      statement = '';
    }
  }

  const trimmedStatement = statement.trim();
  if (trimmedStatement !== '') {
    statements.push(trimmedStatement);
  }

  return statements;
};

const errorToString = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const explainQueryPlan = (database: DbFacade, sql: string): QueryPlanResult => {
  try {
    return {
      status: 'ok',
      rows: database.explain({
        sql,
        bind: createBind(sql),
      }),
    };
  } catch (error) {
    return { status: 'error', error: errorToString(error) };
  }
};

const compactText = (value: string): string => {
  return value.replace(/\s+/gu, ' ').trim();
};

const formatResult = ({
  index,
  statement,
  queryPlan,
}: {
  index: number;
  statement: string;
  queryPlan: QueryPlanResult;
}): string => {
  const sql = compactText(statement);

  if (queryPlan.status === 'error') {
    return `${index}\t${sql}\tERROR: ${compactText(queryPlan.error)}`;
  }

  const plan = queryPlan.rows
    .map((row) => {
      return compactText(row.detail);
    })
    .join(' | ');

  return `${index}\t${sql}\t${plan}`;
};

export const main = async (): Promise<void> => {
  const statementsSql = await readFile(STATEMENTS_EXPORT_PATH, 'utf8');
  const statements = splitSqlStatements(statementsSql);
  const seededDbBuffer = await createSeededDbBuffer();
  const database = await prepareTestDatabase((key) => {
    if (key !== 'seededDbBuffer') {
      throw new Error(`Unsupported injected key: ${key}`);
    }

    return seededDbBuffer;
  });

  try {
    const results = statements.map((statement, index) => {
      return formatResult({
        index: index + 1,
        statement,
        queryPlan: explainQueryPlan(database, statement),
      });
    });

    const output = [
      `# SQLite EQP (${statements.length})`,
      '# id<TAB>sql<TAB>plan',
      ...results,
      '',
    ].join('\n');

    await mkdir(dirname(RESULTS_EXPORT_PATH), { recursive: true });
    await writeFile(RESULTS_EXPORT_PATH, output, 'utf8');

    // biome-ignore lint/suspicious/noConsole: This script reports the generated file path in CLI output.
    console.log(
      `Wrote ${statements.length} SQL query plans to ${RESULTS_EXPORT_PATH}`,
    );
  } finally {
    database.close();
  }
};
