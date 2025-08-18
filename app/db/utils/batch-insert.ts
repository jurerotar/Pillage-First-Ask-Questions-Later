import type { Database } from 'app/interfaces/models/common';

type SqlValue = string | number | bigint | Uint8Array | null;

type BindingList = ReadonlyArray<SqlValue>;

type PreparedStmt = ReturnType<Database['prepare']>;

export const batchInsert = <T>(
  database: Database,
  table: string,
  columns: readonly string[],
  rows: readonly T[],
  toParams: (row: T) => BindingList,
): number => {
  if (!rows.length) {
    return 0;
  }

  const colsPerRow = columns.length;
  if (colsPerRow === 0) {
    throw new Error('columns must not be empty');
  }

  const maxParams = 999;
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

  let inserted = 0;

  for (let i = 0; i < rows.length; i += rowsPerBatch) {
    const chunk = rows.slice(i, i + rowsPerBatch);

    // Flatten parameters for the whole chunk
    const params: SqlValue[] = [];
    for (const r of chunk) {
      const p = toParams(r);
      if (p.length !== colsPerRow) {
        throw new Error(
          `toParams returned ${p.length} values, expected ${colsPerRow}`,
        );
      }
      params.push(...p);
    }

    const stmt = getStmt(chunk.length);
    stmt.bind(params).stepReset();
    inserted += chunk.length;
  }

  for (const s of stmts.values()) {
    s.finalize();
  }

  return inserted;
};
