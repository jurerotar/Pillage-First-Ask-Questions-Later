```typescript
import { describe, it, beforeAll } from 'vitest';
import { QueryClient, hydrate } from '@tanstack/react-query';
import fs from 'fs/promises';
import path from 'path';

import { encode as msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';
import { stringify as zipsonStringify, parse as zipsonParse } from 'zipson';
import { pack as jsonpackPack, unpack as jsonpackUnpack } from 'jsonpack';

const DATA_PATH = path.join(__dirname, './state.json');
const NUM_RUNS = 100;

let rawJson: string;
let parsedJson: any;
let msgpackBuffer: Uint8Array;
let zipsonText: string;
let jsonpackText: string;

beforeAll(async () => {
  rawJson = await fs.readFile(DATA_PATH, 'utf-8');
  parsedJson = JSON.parse(rawJson);

  msgpackBuffer = msgpackEncode(parsedJson);
  zipsonText = zipsonStringify(parsedJson);
  jsonpackText = jsonpackPack(parsedJson);
});

function benchmark(fn: () => void): number {
  const start = performance.now();
  for (let i = 0; i < NUM_RUNS; i++) {
    fn();
  }
  return performance.now() - start;
}

function hydrateFrom(data: any) {
  const queryClient = new QueryClient();
  hydrate(queryClient, data);
}

describe('Hydration deserialization benchmarks', () => {
  it('should compare read + parse + hydrate performance (no reviver/replacer)', () => {
    const baseline = benchmark(() => {
      const state = JSON.parse(rawJson);
      hydrateFrom(state);
    });

    const msgpack = benchmark(() => {
      const state = msgpackDecode(msgpackBuffer);
      hydrateFrom(state);
    });

    const zipson = benchmark(() => {
      const state = zipsonParse(zipsonText);
      hydrateFrom(state);
    });

    const jsonpack = benchmark(() => {
      const state = jsonpackUnpack(jsonpackText);
      hydrateFrom(state);
    });

    console.log(`;\n⏱️  Deserialization + Hydration (${NUM_RUNS} runs)`)
    console.log(`JSON.parse       : ${baseline.toFixed(2)}ms`);
    console.log(`MessagePack      : ${msgpack.toFixed(2)}ms`);
    console.log(`Zipson           : ${zipson.toFixed(2)}ms`);
    console.log(`JSONPack         : ${jsonpack.toFixed(2)}ms`);

    console.log(`\n📦 Serialized Sizes`);
    console.log(`Raw JSON   : ${Buffer.byteLength(rawJson)} bytes`);
    console.log(`MessagePack: ${msgpackBuffer.length} bytes`);
    console.log(`Zipson     : ${Buffer.byteLength(zipsonText)} bytes`);
    console.log(`JSONPack   : ${Buffer.byteLength(jsonpackText)} bytes`);
}, { timeout: 30_000 })
});
```

```;
⏱️  Deserialization + Hydration (100 runs)
JSON.parse       : 1257.89ms
MessagePack      : 1369.89ms
Zipson           : 2634.28ms
JSONPack         : 3544.47ms

📦 Serialized Sizes
Raw JSON   : 4336845 bytes
MessagePack: 1241937 bytes
Zipson     : 880167 bytes
JSONPack   : 1242494 bytes
```
