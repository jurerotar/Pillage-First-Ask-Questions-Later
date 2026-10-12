#pragma once
#ifdef __cplusplus
extern "C" {
#endif
int s_open(const char *path);
void s_close(void);
const char *s_error(void);
int s_prepare(const char *sql);
int s_exec(const char *sql);
int s_transaction(int operation);
int s_reset(int statement, int clear);
int s_step(int statement);
int s_finalize(int statement);
int s_parameter(int statement, const char *name);
int s_bind_null(int statement, int index);
int s_bind_number(int statement, int index, double value);
int s_bind_text(int statement, int index, const char *value, int length);
int s_bind_text16(int statement, int index, const void *value, int byte_length);
int s_bind_blob(int statement, int index, const void *value, int length);
int s_columns(int statement);
const char *s_column_name(int statement, int column);
int s_column_type(int statement, int column);
double s_column_number(int statement, int column);
const char *s_column_text(int statement, int column);
const void *s_column_blob(int statement, int column);
int s_column_bytes(int statement, int column);
const char *s_request(void);
void s_response(const char *value);
#ifdef __cplusplus
}
#endif
