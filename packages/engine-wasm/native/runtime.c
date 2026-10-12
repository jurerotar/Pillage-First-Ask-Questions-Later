#include "hermes/VM/static_h.h"
#include "sqlite-bridge.h"
#include <emscripten/emscripten.h>
#include <stdlib.h>

extern SHUnit *sh_export_pillage_engine(void);
extern SHUnit *sh_export_pillage_sqlite(void);
extern SHUnit *sh_export_pillage_pump(void);
extern void engine_install_text_bindings(SHRuntime *runtime);
extern const char *engine_input;
extern char *engine_output;
static SHRuntime *runtime;

EMSCRIPTEN_KEEPALIVE int engine_initialize(void) {
  if (runtime)
    return 0;
  runtime = _sh_init(0, NULL);
  engine_install_text_bindings(runtime);
  if (!_sh_initialize_units(runtime, 2, sh_export_pillage_sqlite,
                            sh_export_pillage_engine))
    return 0;
  return 1;
}
EMSCRIPTEN_KEEPALIVE const char *engine_dispatch(const char *input) {
  if (!runtime)
    return NULL;
  engine_input = input;
  SHLegacyValue result;
  // Hermes reuses the initialized unit and establishes a valid call frame.
  int success = _sh_unit_init_guarded(runtime, sh_export_pillage_pump, &result);
  engine_input = "{}";
  return success ? engine_output : NULL;
}
EMSCRIPTEN_KEEPALIVE void engine_close(void) {
  s_close();
  if (runtime)
    _sh_done(runtime);
  runtime = NULL;
  free(engine_output);
  engine_output = NULL;
}
