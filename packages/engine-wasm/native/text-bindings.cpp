#include "hermes/VM/static_h.h"
#include "hermes/hermes.h"
#include "jsi/jsi.h"
#include "sqlite-bridge.h"
#include <climits>
#include <cmath>
#include <utility>

namespace jsi = facebook::jsi;

static bool valid_utf16(const char16_t *text, size_t length) {
  for (size_t i = 0; i < length; i++) {
    if (text[i] >= 0xd800 && text[i] <= 0xdbff) {
      if (++i >= length || text[i] < 0xdc00 || text[i] > 0xdfff)
        return false;
    } else if (text[i] >= 0xdc00 && text[i] <= 0xdfff) {
      return false;
    }
  }
  return true;
}

static void invalid_text(jsi::Runtime &runtime) {
  // Preserve encodeURIComponent's error type as well as its strict validation.
  auto error = runtime.global().getPropertyAsFunction(runtime, "URIError")
                   .callAsConstructor(runtime, "URI malformed");
  throw jsi::JSError(runtime, std::move(error));
}

extern "C" void engine_install_text_bindings(SHRuntime *shr) {
  auto &runtime = *_sh_get_hermes_runtime(shr);
  auto bind = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "engineBindText"), 3,
      [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args,
         size_t count) -> jsi::Value {
        if (count != 3 || !args[0].isNumber() || !args[1].isNumber() ||
            !args[2].isString())
          throw jsi::JSError(rt, "Invalid text binding arguments");
        const double handle = args[0].getNumber();
        const double parameter = args[1].getNumber();
        if (!std::isfinite(handle) || handle < 1 || handle > INT_MAX ||
            std::floor(handle) != handle || !std::isfinite(parameter) ||
            parameter < 1 || parameter > INT_MAX ||
            std::floor(parameter) != parameter)
          return jsi::Value(21); // SQLITE_MISUSE; native checks handle ownership.
        const int id = (int)handle;
        const int index = (int)parameter;
        auto string = args[2].asString(rt);
        const size_t total = string.length(rt);
        int code = 21;
        bool invalid = false;
        bool too_long = false;
        bool fragmented = false;
        unsigned callbacks = 0;
        auto consume = [&](bool ascii, const void *data, size_t length) {
          // Runtime/GC calls are forbidden while this borrowed span is live.
          // SQLite copies it synchronously, so no pointer escapes the callback.
          if (++callbacks != 1 || length != total) {
            fragmented = true;
            return;
          }
          if (length > (size_t)INT_MAX / (ascii ? 1 : 2)) {
            too_long = true;
            return;
          }
          if (ascii) {
            code = s_bind_text(id, index,
                               length ? (const char *)data : "", (int)length);
          } else if (valid_utf16((const char16_t *)data, length)) {
            code = s_bind_text16(id, index, data, (int)(length * 2));
          } else {
            invalid = true;
          }
        };
        string.getStringData(rt, consume);
        // The pinned runtime supplies one span. Preserve correctness if another
        // JSI implementation fragments strings, without copying the common case.
        if (fragmented || callbacks == 0) {
          if (total > (size_t)INT_MAX / 2)
            throw jsi::JSError(rt, "Text binding exceeds SQLite byte limit");
          const auto text = string.utf16(rt);
          if (!valid_utf16(text.data(), text.size()))
            invalid_text(rt);
          code = s_bind_text16(id, index, text.data(), (int)(text.size() * 2));
        } else if (invalid) {
          invalid_text(rt);
        } else if (too_long) {
          throw jsi::JSError(rt, "Text binding exceeds SQLite byte limit");
        }
        return jsi::Value(code);
      });
  runtime.global().setProperty(runtime, "engineBindText", std::move(bind));
}
