#!/usr/bin/env bash
set -euo pipefail
package_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$package_root/build/modular"
if [ "${1:-}" = '--native-only' ]; then
  if [ ! -f engine-source.sha256 ] || ! sha256sum --check --status engine-source.sha256; then
    echo 'Engine bundle changed; run a full build before --native-only.' >&2
    exit 1
  fi
fi
source "$package_root/build/toolchain.env"
source "$package_root/scripts/cache.sh"
if [ ! -f sqlite3.c ] || [ ! -f sqlite3.h ] || ! grep -q "^#define SQLITE_VERSION *\"${sqlite_version//./\.}\"" sqlite3.h; then
  curl -fL "$sqlite_url" -o sqlite.zip
  printf '%s  sqlite.zip\n' "$sqlite_sha256" | sha256sum --check --status
  unzip -jo sqlite.zip '*/sqlite3.c' '*/sqlite3.h'
fi
hermes=/toolchain/hermes-clean
runtime="/toolchain/wasm-$emscripten_version"
compiler=/toolchain/host-clean/bin/shermes
common=(-O2 -sSUPPORT_LONGJMP=wasm -DNDEBUG -fno-strict-aliasing -fno-strict-overflow -I"$runtime/lib/config" -I"$hermes/include" -I../../native -I.)
# Size-optimize generated API code; keep the hot VM, FFI and SQLite at O2.
engine_flags=("${common[@]}" -Oz)

# Hash vendor headers too: changing the toolchain must not reuse old objects.
headers=$(find "$hermes/include" "$hermes/API" "$hermes/public" "$hermes/external/llvh/include" "$hermes/external/llvh/gen/include" "$runtime/lib/config" "$runtime/external/llvh/include" ../../native -type f \( -name '*.h' -o -name '*.inc' -o -name '*.def' \) -print0 | sort -z | xargs -0 sha256sum | sha256sum)
compiler_identity=$(sha256sum "$compiler")
cc_identity="$(emcc --version) $(em++ --version) $(sha256sum "$(command -v emcc)" "$(command -v em++)") $headers"
engine_c_key=$(cache_key "$compiler_identity -O -Xenable-tdz -emit-c -exported-unit=pillage_engine" engine.js)
engine_o_key=$(cache_key "$cc_identity ${engine_flags[*]}" engine.c 2>/dev/null || true)
if [ "${1:-}" = '--native-only' ]; then
  if ! cache_valid engine-c "$engine_c_key" engine.c || ! cache_valid engine-o "$engine_o_key" engine.o; then
    echo 'Engine compiler, headers or artifacts changed; run a full build before --native-only.' >&2
    exit 1
  fi
fi

cache_run engine-c "$engine_c_key" engine.c -- "$compiler" -O -Xenable-tdz -emit-c -exported-unit=pillage_engine engine.js -o engine.c
cache_run native-c "$(cache_key "$compiler_identity -typed -O -Xenable-tdz -emit-c -exported-unit=pillage_sqlite" native.js)" native.c -- "$compiler" -typed -O -Xenable-tdz -emit-c -exported-unit=pillage_sqlite native.js -o native.c
cache_run pump-c "$(cache_key "$compiler_identity -Xenable-tdz -emit-c -exported-unit=pillage_pump" pump.js)" pump.c -- "$compiler" -Xenable-tdz -emit-c -exported-unit=pillage_pump pump.js -o pump.c

cache_run engine-o "$(cache_key "$cc_identity ${engine_flags[*]}" engine.c)" engine.o -- emcc "${engine_flags[@]}" -c engine.c -o engine.o
sha256sum engine.js > engine-source.sha256
sqlite_flags=(-DSQLITE_THREADSAFE=0 -DSQLITE_DEFAULT_MEMSTATUS=0 -DSQLITE_MAX_VARIABLE_NUMBER=32766)
cache_run sqlite-o "$(cache_key "$cc_identity ${common[*]} ${sqlite_flags[*]}" sqlite3.c sqlite3.h)" sqlite3.o -- emcc "${common[@]}" "${sqlite_flags[@]}" -c sqlite3.c -o sqlite3.o
for name in native pump runtime sqlite-bridge; do
  source_file="$name.c"
  if [ "$name" = runtime ] || [ "$name" = sqlite-bridge ]; then source_file="../../native/$name.c"; fi
  cache_run "$name-o" "$(cache_key "$cc_identity ${common[*]}" "$source_file")" "$name.o" -- emcc "${common[@]}" -c "$source_file" -o "$name.o"
done
cxx_flags=(-std=c++17 -fwasm-exceptions -I"$hermes/public" -I"$hermes/API" -I"$hermes/API/jsi" -I"$hermes/external/llvh/include" -I"$hermes/external/llvh/gen/include" -I"$runtime/external/llvh/include")
for name in serial-executor text-bindings; do
  cache_run "$name-o" "$(cache_key "$cc_identity ${common[*]} ${cxx_flags[*]}" "../../native/$name.cpp")" "$name.o" -- em++ "${common[@]}" "${cxx_flags[@]}" -c "../../native/$name.cpp" -o "$name.o"
done

objects=(native.o engine.o pump.o runtime.o sqlite3.o sqlite-bridge.o serial-executor.o text-bindings.o)
debug_flags=(-g0)
if [[ " $* " == *' --debug '* ]]; then debug_flags=(-g2); fi
link_flags=(-O2 "${debug_flags[@]}" -sSUPPORT_LONGJMP=wasm -fwasm-exceptions \
  -L"$runtime/lib" -L"$runtime/jsi" -L"$runtime/tools/shermes" -lshermes_console_a -lhermesvm_a -ljsi \
  -sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=4MB -sINITIAL_MEMORY=32MB \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createGameEngine -sENVIRONMENT=web,worker,node \
  -sEXCEPTION_STACK_TRACES=1 \
  -sEXPORTED_FUNCTIONS='["_engine_initialize","_engine_dispatch","_engine_close","_engine_snapshot","_engine_snapshot_size"]' \
  -sEXPORTED_RUNTIME_METHODS='["FS","ccall","HEAPU8"]' \
  --no-entry)
libraries=("$runtime/tools/shermes/libshermes_console_a.a" "$runtime/lib/libhermesvm_a.a" "$runtime/jsi/libjsi.a")
cache_run link "$(cache_key "$cc_identity ${link_flags[*]}" "${objects[@]}" "${libraries[@]}")" engine.mjs engine.wasm -- em++ "${objects[@]}" "${link_flags[@]}" -o engine.mjs
cp engine.mjs engine.wasm ..
