import { expect, test } from 'vitest';
import { ffiPrelude } from '../ffi';

test('produces standalone SQLite FFI declarations without patch helpers', () => {
  const source = ffiPrelude();
  expect(source).toContain('function s_prepare(sql:c_ptr):c_int');
  expect(source).toContain('function s_reset(id:c_int,clear:c_int):c_int');
  expect(source).not.toMatch(
    /@native-declarations|bridgeExecute|textCache|s_column_text_key/,
  );
});
