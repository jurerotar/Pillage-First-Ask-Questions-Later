import { readFileSync } from 'node:fs';

// Only native function declarations are generated. Application source and
// Hermes-generated C are compiled without package-specific rewrites.
export function ffiPrelude() {
  const signatures = {
    s_open: ['c_int', 'path:c_ptr'],
    s_error: ['c_ptr'],
    s_prepare: ['c_int', 'sql:c_ptr'],
    s_exec: ['c_int', 'sql:c_ptr'],
    s_transaction: ['c_int', 'operation:c_int'],
    s_reset: ['c_int', 'id:c_int', 'clear:c_int'],
    s_step: ['c_int', 'id:c_int'],
    s_finalize: ['c_int', 'id:c_int'],
    s_parameter: ['c_int', 'id:c_int', 'name:c_ptr'],
    s_bind_null: ['c_int', 'id:c_int', 'index:c_int'],
    s_bind_number: ['c_int', 'id:c_int', 'index:c_int', 'value:c_double'],
    s_bind_text: ['c_int', 'id:c_int', 'index:c_int', 'value:c_ptr'],
    s_bind_blob: [
      'c_int',
      'id:c_int',
      'index:c_int',
      'value:c_ptr',
      'length:c_int',
    ],
    s_columns: ['c_int', 'id:c_int'],
    s_column_name: ['c_ptr', 'id:c_int', 'col:c_int'],
    s_column_type: ['c_int', 'id:c_int', 'col:c_int'],
    s_column_number: ['c_double', 'id:c_int', 'col:c_int'],
    s_column_text: ['c_ptr', 'id:c_int', 'col:c_int'],
    s_column_blob: ['c_ptr', 'id:c_int', 'col:c_int'],
    s_column_bytes: ['c_int', 'id:c_int', 'col:c_int'],
    s_request: ['c_ptr'],
    s_response: ['void', 'value:c_ptr'],
  };

  const declarations = Object.entries(signatures)
    .map(
      ([name, [result, ...args]]) =>
        `const _${name} = $SHBuiltin.extern_c({include:"sqlite-bridge.h"}, function ${name}(${args.join(',')}):${result} {${result === 'void' ? '' : 'throw 0;'}});`,
    )
    .join('\n');
  const source = readFileSync(
    new URL('../native/ffi.ts.in', import.meta.url),
    'utf8',
  );
  const marker = '// @native-declarations';
  if (source.split(marker).length !== 2) {
    throw new Error('Expected one FFI declaration marker');
  }
  return source.replace(marker, declarations);
}
