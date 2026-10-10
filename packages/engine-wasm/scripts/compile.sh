#!/usr/bin/env bash
set -euo pipefail
cd /workspace/packages/engine-wasm/build/modular
if [ "${1:-}" = '--native-only' ]; then
  if [ ! -f engine-source.sha256 ] || ! sha256sum --check --status engine-source.sha256; then
    echo 'Engine bundle changed; run a full build before --native-only.' >&2
    exit 1
  fi
fi
if [ ! -f sqlite3.c ]; then
  curl -fL https://sqlite.org/2026/sqlite-amalgamation-3530400.zip -o sqlite.zip
  unzip -j sqlite.zip '*/sqlite3.c' '*/sqlite3.h'
fi
hermes=/toolchain/hermes-clean
runtime=/toolchain/wasm-6.0.12
compiler=/toolchain/host-clean/bin/shermes
"$compiler" -typed -O -Xenable-tdz -emit-c -exported-unit=pillage_sqlite native.js -o native.c
if [ "${1:-}" != '--native-only' ]; then
  "$compiler" -O -Xenable-tdz -emit-c -exported-unit=pillage_engine engine.js -o engine.c
fi
"$compiler" -Xenable-tdz -emit-c -exported-unit=pillage_pump pump.js -o pump.c
common=(-O2 -sSUPPORT_LONGJMP=wasm -DNDEBUG -fno-strict-aliasing -fno-strict-overflow -I"$runtime/lib/config" -I"$hermes/include" -I../../native -I.)
if [ "${1:-}" != '--native-only' ]; then
  emcc "${common[@]}" -c engine.c -o engine.o
  sha256sum engine.js > engine-source.sha256
  emcc "${common[@]}" -DSQLITE_THREADSAFE=0 -DSQLITE_DEFAULT_MEMSTATUS=0 -DSQLITE_MAX_VARIABLE_NUMBER=32766 -c sqlite3.c -o sqlite3.o
fi
emcc "${common[@]}" -c native.c -o native.o
emcc "${common[@]}" -c pump.c -o pump.o
emcc "${common[@]}" -c ../../native/runtime.c -o runtime.o
emcc "${common[@]}" -c ../../native/sqlite-bridge.c -o sqlite-bridge.o
em++ "${common[@]}" -std=c++17 -fwasm-exceptions -I"$hermes/external/llvh/include" -I"$hermes/external/llvh/gen/include" -I"$runtime/external/llvh/include" -c ../../native/serial-executor.cpp -o serial-executor.o
em++ -O2 -g2 -sSUPPORT_LONGJMP=wasm -fwasm-exceptions native.o engine.o pump.o runtime.o sqlite3.o sqlite-bridge.o serial-executor.o \
  -L"$runtime/lib" -L"$runtime/jsi" -L"$runtime/tools/shermes" -lshermes_console_a -lhermesvm_a -ljsi \
  -sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=4MB -sINITIAL_MEMORY=32MB \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createGameEngine -sENVIRONMENT=web,worker,node \
  -sEXPORT_EXCEPTION_HANDLING_HELPERS=1 -sEXCEPTION_STACK_TRACES=1 \
  -sEXPORTED_FUNCTIONS='["_engine_initialize","_engine_dispatch","_engine_close","_engine_snapshot","_engine_snapshot_size","_malloc","_free"]' \
  -sEXPORTED_RUNTIME_METHODS='["FS","ccall","HEAPU8","UTF8ToString","stringToUTF8","lengthBytesUTF8"]' \
  --no-entry -o engine.mjs
cp engine.mjs engine.wasm ..
