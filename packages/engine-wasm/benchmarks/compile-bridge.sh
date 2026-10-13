#!/usr/bin/env bash
set -euo pipefail
cd /workspace/packages/engine-wasm/build/bridge-review
hermes=/toolchain/hermes-clean
runtime=/toolchain/wasm-6.0.12
compiler=/toolchain/host-clean/bin/shermes
common=(-O2 -sSUPPORT_LONGJMP=wasm -DNDEBUG -fno-strict-aliasing -fno-strict-overflow -I"$runtime/lib/config" -I"$hermes/include" -I.)
"$compiler" -O -Xenable-tdz -emit-c -exported-unit=pillage_engine engine.js -o engine.c
"$compiler" -Xenable-tdz -emit-c -exported-unit=pillage_pump pump.js -o pump.c
emcc "${common[@]}" -c engine.c -o engine.o
emcc "${common[@]}" -c pump.c -o pump.o
emcc "${common[@]}" -c runtime.c -o runtime.o
em++ "${common[@]}" -std=c++17 -fwasm-exceptions -I"$hermes/public" -I"$hermes/API" -I"$hermes/API/jsi" -I"$hermes/external/llvh/include" -I"$hermes/external/llvh/gen/include" -I"$runtime/external/llvh/include" -c text-bindings.cpp -o text-bindings.o
emcc "${common[@]}" -c sqlite-bridge.c -o sqlite-bridge.o
em++ "${common[@]}" -std=c++17 -fwasm-exceptions -I"$hermes/external/llvh/include" -I"$hermes/external/llvh/gen/include" -I"$runtime/external/llvh/include" -c serial-executor.cpp -o serial-executor.o
exports='["_engine_initialize","_engine_dispatch","_engine_close","_engine_snapshot","_engine_snapshot_size"]'
settings=(-sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=4MB -sINITIAL_MEMORY=32MB -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=node -sEXPORTED_FUNCTIONS="$exports" '-sEXPORTED_RUNTIME_METHODS=["FS","ccall","HEAPU8"]' --no-entry)
for variant in baseline previous current; do
  if [ "$variant" != current ] && [ "${BRIDGE_BENCHMARK_HISTORY:-0}" != 1 ]; then continue; fi
  if [ ! -f "native-$variant.js" ]; then continue; fi
  "$compiler" -typed -O -Xenable-tdz -emit-c -exported-unit=pillage_sqlite "native-$variant.js" -o "native-$variant.c"
  emcc "${common[@]}" -c "native-$variant.c" -o "native-$variant.o"
  em++ -O2 -sSUPPORT_LONGJMP=wasm -fwasm-exceptions "native-$variant.o" engine.o pump.o runtime.o text-bindings.o sqlite3.o sqlite-bridge.o serial-executor.o -L"$runtime/lib" -L"$runtime/jsi" -L"$runtime/tools/shermes" -lshermes_console_a -lhermesvm_a -ljsi "${settings[@]}" -o "$variant.mjs"
done
emcc "${common[@]}" -c c-engine.c -o c-engine.o
emcc -O2 -sSUPPORT_LONGJMP=wasm c-engine.o sqlite3.o sqlite-bridge.o "${settings[@]}" '-sEXPORTED_FUNCTIONS=["_engine_initialize","_engine_dispatch","_engine_close","_engine_snapshot","_engine_snapshot_size","_review_snapshot_copy"]' -o c.mjs
