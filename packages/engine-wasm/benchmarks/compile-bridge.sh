#!/usr/bin/env bash
set -euo pipefail
package_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
source "$package_root/build/toolchain.env"
cd "$package_root/build/bridge-review"
hermes=/toolchain/hermes-clean
runtime="/toolchain/wasm-$emscripten_version"
compiler=/toolchain/host-clean/bin/shermes
if [ "${1:-}" = '--identity' ]; then
  # Verify the installed compiler, vendor headers and linked libraries before reuse.
  {
    emcc --version
    em++ --version
    sha256sum "$compiler" "$(command -v emcc)" "$(command -v em++)" \
      "$runtime/tools/shermes/libshermes_console_a.a" \
      "$runtime/lib/libhermesvm_a.a" "$runtime/jsi/libjsi.a"
    find "$hermes/include" "$hermes/API" "$hermes/public" \
      "$hermes/external/llvh/include" "$hermes/external/llvh/gen/include" \
      "$runtime/lib/config" "$runtime/external/llvh/include" \
      -type f \( -name '*.h' -o -name '*.inc' -o -name '*.def' \) \
      -print0 | sort -z | xargs -0 sha256sum
  } | sha256sum
  exit
fi
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
"$compiler" -typed -O -Xenable-tdz -emit-c -exported-unit=pillage_sqlite native-current.js -o native-current.c
emcc "${common[@]}" -c native-current.c -o native-current.o
em++ -O2 -sSUPPORT_LONGJMP=wasm -fwasm-exceptions native-current.o engine.o pump.o runtime.o text-bindings.o sqlite3.o sqlite-bridge.o serial-executor.o -L"$runtime/lib" -L"$runtime/jsi" -L"$runtime/tools/shermes" -lshermes_console_a -lhermesvm_a -ljsi "${settings[@]}" -o current.mjs
emcc "${common[@]}" -c c-engine.c -o c-engine.o
emcc -O2 -sSUPPORT_LONGJMP=wasm c-engine.o sqlite3.o sqlite-bridge.o "${settings[@]}" '-sEXPORTED_FUNCTIONS=["_engine_initialize","_engine_dispatch","_engine_close","_engine_snapshot","_engine_snapshot_size","_review_snapshot_copy"]' -o c.mjs
