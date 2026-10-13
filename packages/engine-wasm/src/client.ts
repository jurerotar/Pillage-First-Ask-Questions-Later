import {
  databasePath,
  type EngineRequest,
  type EngineResponse,
  parseResponse,
} from './protocol';

export type { EngineRequest, EngineResponse } from './protocol';

export type WasmModule = {
  FS: {
    writeFile(path: string, bytes: Uint8Array): void;
    unlink(path: string): void;
  };
  HEAPU8: Uint8Array;
  ccall(
    name: string,
    result: 'number',
    args: string[],
    values: unknown[],
  ): number;
  ccall(
    name: string,
    result: 'string',
    args: string[],
    values: unknown[],
  ): string;
  ccall(name: string, result: null, args: string[], values: unknown[]): void;
  ccall(
    name: string,
    result: string | null,
    args: string[],
    values: unknown[],
  ): unknown;
};
export type WasmModuleOptions = {
  locateFile?: (file: string, prefix: string) => string;
  wasmBinary?: Uint8Array;
  print?: (message: string) => void;
  printErr?: (message: string) => void;
};
export type WasmFactory = (options?: WasmModuleOptions) => Promise<WasmModule>;

export const createEngine = async (bytes: Uint8Array, factory: WasmFactory) => {
  const module = await factory();
  try {
    module.FS.writeFile(databasePath, bytes);
    if (!module.ccall('engine_initialize', 'number', [], [])) {
      throw new Error('Compiled game engine initialization failed');
    }
    // SQLite owns its deserialized image; release the temporary MEMFS copy.
    module.FS.unlink(databasePath);
  } catch (error) {
    module.ccall('engine_close', null, [], []);
    throw error;
  }
  let closed = false;
  return {
    dispatch(request: EngineRequest): EngineResponse {
      if (closed) {
        throw new Error('Game engine is closed');
      }
      const output = module.ccall(
        'engine_dispatch',
        'string',
        ['string'],
        [JSON.stringify(request)],
      );
      if (!output) {
        throw new Error('Compiled game engine trapped while dispatching');
      }
      return parseResponse(output);
    },
    snapshot(): Uint8Array {
      if (closed) {
        throw new Error('Game engine is closed');
      }
      const pointer = module.ccall('engine_snapshot', 'number', [], []);
      const length = module.ccall('engine_snapshot_size', 'number', [], []);
      if (
        !Number.isSafeInteger(pointer) ||
        !Number.isSafeInteger(length) ||
        pointer <= 0 ||
        length <= 0 ||
        pointer + length > module.HEAPU8.length
      ) {
        throw new Error('Could not serialize game engine database');
      }
      return module.HEAPU8.slice(pointer, pointer + length);
    },
    close() {
      if (closed) {
        return;
      }
      module.ccall('engine_close', null, [], []);
      closed = true;
    },
  };
};
