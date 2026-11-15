import type { SqlValue } from '@sqlite.org/sqlite-wasm';
import type { DbFacade } from '@pillage-first/utils/facades/database';

const bytesToHex = (bytes: Uint8Array | Int8Array): string => {
  let hex = '';

  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }

  return hex;
};

const sqlValueToLiteral = (value: SqlValue): string => {
  if (value === null) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'string') {
    return `'${value.replaceAll("'", "''")}'`;
  }

  if (value instanceof ArrayBuffer) {
    return `X'${bytesToHex(new Uint8Array(value))}'`;
  }

  return `X'${bytesToHex(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))}'`;
};

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

  rowsPerBatch = Math.min(rowsPerBatch, 500);

  const sqlBase = `INSERT INTO ${table} (${columns.join(', ')}) VALUES `;
  const totalRows = rows.length;

  for (let i = 0; i < totalRows; i += rowsPerBatch) {
    const batchEnd = Math.min(totalRows, i + rowsPerBatch);
    let sql = sqlBase;

    for (let r = i; r < batchEnd; r += 1) {
      const row = rows[r];

      if (r > i) {
        sql += ',';
      }

      sql += '(';

      for (let c = 0; c < colsPerRow; c += 1) {
        if (c > 0) {
          sql += ',';
        }

        sql += sqlValueToLiteral(row[c]);
      }

      sql += ')';
    }

    database.exec({ sql: `${sql};` });
  }
};
