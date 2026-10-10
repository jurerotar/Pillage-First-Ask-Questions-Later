import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { test } from 'vitest';
import { startBrowserServer } from './browser-server';

test('browser integration', async () => {
  // Read the fixture worker's open/save/reopen result in a disposable browser.
  const stopServer = await startBrowserServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4179');
    await page.waitForFunction(
      () => ['passed', 'failed'].includes(window.verification?.status ?? ''),
      { timeout: 60000 },
    );
    const result = await page.evaluate(() => window.verification);
    assert.ok(result);
    assert.equal(result.status, 'passed');
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await browser.close();
    stopServer();
  }
});
