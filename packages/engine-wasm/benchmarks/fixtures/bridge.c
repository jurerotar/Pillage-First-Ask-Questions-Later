#include "sqlite-bridge.h"
#include <emscripten/emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int update_statement, read_statement, rows_statement;
static char output[128];
static unsigned char *snapshot_copy;
extern const void *engine_snapshot(void);
extern int engine_snapshot_size(void);

static void check(int code, int expected) {
  if (code != expected) {
    fprintf(stderr, "SQLite %d: %s\n", code, s_error());
    abort();
  }
}

EMSCRIPTEN_KEEPALIVE int engine_initialize(void) {
  check(s_open("/world.sqlite3"), 0);
  check(s_exec("PRAGMA foreign_keys=ON;"), 0);
  check(s_exec("CREATE TABLE bridge_review(id INTEGER PRIMARY KEY,value REAL,label TEXT); WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i<1000) INSERT INTO bridge_review SELECT i,0,'' FROM n;"), 0);
  update_statement = s_prepare("UPDATE bridge_review SET value=$value,label=$label WHERE id=$id");
  read_statement = s_prepare("SELECT value,label FROM bridge_review WHERE id=$id");
  rows_statement = s_prepare("SELECT id,value,label FROM bridge_review ORDER BY id");
  return update_statement && read_statement && rows_statement;
}

EMSCRIPTEN_KEEPALIVE const char *engine_dispatch(const char *input) {
  if (strstr(input, "\"kind\":\"envelope\"")) {
    return "{\"data\":{\"checksum\":0},\"notifications\":[],\"nextDeadline\":null}";
  }
  if (strstr(input, "\"kind\":\"grow\"")) {
    check(s_exec("CREATE TABLE bridge_padding(value BLOB); WITH RECURSIVE n(i) AS (VALUES(1) UNION ALL SELECT i+1 FROM n WHERE i<128) INSERT INTO bridge_padding SELECT zeroblob(65536) FROM n;"), 0);
    return "{\"data\":{\"checksum\":0},\"notifications\":[],\"nextDeadline\":null}";
  }
  const char *round_position = strstr(input, "\"rounds\":");
  int rounds = round_position ? atoi(round_position + 9) : 1;
  if (strstr(input, "\"kind\":\"sql-") || strstr(input, "\"kind\":\"prepare\"")) {
    int prepare = strstr(input, "\"kind\":\"prepare\"") != NULL;
    const char *sql = strstr(input, "sql-aggregate")
      ? "SELECT sum(a.id*b.id) FROM bridge_review a CROSS JOIN bridge_review b WHERE b.id<=10"
      : strstr(input, "sql-join")
        ? "SELECT sum(a.id) FROM bridge_review a JOIN bridge_review b ON a.id=b.id"
        : strstr(input, "sql-sort")
          ? "SELECT sum(id) FROM (SELECT id FROM bridge_review ORDER BY id%97 DESC,id LIMIT 100)"
          : "SELECT 1";
    double checksum = 0;
    int prepared = prepare ? 0 : s_prepare(sql);
    for (int round = 0; round < rounds; round++) {
      int statement = prepared ? prepared : s_prepare(sql);
      if (!statement) abort();
      check(s_step(statement), 100);
      checksum += s_column_number(statement, 0);
      check(s_step(statement), 101);
      check(s_reset(statement, 1), 0);
      if (!prepared) check(s_finalize(statement), 0);
    }
    if (prepared) check(s_finalize(prepared), 0);
    snprintf(output, sizeof(output), "{\"data\":{\"checksum\":%.0f},\"notifications\":[],\"nextDeadline\":null}", checksum);
    return output;
  }
  int rows = strstr(input, "\"kind\":\"rows") != NULL;
  const char ascii[] = "bridge text 100% \"quoted\"";
  const char unicode[] = "Živjo 🐉 — café\0tail";
  const char *label = "";
  int label_length = 0;
  if (strstr(input, "\"kind\":\"ascii\"")) {
    label = ascii;
    label_length = sizeof(ascii) - 1;
  } else if (strstr(input, "\"kind\":\"unicode\"")) {
    label = unicode;
    label_length = sizeof(unicode) - 1;
  }
  double checksum = 0;
  for (int round = 0; round < rounds; round++) {
    check(s_transaction(0), 0);
    if (rows) {
      int code;
      while ((code = s_step(rows_statement)) == 100) {
        checksum += s_column_number(rows_statement, 0) + s_column_number(rows_statement, 1);
        // Read text as well; compare complete state outside the timed section.
        const char *text = s_column_text(rows_statement, 2);
        if (!text) abort();
      }
      check(code, 101);
      check(s_reset(rows_statement, 1), 0);
    } else {
      for (int id = 1; id <= 1000; id++) {
        check(s_bind_number(update_statement, 1, id + round * 1000), 0);
        check(s_bind_text(update_statement, 2, label, label_length), 0);
        check(s_bind_number(update_statement, 3, id), 0);
        check(s_step(update_statement), 101);
        check(s_reset(update_statement, 1), 0);
        check(s_bind_number(read_statement, 1, id), 0);
        check(s_step(read_statement), 100);
        checksum += s_column_number(read_statement, 0);
        const char *text = s_column_text(read_statement, 1);
        int length = s_column_bytes(read_statement, 1);
        if (length != label_length || memcmp(text, label, length) != 0) abort();
        check(s_reset(read_statement, 1), 0);
      }
    }
    check(s_transaction(1), 0);
  }
  snprintf(output, sizeof(output), "{\"data\":{\"checksum\":%.0f},\"notifications\":[],\"nextDeadline\":null}", checksum);
  return output;
}

EMSCRIPTEN_KEEPALIVE void engine_close(void) {
  free(snapshot_copy);
  snapshot_copy = NULL;
  s_close();
}

// Isolate the removed allocation/copy cost without changing production code.
// The normal client still takes its detached JS copy in both variants.
EMSCRIPTEN_KEEPALIVE const void *review_snapshot_copy(void) {
  const void *image = engine_snapshot();
  int size = engine_snapshot_size();
  free(snapshot_copy);
  snapshot_copy = malloc(size);
  if (!snapshot_copy) abort();
  memcpy(snapshot_copy, image, size);
  return snapshot_copy;
}
