import '../../polyfills';
import { z } from 'zod';
import { openDatabase } from '../../sqlite';

z.config({ jitless: true });
const db = openDatabase('/world.sqlite3');
const schema = z.record(z.string(), z.unknown());
const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

// An independent test entry point, compiled with the real adapter and FFI.
// It does not expose a SQL execution endpoint in the prototype worker.
globalThis.enginePump = () => {
  try {
    let checks = 0;
    const captured: (() => number)[] = [];
    for (let i = 0; i < 3; i++) {
      captured.push(() => i);
    }
    assert(
      captured.map((fn) => fn()).join(',') === '0,1,2',
      'Hermes loop capture differs',
    );
    checks++;
    // Retain post-ES2020 syntax through bundling and execute it in real Wasm.
    class ModernSyntax {
      #value = 0;
      static initialized = false;

      static {
        ModernSyntax.initialized = true;
      }

      read() {
        this.#value ||= 42;
        return this.#value;
      }
    }
    assert(
      ModernSyntax.initialized && new ModernSyntax().read() === 42,
      'Hermes modern syntax differs',
    );
    checks++;
    const readBindings = (bind: Record<`$${string}`, number>) =>
      db.selectObject({
        sql: 'SELECT $a AS a, $b AS b, $c AS c',
        bind,
        schema,
      });
    const mutable: Record<`$${string}`, number> = { $a: 1, $b: 2 };
    assert(readBindings(mutable)?.b === 2, 'Initial binding plan differs');
    delete mutable.$b;
    mutable.$c = 3;
    const changed = readBindings(mutable);
    assert(
      changed?.b === null && changed?.c === 3,
      'Mutated binding shape reused stale keys',
    );
    Object.defineProperty(mutable, '$a', { enumerable: false });
    assert(
      readBindings(mutable)?.a === null,
      'Non-enumerable binding survived',
    );
    const getter: Record<`$${string}`, number> = {
      get $a() {
        delete this.$b;
        return 4;
      },
      $b: 5,
    };
    assert(
      readBindings(getter)?.b === null,
      'Getter mutation changed key snapshot semantics',
    );
    assert(
      readBindings({ $c: 7, $b: 6 })?.c === 7,
      'Reordered binding plan differs',
    );
    let unknown = false;
    try {
      readBindings({ $missing: 1 });
    } catch {
      unknown = true;
    }
    assert(
      unknown && readBindings({ $a: 8 })?.a === 8,
      'Unknown binding damaged reuse',
    );
    checks += 6;
    for (const value of [
      null,
      0,
      -12.25,
      '',
      'PHALANX',
      '%+/ "quoted"\r\n\t',
      'Živjo 🐉 — café',
      'a'.repeat(1024),
      '\0',
      'before\0after',
      '\u017d\0\ud83d\udc09',
      `${'ascii'.repeat(100)}\ud83d\udc09%\0tail`,
      undefined,
    ]) {
      const row = db.selectObject({
        sql: 'SELECT $value AS value',
        bind: { $value: value },
        schema,
      });
      assert(row?.value === (value ?? null), 'Bound scalar differs');
      checks++;
    }
    const statement = db.prepare({ sql: 'SELECT $a AS a, $b AS b' });
    assert(
      db.selectValue({
        sql: "SELECT 'before' || char(0) || 'after'",
        schema: z.string(),
      }) === 'before\0after',
      'SQLite-generated NUL text differs',
    );
    checks++;
    for (let i = 0; i < 100; i++) {
      statement.bind({ $a: i, $b: `x${i}` });
      assert(statement.step(), 'Missing prepared row');
      const target = { existing: 1 };
      const row = statement.get(target) as {
        a: number;
        b: string;
        existing: number;
      };
      assert(
        row === target && row.a === i && row.b === `x${i}` && row.existing,
        'Row target differs',
      );
      statement
        .reset(true)
        .reset(true)
        .bind({ $a: i + 0.5 });
      assert(
        statement.step() && statement.get(1) === null,
        'Cleared binding survived',
      );
      statement.reset(true);
      checks += 2;
    }
    // The facade owns this prepared statement and finalizes it on close.
    const blob = db.selectObject({
      sql: 'SELECT $blob AS value, NULL AS absent',
      bind: { $blob: new Uint8Array([0, 1, 127, 128, 255]) },
      schema,
    });
    const bytes = blob?.value as Uint8Array;
    assert(
      bytes instanceof Uint8Array &&
        Array.from(bytes).join(',') === '0,1,127,128,255' &&
        blob?.absent === null,
      'Blob fallback differs',
    );
    checks++;
    const emptyBlob = db.selectValue({
      sql: 'SELECT $blob',
      bind: { $blob: new Uint8Array() },
      schema: z.instanceof(Uint8Array),
    });
    assert(
      emptyBlob instanceof Uint8Array && emptyBlob.length === 0,
      'Empty blob became NULL',
    );
    checks++;
    const unicode = db.selectObject({
      sql: 'SELECT $value AS "Ž🐉"',
      bind: { $value: 'こんにちは 🐉' },
      schema,
    });
    assert(unicode?.['Ž🐉'] === 'こんにちは 🐉', 'Unicode column differs');
    checks++;
    for (const value of [
      '\ud800',
      '\udc00',
      'x\ud800',
      '\ud800x',
      '\udc00\ud800',
    ]) {
      let invalid = false;
      try {
        db.exec({ sql: 'SELECT $value', bind: { $value: value } });
      } catch (error) {
        invalid = error instanceof URIError;
      }
      assert(invalid, 'Malformed surrogate stopped throwing URIError');
      assert(
        db.selectValue({
          sql: 'SELECT $value',
          bind: { $value: 'recovered' },
          schema: z.string(),
        }) === 'recovered',
        'Failed bind damaged reuse',
      );
    }
    assert(
      engineNative.bindText(Number.NaN, 1, 'invalid') === 21 &&
        engineNative.bindText(1, Number.POSITIVE_INFINITY, 'invalid') === 21 &&
        engineNative.bindText(1.5, 1, 'invalid') === 21 &&
        engineNative.bindText(1, 0, 'invalid') === 21 &&
        engineNative.bindText(2_147_483_647, 1, 'invalid') === 21,
      'Invalid host binding arguments were not rejected',
    );
    checks += 2;
    db.execMulti({
      sql: 'CREATE TEMP TABLE bridge_probe(value INTEGER NOT NULL)',
    });
    for (let i = 0; i < 10; i++) {
      const returned = db.selectObject({
        sql: 'INSERT INTO bridge_probe VALUES ($value) RETURNING value, $label AS label',
        bind: { $value: -1, $label: 'Živjo 🐉' },
        schema,
      });
      assert(
        returned?.value === -1 && returned?.label === 'Živjo 🐉',
        'RETURNING fallback differs',
      );
    }
    assert(
      db.selectValue({
        sql: 'SELECT COUNT(*) FROM bridge_probe',
        schema: z.number(),
      }) === 10,
      'RETURNING fallback replayed a write',
    );
    db.exec({ sql: 'DELETE FROM bridge_probe' });
    const special = db.selectObject({
      sql: 'SELECT 1 AS "0", 2 AS value, 3 AS value',
      schema,
    });
    assert(
      special?.['0'] === 1 && special?.value === 3,
      'Indexed or duplicate column differs',
    );
    const specialAgain = db.selectObject({
      sql: 'SELECT 1 AS "0", 2 AS value, 3 AS value',
      schema,
    });
    assert(
      specialAgain?.['0'] === 1 && specialAgain?.value === 3,
      'Indexed column plan differs',
    );
    checks += 13;
    for (let i = 0; i < 100; i++) {
      db.transaction((tx) =>
        tx.exec({
          sql: 'INSERT INTO bridge_probe VALUES ($value)',
          bind: { $value: i },
        }),
      );
    }
    let rolledBack = false;
    try {
      db.transaction((tx) => {
        tx.exec({ sql: 'INSERT INTO bridge_probe VALUES (1000)' });
        tx.exec({ sql: 'INSERT INTO bridge_probe VALUES (NULL)' });
      });
    } catch {
      rolledBack = true;
    }
    assert(
      rolledBack &&
        db.selectValue({
          sql: 'SELECT COUNT(*) FROM bridge_probe',
          schema: z.number(),
        }) === 100,
      'Transaction rollback differs',
    );
    db.transaction((tx) =>
      tx.exec({ sql: 'INSERT INTO bridge_probe VALUES (100)' }),
    );
    assert(
      db.selectValue({
        sql: 'SELECT COUNT(*) FROM bridge_probe',
        schema: z.number(),
      }) === 101,
      'Transaction failed to recover',
    );
    checks += 2;
    const rows = db.selectObjects({
      sql: `WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i<20000)
      SELECT i AS id, printf('row-%d-abcdefghijklmnopqrstuvwxyz',i) AS label, i*0.125 AS fraction FROM n`,
      schema,
    });
    for (let i = 0; i < rows.length; i++) {
      assert(
        rows[i].id === i + 1 &&
          rows[i].label === `row-${i + 1}-abcdefghijklmnopqrstuvwxyz` &&
          rows[i].fraction === (i + 1) * 0.125,
        'Allocated row lost its value',
      );
    }
    assert(rows.length === 20000, 'Missing allocated rows');
    checks += rows.length;
    // More than the handle-table capacity over time must still work after finalize.
    const expired = db.prepare({ sql: 'SELECT 99 AS retired' });
    expired.finalize();
    const replacement = engineNative.prepare('SELECT 77');
    let rejected = false;
    try {
      expired.step();
    } catch {
      rejected = true;
    }
    assert(
      rejected &&
        engineNative.step(replacement) === 100 &&
        engineNative.columnNumber(replacement, 0) === 77,
      'Retired statement accessed a recycled handle',
    );
    assert(
      engineNative.finalize(replacement) === 0,
      'Replacement finalize failed',
    );
    checks++;
    for (let i = 0; i < 66000; i++) {
      const transient = engineNative.prepare('SELECT 1');
      assert(
        transient > 0 &&
          engineNative.step(transient) === 100 &&
          engineNative.columnNumber(transient, 0) === 1,
        'Recycled statement failed',
      );
      assert(
        engineNative.finalize(transient) === 0,
        'Recycled statement finalize failed',
      );
    }
    checks++;
    engineNative.respond(
      JSON.stringify({
        data: { checks },
        notifications: [],
        nextDeadline: null,
      }),
    );
  } catch (error) {
    engineNative.respond(JSON.stringify({ error: String(error) }));
  }
};
