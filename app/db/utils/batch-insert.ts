import type { Database } from 'app/interfaces/db';

type SqlValue = string | number | bigint | Uint8Array | null;

type PreparedStmt = ReturnType<Database['prepare']>;

export const batchInsert = (
  database: Database,
  table: string,
  columns: readonly string[],
  rows: ReadonlyArray<SqlValue>[],
): void => {
  if (!rows.length) {
    return;
  }

  const colsPerRow = columns.length;
  if (colsPerRow === 0) {
    throw new Error('columns must not be empty');
  }

  // https://www.sqlite.org/limits.html
  const maxParams = 32766;
  let rowsPerBatch = Math.floor(maxParams / colsPerRow);

  if (rowsPerBatch < 1) {
    rowsPerBatch = 1;
  }

  const sqlBase = `INSERT INTO ${table} (${columns.join(', ')}) VALUES `;

  // Cache prepared statements by batch size to avoid re-preparing
  const stmts = new Map<number, PreparedStmt>();
  const getStmt = (count: number): PreparedStmt => {
    const existing = stmts.get(count);
    if (existing) {
      return existing;
    }
    const tuple = `(${Array(colsPerRow).fill('?').join(',')})`;
    const valuesClause = Array.from({ length: count }, () => tuple).join(',');
    const stmt = database.prepare(`${sqlBase}${valuesClause};`);
    stmts.set(count, stmt);
    return stmt;
  };

  for (let i = 0; i < rows.length; i += rowsPerBatch) {
    const chunk = rows.slice(i, i + rowsPerBatch);

    // Flatten parameters for the whole chunk
    const params: SqlValue[] = [];
    for (const r of chunk) {
      if (r.length !== colsPerRow) {
        throw new Error(
          `toParams returned ${r.length} values, expected ${colsPerRow}`,
        );
      }
      params.push(...r);
    }

    const stmt = getStmt(chunk.length);
    stmt.bind(params).stepReset();
  }

  for (const s of stmts.values()) {
    s.finalize();
  }
};
