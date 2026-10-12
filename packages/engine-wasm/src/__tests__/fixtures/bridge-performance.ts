import { z } from 'zod';
import { openDatabase } from '../../sqlite';

z.config({ jitless: true });
const database = openDatabase('/world.sqlite3');
const seed =
  "CREATE TABLE bridge_review(id INTEGER PRIMARY KEY,value REAL,label TEXT); WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i<1000) INSERT INTO bridge_review SELECT i,0,'' FROM n;";
const updateSql =
  'UPDATE bridge_review SET value=$value,label=$label WHERE id=$id';
const readSql = 'SELECT value,label FROM bridge_review WHERE id=$id';
const rowsSql = 'SELECT id,value,label FROM bridge_review ORDER BY id';
database.execMulti({ sql: seed });
const update = engineNative.prepare(updateSql);
const read = engineNative.prepare(readSql);
const rows = engineNative.prepare(rowsSql);
const schema = z.strictObject({
  id: z.number(),
  value: z.number(),
  label: z.string(),
});
const readSchema = z.strictObject({ value: z.number(), label: z.string() });
const columnNames = ['id', 'value', 'label'];
const check = (code: number, expected = 0) => {
  if (code !== expected) {
    throw new Error(`SQLite ${code}: ${engineNative.error()}`);
  }
};

const run = (kind: string, rounds: number, facade: boolean) => {
  if (kind === 'validate') {
    const statement = engineNative.prepare('SELECT $value');
    let checks = 0;
    try {
      for (const value of ['', '\0', 'before\0after', 'Ž🐉\0tail']) {
        check(engineNative.bindText(statement, 1, value));
        check(engineNative.step(statement), 100);
        if (engineNative.columnText(statement, 0) !== value) {
          throw new Error('Host-bound text differs');
        }
        check(engineNative.reset(statement, 1));
        checks++;
      }
      for (const value of [
        '\ud800',
        '\udc00',
        'x\ud800',
        '\ud800x',
        '\udc00\ud800',
      ]) {
        let rejected = false;
        try {
          engineNative.bindText(statement, 1, value);
        } catch {
          rejected = true;
        }
        if (!rejected) {
          throw new Error('Host binding replaced an unpaired surrogate');
        }
        check(engineNative.reset(statement, 1));
        checks++;
      }
      check(engineNative.bindText(statement, 1, 'recovered'));
      check(engineNative.step(statement), 100);
      if (engineNative.columnText(statement, 0) !== 'recovered') {
        throw new Error('Host binding failed to recover');
      }
      return checks + 1;
    } finally {
      check(engineNative.finalize(statement));
    }
  }
  if (kind === 'grow') {
    check(
      engineNative.exec(
        'CREATE TABLE bridge_padding(value BLOB); WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i<128) INSERT INTO bridge_padding SELECT zeroblob(65536) FROM n;',
      ),
    );
    return 0;
  }
  const label =
    kind === 'ascii'
      ? 'bridge text 100% "quoted"'
      : kind === 'unicode'
        ? 'Živjo 🐉 — café\0tail'
        : '';
  let checksum = 0;
  for (let round = 0; round < rounds; round++) {
    check(engineNative.transaction(0));
    if (kind.startsWith('rows')) {
      if (facade) {
        for (const row of database.selectObjects({ sql: rowsSql, schema })) {
          checksum += row.id + row.value;
        }
      } else {
        while (engineNative.step(rows) === 100) {
          const row: Record<string, unknown> = {};
          for (let column = 0; column < columnNames.length; column++) {
            const name = columnNames[column];
            const type = engineNative.columnType(rows, column);
            row[name] =
              type === 3
                ? engineNative.columnText(rows, column)
                : engineNative.columnNumber(rows, column);
          }
          checksum += (row.id as number) + (row.value as number);
        }
        check(engineNative.reset(rows, 1));
      }
    } else {
      for (let id = 1; id <= 1000; id++) {
        const value = id + round * 1000;
        if (facade) {
          database.exec({
            sql: updateSql,
            bind: { $id: id, $value: value, $label: label },
          });
          const row = database.selectObject({
            sql: readSql,
            bind: { $id: id },
            schema: readSchema,
          });
          if (row?.label !== label) {
            throw new Error('Text differs');
          }
          checksum += row.value;
        } else {
          check(engineNative.bindNumber(update, 1, value));
          check(engineNative.bindText(update, 2, label));
          check(engineNative.bindNumber(update, 3, id));
          check(engineNative.step(update), 101);
          check(engineNative.reset(update, 1));
          check(engineNative.bindNumber(read, 1, id));
          check(engineNative.step(read), 100);
          checksum += engineNative.columnNumber(read, 0);
          if (engineNative.columnText(read, 1) !== label) {
            throw new Error('Text differs');
          }
          check(engineNative.reset(read, 1));
        }
      }
    }
    check(engineNative.transaction(1));
  }
  return checksum;
};

(globalThis as unknown as { enginePump: () => void }).enginePump = () => {
  const request = JSON.parse(engineNative.request()) as {
    kind: string;
    rounds: number;
    facade: boolean;
  };
  const checksum = run(request.kind, request.rounds, request.facade);
  engineNative.respond(
    JSON.stringify({
      data: { checksum },
      notifications: [],
      nextDeadline: null,
    }),
  );
};
