import assert from 'node:assert/strict';
import { type Browser, chromium } from 'playwright';
import { test } from 'vitest';
import { startBrowserServer } from './browser-server';

test('browser integration', async () => {
  // Read the fixture worker's open/save/reopen result in a disposable browser.
  const stopServer = await startBrowserServer();
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4179');
    await page.waitForFunction(
      () => ['passed', 'failed'].includes(window.verification?.status ?? ''),
      undefined,
      { timeout: 60000 },
    );
    const result = await page.evaluate(() => window.verification);
    assert.ok(result);
    assert.equal(result.status, 'passed');
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    try {
      await browser?.close();
    } finally {
      stopServer();
    }
  }
});
