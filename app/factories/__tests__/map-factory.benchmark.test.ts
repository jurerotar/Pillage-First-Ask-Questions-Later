import { describe, test } from 'vitest';
import { mapFactory } from 'app/factories/map-factory';
import { generateNpcPlayers } from 'app/factories/player-factory';
import { serverMock } from 'app/tests/mocks/game/server-mock';

const npcPlayers = generateNpcPlayers(serverMock);

describe.skip('mapFactory performance', () => {
  test('runs mapFactory 100 times and measures average execution time', () => {
    const iterations = 100;

    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      mapFactory({ server: serverMock, npcPlayers });
      const end = performance.now();
      durations.push(end - start);
    }

    const total = durations.reduce((sum, val) => sum + val, 0);
    const average = total / iterations;

    // biome-ignore lint/suspicious/noConsole: Needed to show results
    console.log(
      `⏱️ mapFactory ran ${iterations} times`,
      `➡️ Average duration: ${average.toFixed(2)} ms`,
      `📊 Total time: ${total.toFixed(2)} ms`,
    );
  });
});
