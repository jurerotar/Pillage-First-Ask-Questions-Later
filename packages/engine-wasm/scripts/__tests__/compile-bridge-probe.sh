#!/usr/bin/env bash
set -euo pipefail
cd /workspace/packages/engine-wasm/build/modular
/toolchain/host-clean/bin/shermes -O -Xenable-tdz -emit-c -exported-unit=pillage_engine bridge-probe.js -o bridge-probe.c
emcc -O2 -sSUPPORT_LONGJMP=wasm -DNDEBUG -fno-strict-aliasing -fno-strict-overflow \
  -I/toolchain/wasm-6.0.12/lib/config -I/toolchain/hermes-clean/include -c bridge-probe.c -o bridge-probe.o
em++ -O2 -g2 -sSUPPORT_LONGJMP=wasm -fwasm-exceptions \
  native.o bridge-probe.o pump.o runtime.o sqlite3.o sqlite-bridge.o serial-executor.o text-bindings.o \
  -L/toolchain/wasm-6.0.12/lib -L/toolchain/wasm-6.0.12/jsi -L/toolchain/wasm-6.0.12/tools/shermes \
  -lshermes_console_a -lhermesvm_a -ljsi \
  -sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=4MB -sINITIAL_MEMORY=32MB \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=node \
  -sEXPORTED_FUNCTIONS='["_engine_initialize","_engine_dispatch","_engine_close","_engine_snapshot","_engine_snapshot_size"]' \
  -sEXPORTED_RUNTIME_METHODS='["FS","ccall","HEAPU8"]' \
  --no-entry -o ../bridge-probe.mjs
