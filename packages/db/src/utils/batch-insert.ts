import type { PreparedStatement, SqlValue } from '@sqlite.org/sqlite-wasm';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const batchInsert = (
  database: DbFacade,
  table: string,
  columns: readonly string[],
  rows: readonly SqlValue[][],
): void => {
  if (rows.length === 0) {
    return;
  }

  const colsPerRow = columns.length;

  if (colsPerRow === 0) {
    throw new Error('columns must not be empty');
  }

  // https://www.sqlite.org/limits.html
  const maxParams = 32_766;
  let rowsPerBatch = Math.floor(maxParams / colsPerRow);

  if (rowsPerBatch < 1) {
    rowsPerBatch = 1;
  }

  const sqlBase = `INSERT INTO ${table} (${columns.join(', ')}) VALUES `;

  const stmts = new Map<number, PreparedStatement>();
  const tuple = `(${Array.from({ length: colsPerRow }).fill('?').join(',')})`;

  const getStmt = (count: number): PreparedStatement => {
    const existing = stmts.get(count);
    if (existing) {
      return existing;
    }

    const valuesClause = Array.from({ length: count }).fill(tuple).join(',');
    const stmt = database.prepare({ sql: `${sqlBase}${valuesClause};` });
    stmts.set(count, stmt);
    return stmt;
  };

  for (let i = 0; i < rows.length; i += rowsPerBatch) {
    const chunk = rows.slice(i, i + rowsPerBatch);
    const params: SqlValue[] = chunk.flat(); // flatten rows -> params

    const stmt = getStmt(chunk.length);
    stmt.bind(params).stepReset();
  }

  for (const s of stmts.values()) {
    s.finalize();
  }
};
