import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../prepare-test-database';

describe('database facade', () => {
  test('exec clears bindings before reusing a prepared statement', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: 'CREATE TEMP TABLE facade_binding_test (value INTEGER);',
    });

    const sql: string = `
      INSERT INTO facade_binding_test (value)
      SELECT $value
      WHERE $value IS NOT NULL;
    `;

    database.exec({
      sql,
      bind: { $value: 7 },
    });

    database.exec({ sql });

    const rowCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM facade_binding_test;',
      schema: z.number(),
    });

    expect(rowCount).toBe(1);
  });

  test('selectValue clears bindings before reusing a prepared statement', async () => {
    const database = await prepareTestDatabase();

    const sql: string = `
      SELECT $value
      WHERE $value IS NOT NULL;
    `;

    const firstValue = database.selectValue({
      sql,
      bind: { $value: 7 },
      schema: z.number(),
    });

    const secondValue = database.selectValue({
      sql,
      schema: z.number(),
    });

    expect(firstValue).toBe(7);
    expect(secondValue).toBeUndefined();
  });

  test('selectObject clears bindings before reusing a prepared statement', async () => {
    const database = await prepareTestDatabase();

    const sql: string = `
      SELECT $value AS value
      WHERE $value IS NOT NULL;
    `;

    const firstValue = database.selectObject({
      sql,
      bind: { $value: 7 },
      schema: z.strictObject({ value: z.number() }),
    });

    const secondValue = database.selectObject({
      sql,
      schema: z.strictObject({ value: z.number() }),
    });

    expect(firstValue).toStrictEqual({ value: 7 });
    expect(secondValue).toBeUndefined();
  });

  test('selectObject does not reuse omitted bind keys', async () => {
    const database = await prepareTestDatabase();

    const sql: string = `
      SELECT $left_value AS leftValue, $right_value AS rightValue
      WHERE $right_value IS NOT NULL;
    `;

    const firstValue = database.selectObject({
      sql,
      bind: {
        $left_value: 1,
        $right_value: 2,
      },
      schema: z.strictObject({
        leftValue: z.number(),
        rightValue: z.number(),
      }),
    });

    const secondValue = database.selectObject({
      sql,
      bind: { $left_value: 3 },
      schema: z.strictObject({
        leftValue: z.number(),
        rightValue: z.number(),
      }),
    });

    expect(firstValue).toStrictEqual({ leftValue: 1, rightValue: 2 });
    expect(secondValue).toBeUndefined();
  });
});
