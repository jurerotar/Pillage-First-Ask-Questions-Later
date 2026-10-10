#!/usr/bin/env bash
set -euo pipefail
cd /toolchain
apt-get update
apt-get install -y cmake ninja-build git libicu-dev
hermes_commit=f93e7648a419729f1bdb04638218c563efc3f47d
if [ ! -d hermes-clean ]; then
  git clone --depth 1 --branch static_h https://github.com/facebook/hermes.git hermes-clean
fi
git -C hermes-clean fetch --depth 1 origin "$hermes_commit"
git -C hermes-clean checkout "$hermes_commit"
# Build only committed upstream sources. Never patch the compiler or runtime.
git -C hermes-clean diff --exit-code
git -C hermes-clean rev-parse HEAD > /workspace/packages/engine-wasm/build/hermes-commit.txt
cmake -G Ninja -S hermes-clean -B host-clean -DCMAKE_BUILD_TYPE=Release -DHERMES_ENABLE_DEBUGGER=OFF
cmake --build host-clean --target shermes hermesc --parallel 8
cmake -G Ninja -S hermes-clean -B wasm-6.0.12 \
  -DCMAKE_TOOLCHAIN_FILE=/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake \
  -DIMPORT_HOST_COMPILERS=/toolchain/host-clean/ImportHostCompilers.cmake \
  -DCMAKE_BUILD_TYPE=Release -DHERMES_ENABLE_DEBUGGER=OFF -DHERMES_ENABLE_INTL=OFF -DHERMES_UNICODE_LITE=ON -DHERMES_ENABLE_NAPI=OFF -DHERMES_ENABLE_TEST_SUITE=OFF \
  -DHERMESVM_ALLOW_CONCURRENT_GC=OFF -DHAVE_SYS_IOCTL_H=0 \
  -DCMAKE_C_FLAGS='-sSUPPORT_LONGJMP=wasm' -DCMAKE_CXX_FLAGS='-sSUPPORT_LONGJMP=wasm -fwasm-exceptions' \
  -DCMAKE_EXE_LINKER_FLAGS='-sSUPPORT_LONGJMP=wasm -sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=4MB'
cmake --build wasm-6.0.12 --target shermes-dep --parallel 8
echo 'Hermes toolchain ready'
