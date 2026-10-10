#include "hermes/Support/SerialExecutor.h"

// Wasm has a single owner: the frontend worker. Supply synchronous finalizer
// dispatch at link time, without patching Hermes source or generated API code.
namespace hermes {
SerialExecutor::~SerialExecutor() = default;
void SerialExecutor::add(llvh::unique_function<void()> task) {
  task();
}
} // namespace hermes
