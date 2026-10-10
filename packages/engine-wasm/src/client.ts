import type { EngineRequest } from './core';

export type WasmModule = {
  FS: { writeFile(path: string, bytes: Uint8Array): void };
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
export type EngineResponse = {
  data?: unknown;
  error?: string;
  stack?: string;
  notifications: unknown[];
  nextDeadline: number | null;
};

export async function createEngine(
  bytes: Uint8Array,
  factory: () => Promise<WasmModule>,
) {
  const module = await factory();
  module.FS.writeFile('/world.sqlite3', bytes);
  if (!module.ccall('engine_initialize', 'number', [], [])) {
    module.ccall('engine_close', null, [], []);
    throw new Error('Compiled game engine initialization failed');
  }
  let closed = false;
  return {
    dispatch(
      request: EngineRequest & {
        notifications?: boolean;
      },
    ): EngineResponse {
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
      const result = JSON.parse(output as string) as EngineResponse;
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    snapshot(): Uint8Array {
      if (closed) {
        throw new Error('Game engine is closed');
      }
      const pointer = module.ccall(
        'engine_snapshot',
        'number',
        [],
        [],
      ) as number;
      const length = module.ccall(
        'engine_snapshot_size',
        'number',
        [],
        [],
      ) as number;
      if (!pointer || !length) {
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
}
