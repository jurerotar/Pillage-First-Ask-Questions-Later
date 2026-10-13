// Defined by the compiled FFI prelude. Every call stays inside the Wasm module.
export interface EngineNative {
  request(): string;
  respond(value: string): void;
  open(path: string): number;
  error(): string;
  prepare(sql: string): number;
  exec(sql: string): number;
  transaction(operation: number): number;
  reset(id: number, clear: number): number;
  step(id: number): number;
  finalize(id: number): number;
  parameter(id: number, name: string): number;
  bindNull(id: number, index: number): number;
  bindNumber(id: number, index: number, value: number): number;
  bindText(id: number, index: number, value: string): number;
  bindBlob(id: number, index: number, value: Uint8Array): number;
  columns(id: number): number;
  columnName(id: number, col: number): string;
  columnType(id: number, col: number): number;
  columnNumber(id: number, col: number): number;
  columnText(id: number, col: number): string;
  columnBlob(id: number, col: number): Uint8Array;
}

declare global {
  const engineNative: EngineNative;
  var enginePump: () => void;
}
