#include "sqlite-bridge.h"
#include "sqlite3.h"
#include <emscripten/emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static sqlite3 *db;
enum { MAX_STATEMENTS = 65536 };
static sqlite3_stmt *statements[MAX_STATEMENTS];
static int free_statement_ids[MAX_STATEMENTS];
static int free_statement_count;
static int next_statement = 1;
static int transaction_statements[3];
const char *engine_input = "{}";
char *engine_output;
unsigned char *engine_snapshot_buffer;
int engine_snapshot_length;

int s_open(const char *path) {
  int code = sqlite3_open(":memory:", &db);
  if (code != SQLITE_OK)
    return code;
  FILE *image = fopen(path, "rb");
  if (!image)
    return SQLITE_CANTOPEN;
  if (fseek(image, 0, SEEK_END) != 0) {
    fclose(image);
    return SQLITE_IOERR;
  }
  long length = ftell(image);
  if (length <= 0 || fseek(image, 0, SEEK_SET) != 0) {
    fclose(image);
    return SQLITE_CORRUPT;
  }
  unsigned char *bytes = sqlite3_malloc64((sqlite3_uint64)length);
  if (!bytes) {
    fclose(image);
    return SQLITE_NOMEM;
  }
  size_t read = fread(bytes, 1, (size_t)length, image);
  fclose(image);
  if (read != (size_t)length) {
    sqlite3_free(bytes);
    return SQLITE_IOERR;
  }
  // All gameplay database I/O now stays in native SQLite memory. MEMFS is used
  // once to receive the worker's file, rather than for every SQL operation.
  code = sqlite3_deserialize(db, "main", bytes, length, length,
                             SQLITE_DESERIALIZE_FREEONCLOSE |
                                 SQLITE_DESERIALIZE_RESIZEABLE);
  // FREEONCLOSE also transfers ownership on failure; SQLite frees the buffer.
  return code;
}
void s_close(void) {
  for (int i = 1; i < next_statement; i++) {
    if (statements[i])
      sqlite3_finalize(statements[i]);
    statements[i] = NULL;
  }
  next_statement = 1;
  free_statement_count = 0;
  memset(transaction_statements, 0, sizeof(transaction_statements));
  if (db)
    sqlite3_close(db);
  db = NULL;
  sqlite3_free(engine_snapshot_buffer);
  engine_snapshot_buffer = NULL;
  engine_snapshot_length = 0;
}
const char *s_error(void) {
  return db ? sqlite3_errmsg(db) : "Database is closed";
}
int s_prepare(const char *sql) {
  if (!free_statement_count && next_statement >= MAX_STATEMENTS)
    return 0;
  sqlite3_stmt *statement = NULL;
  if (sqlite3_prepare_v3(db, sql, -1, SQLITE_PREPARE_PERSISTENT, &statement,
                         NULL) != SQLITE_OK ||
      !statement)
    return 0;
  // Recycle finalized handles; cumulative preparation must not exhaust the
  // table.
  int id = free_statement_count ? free_statement_ids[--free_statement_count]
                                : next_statement++;
  statements[id] = statement;
  return id;
}
int s_exec(const char *sql) {
  return sqlite3_exec(db, sql, NULL, NULL, NULL);
}
int s_reset(int id, int clear) {
  int result = sqlite3_reset(statements[id]);
  if (clear) {
    int cleared = sqlite3_clear_bindings(statements[id]);
    if (result == SQLITE_OK)
      result = cleared;
  }
  return result;
}
int s_transaction(int operation) {
  static const char *sql[] = {"BEGIN", "COMMIT", "ROLLBACK"};
  if (operation < 0 || operation > 2)
    return SQLITE_MISUSE;
  int id = transaction_statements[operation];
  if (!id) {
    id = s_prepare(sql[operation]);
    if (!id)
      return sqlite3_errcode(db);
    transaction_statements[operation] = id;
  }
  int code = s_step(id);
  int reset = s_reset(id, 0);
  return code == SQLITE_DONE ? reset : code;
}
int s_step(int id) {
  return sqlite3_step(statements[id]);
}
int s_finalize(int id) {
  if (id <= 0 || id >= next_statement || !statements[id])
    return SQLITE_MISUSE;
  int result = sqlite3_finalize(statements[id]);
  statements[id] = NULL;
  free_statement_ids[free_statement_count++] = id;
  return result;
}
int s_parameter(int id, const char *name) {
  return sqlite3_bind_parameter_index(statements[id], name);
}
int s_bind_null(int id, int index) {
  return sqlite3_bind_null(statements[id], index);
}
int s_bind_number(int id, int index, double value) {
  return sqlite3_bind_double(statements[id], index, value);
}
int s_bind_text(int id, int index, const char *value) {
  return sqlite3_bind_text(statements[id], index, value, -1, SQLITE_TRANSIENT);
}
int s_bind_text_length(int id, int index, const char *value, int length) {
  return sqlite3_bind_text(statements[id], index, value, length,
                           SQLITE_TRANSIENT);
}
int s_bind_blob(int id, int index, const void *value, int length) {
  return sqlite3_bind_blob(statements[id], index, value, length,
                           SQLITE_TRANSIENT);
}
int s_columns(int id) {
  return sqlite3_column_count(statements[id]);
}
const char *s_column_name(int id, int col) {
  return sqlite3_column_name(statements[id], col);
}
int s_column_type(int id, int col) {
  return sqlite3_column_type(statements[id], col);
}
double s_column_number(int id, int col) {
  return sqlite3_column_double(statements[id], col);
}
const char *s_column_text(int id, int col) {
  return (const char *)sqlite3_column_text(statements[id], col);
}
const void *s_column_blob(int id, int col) {
  return sqlite3_column_blob(statements[id], col);
}
int s_column_bytes(int id, int col) {
  return sqlite3_column_bytes(statements[id], col);
}
const char *s_request(void) { return engine_input; }
void s_response(const char *value) {
  free(engine_output);
  engine_output = strdup(value);
}
const void *engine_snapshot(void) {
  sqlite3_free(engine_snapshot_buffer);
  sqlite3_int64 length = 0;
  engine_snapshot_buffer = sqlite3_serialize(db, "main", &length, 0);
  engine_snapshot_length = (int)length;
  return engine_snapshot_buffer;
}
int engine_snapshot_size(void) { return engine_snapshot_length; }
