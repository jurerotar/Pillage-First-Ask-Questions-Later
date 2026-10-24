import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sqlite3InitModule, {
  type BindableValue,
  type Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import { z } from 'zod';
import { migrateAndSeed } from '@pillage-first/api/db';
import { serverMock } from '@pillage-first/mocks/server';
import {
  createDbFacade,
  type DbFacade,
} from '@pillage-first/utils/facades/database';

const EXPORT_PATH = join('node_modules', '@pillage-first', 'dev');
const STATEMENTS_EXPORT_PATH = join(EXPORT_PATH, 'statements.sql');
const RESULTS_EXPORT_PATH = join(
  EXPORT_PATH,
  'statements-explain-query-plan.md',
);

const queryPlanRowSchema = z.strictObject({
  id: z.number(),
  parent: z.number(),
  notused: z.number(),
  detail: z.string(),
});

const extractBindableParameters = (sql: string): string[] => {
  return Array.from(
    new Set(
      Array.from(sql.matchAll(/\$[A-Za-z_][A-Za-z0-9_]*/gu), ([match]) => {
        return match;
      }),
    ),
  ).toSorted();
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
      rows: z.infer<typeof queryPlanRowSchema>[];
    }
  | {
      status: 'error';
      error: string;
    };

type SqliteDatabase = InstanceType<Sqlite3Static['oo1']['DB']>;

type ExecutionResult = {
  vmInstructions: number | null;
  error?: string;
};

const createSeededDbBuffer = (sqlite3: Sqlite3Static): Uint8Array => {
  const oo1Db = new sqlite3.oo1.DB(':memory:', 'c');
  const database = createDbFacade(oo1Db);

  try {
    database.execMulti({
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

    return cachedDb;
  } finally {
    database.close();
    oo1Db.close();
  }
};

const createDatabaseCopy = (
  sqlite3: Sqlite3Static,
  buffer: Uint8Array,
): SqliteDatabase => {
  const database = new sqlite3.oo1.DB(':memory:');

  try {
    database.checkRc(
      sqlite3.capi.sqlite3_deserialize(
        database.pointer!,
        'main',
        sqlite3.wasm.allocFromTypedArray(buffer),
        buffer.byteLength,
        buffer.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
          sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
      ),
    );
    database.exec('PRAGMA foreign_keys = ON; PRAGMA cache_size = -20000;');
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
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

const explainQueryPlan = (
  database: DbFacade,
  sql: string,
  bind = createBind(sql),
): QueryPlanResult => {
  try {
    return {
      status: 'ok',
      rows: database.selectObjects({
        sql: `EXPLAIN QUERY PLAN ${sql}`,
        bind: Object.keys(bind).length > 0 ? bind : undefined,
        schema: queryPlanRowSchema,
      }),
    };
  } catch (error) {
    return { status: 'error', error: errorToString(error) };
  }
};

const measureExecution = (
  sqlite3: Sqlite3Static,
  database: SqliteDatabase,
  sql: string,
  bind: ReturnType<typeof createBind>,
): ExecutionResult => {
  let statement: ReturnType<SqliteDatabase['prepare']> | undefined;
  const instructions = (): number | null =>
    statement
      ? sqlite3.capi.sqlite3_stmt_status(
          statement.pointer!,
          sqlite3.capi.SQLITE_STMTSTATUS_VM_STEP,
          0,
        )
      : null;

  try {
    statement = database.prepare(sql);
    if (Object.keys(bind).length > 0) {
      statement.bind(bind);
    }
    // Step through the C API so expected constraint failures are recorded in the
    // report without the OO wrapper also printing their SQL to stderr.
    let result: number;
    do {
      result = sqlite3.capi.sqlite3_step(statement.pointer!);
    } while (result === sqlite3.capi.SQLITE_ROW);
    if (result !== sqlite3.capi.SQLITE_DONE) {
      throw new Error(sqlite3.capi.sqlite3_errmsg(database.pointer!));
    }
    return { vmInstructions: instructions() };
  } catch (error) {
    return { vmInstructions: instructions(), error: errorToString(error) };
  } finally {
    statement?.finalize();
  }
};

const compactText = (value: string): string => {
  return value.replace(/\s+/gu, ' ').trim();
};

const formatResult = ({
  index,
  statement,
  queryPlan,
  execution,
}: {
  index: number;
  statement: string;
  queryPlan: QueryPlanResult;
  execution: ExecutionResult;
}): string => {
  const sql = compactText(statement);

  const plan =
    queryPlan.status === 'error'
      ? `ERROR: ${compactText(queryPlan.error)}`
      : queryPlan.rows
          .map((row) => {
            return compactText(row.detail);
          })
          .join(' | ');

  const executionStatus = execution.error
    ? `ERROR: ${compactText(execution.error)}`
    : 'ok';
  return `${index}\t${sql}\t${execution.vmInstructions ?? 'N/A'}\t${plan}\t${executionStatus}`;
};

export const main = async (): Promise<void> => {
  const statementsSql = await readFile(STATEMENTS_EXPORT_PATH, 'utf8');
  const statements = splitSqlStatements(statementsSql);
  const sqlite3 = await sqlite3InitModule();
  const seededDbBuffer = createSeededDbBuffer(sqlite3);
  let errors = 0;
  let executionErrors = 0;
  const results = statements.map((statement, index) => {
    // Writes and schema changes must not alter the input for later measurements.
    const rawDatabase = createDatabaseCopy(sqlite3, seededDbBuffer);
    const database = createDbFacade(rawDatabase);
    try {
      const bind = createBind(statement);
      const queryPlan = explainQueryPlan(database, statement, bind);
      const execution = measureExecution(sqlite3, rawDatabase, statement, bind);
      if (queryPlan.status === 'error') {
        errors++;
      }
      if (execution.error) {
        executionErrors++;
      }
      return formatResult({
        index: index + 1,
        statement,
        queryPlan,
        execution,
      });
    } finally {
      database.close();
      rawDatabase.close();
    }
  });

  const output = [
    `# SQLite EQP (${statements.length})`,
    `# SQLite ${sqlite3.version.libVersion}; each query executes on a fresh seeded in-memory copy with foreign keys enabled.`,
    `# ${errors} errors; static extraction cannot resolve every template or runtime temporary table.`,
    `# ${executionErrors} execution errors; VM counts on failed executions are partial, and N/A means preparation failed.`,
    '# Counts use example bindings and include execution of every result row; they are not production workload measurements.',
    '# id<TAB>sql<TAB>vm_instructions<TAB>plan<TAB>execution',
    ...results,
    '',
  ].join('\n');

  await mkdir(dirname(RESULTS_EXPORT_PATH), { recursive: true });
  await writeFile(RESULTS_EXPORT_PATH, output, 'utf8');

  process.stdout.write(
    `Wrote ${statements.length} SQL query plans with VM instruction counts (${errors} plan errors, ${executionErrors} execution errors) to ${RESULTS_EXPORT_PATH}\n`,
  );
};
