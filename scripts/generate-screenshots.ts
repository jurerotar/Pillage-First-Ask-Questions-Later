// biome-ignore-all lint/suspicious/noConsole: This script intentionally logs progress while generating screenshots.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import sharp from 'sharp';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const LANDING_ASSETS_DIR = join(process.cwd(), '.github', 'assets', 'landing');
const LANDING_DIR = join(process.cwd(), 'apps', 'web', 'public', 'landing');
const PAGE_READY_TIMEOUT_MS = 60_000;
const PAGE_SETTLE_MS = 5000;

// Generate a timestamp for the image filenames
const timestamp = new Date()
  .toISOString()
  .replaceAll(/[-:T]/gu, '')
  .split('.')[0]
  .slice(0, 14); // YYYYMMDDHHMMSS

const saveScreenshot = async (page: Page, name: string) => {
  const screenshot = sharp(await page.screenshot({ type: 'png' }));

  for (const width of [240, 480, 720]) {
    await screenshot
      .clone()
      .resize({ width })
      .avif({ quality: 85, chromaSubsampling: '4:4:4' })
      .toFile(join(LANDING_ASSETS_DIR, `${name}-${width}.avif`));
  }
};

const waitForPageReady = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(PAGE_SETTLE_MS);
};

const gotoAndWaitForPageReady = async (page: Page, url: string) => {
  await page.goto(url);
  await waitForPageReady(page);
};

const disableDeveloperTools = async (page: Page) => {
  console.log('Disabling developer tools...');
  const preferencesUrl = page.url().replace('/resources', '/preferences');
  await gotoAndWaitForPageReady(page, preferencesUrl);

  const developerConsoleSwitch = page
    .getByText('Developer console', { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "flex gap-2")][1]')
    .getByRole('switch');

  await developerConsoleSwitch.waitFor({
    state: 'visible',
    timeout: PAGE_READY_TIMEOUT_MS,
  });

  const isChecked =
    (await developerConsoleSwitch.getAttribute('aria-checked')) === 'true';

  if (isChecked) {
    await developerConsoleSwitch.click();
    await waitForPageReady(page);
  }

  const resourcesUrl = page.url().replace('/preferences', '/resources');
  await gotoAndWaitForPageReady(page, resourcesUrl);
};

const generateScreenshotsForTheme = async (page: Page, themeSuffix = '') => {
  const suffix = themeSuffix ? `-${themeSuffix}` : '';

  // Take Resources screenshot
  await page
    .locator('[data-building-field-id="1"]')
    .waitFor({ state: 'visible', timeout: PAGE_READY_TIMEOUT_MS });
  console.log(`Taking resources screenshot${suffix}...`);
  await saveScreenshot(page, `image-1${suffix}-${timestamp}`);

  // Navigate to Village
  console.log(`Navigating to Village${suffix}...`);
  const villageUrl = page.url().replace('/resources', '/village/38');
  await gotoAndWaitForPageReady(page, villageUrl);
  console.log(`Taking village screenshot${suffix}...`);
  await saveScreenshot(page, `image-2${suffix}-${timestamp}`);

  // Navigate to Map
  console.log(`Navigating to Map${suffix}...`);
  const mapUrl = page.url().replace('/village/38', '/map');
  await gotoAndWaitForPageReady(page, mapUrl);
  console.log(`Taking map screenshot${suffix}...`);
  await saveScreenshot(page, `image-3${suffix}-${timestamp}`);

  // Navigate to /village
  console.log(`Navigating to /village${suffix}...`);
  const villageOverviewUrl = page.url().replace('/map', '/village');
  await gotoAndWaitForPageReady(page, villageOverviewUrl);
  console.log(`Taking village screenshot${suffix}...`);
  await saveScreenshot(page, `image-4${suffix}-${timestamp}`);

  // Navigate to Statistics
  console.log(`Navigating to /statistics${suffix}...`);
  const statisticsUrl = page.url().replace('/village', '/statistics');
  await gotoAndWaitForPageReady(page, statisticsUrl);
  console.log(`Taking statistics screenshot${suffix}...`);
  await saveScreenshot(page, `image-5${suffix}-${timestamp}`);
};

const generateScreenshots = async () => {
  mkdirSync(LANDING_ASSETS_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 700 },
    deviceScaleFactor: 3,
  });

  const page = await context.newPage();

  try {
    console.log(`Navigating to ${APP_URL}/game-worlds/create...`);
    await page.goto(`${APP_URL}/game-worlds/create`);

    // Fill the form
    console.log('Filling form...');
    await page.fill('input[name="playerConfiguration.name"]', 'Screenshot Bot');

    // The name and seed are auto-filled, we can just click create
    console.log('Creating game world...');
    await page.click('button[type="submit"]');

    // Wait for redirection to the game
    console.log('Waiting for redirection...');
    await page.waitForURL(/\/game\/s-.*\/v-1\/resources/u, { timeout: 60_000 });
    console.log('Redirected to game.');

    // Wait for the game to load
    await waitForPageReady(page);

    await disableDeveloperTools(page);

    // 1. Generate Light Mode Screenshots
    await generateScreenshotsForTheme(page, 'light');

    // 2. Switch to Dark Mode
    console.log('Navigating to Preferences...');
    const preferencesUrl = page.url().replace('/statistics', '/preferences');
    await gotoAndWaitForPageReady(page, preferencesUrl);

    // Find the UI color scheme select and change it to dark
    // Based on the code, it's a Select component
    console.log('Switching to Dark Mode...');
    await page.click('button:has-text("Light")');
    await page.click('div[role="option"]:has-text("Dark")');

    await waitForPageReady(page);

    // Navigate back to resources to start dark mode screenshots
    const resourcesUrl = page.url().replace('/preferences', '/resources');
    await gotoAndWaitForPageReady(page, resourcesUrl);

    // 3. Generate Dark Mode Screenshots
    await generateScreenshotsForTheme(page, 'dark');
  } finally {
    await browser.close();
  }

  // Publish the landing sizes before updating the timestamp consumed by the app.
  const publishedFiles = new Set(
    readdirSync(LANDING_ASSETS_DIR).filter(
      (file) => file.includes(`-${timestamp}-`) && file.endsWith('.avif'),
    ),
  );
  mkdirSync(LANDING_DIR, { recursive: true });
  for (const file of publishedFiles) {
    copyFileSync(join(LANDING_ASSETS_DIR, file), join(LANDING_DIR, file));
  }

  // Only remove the old set after the complete new set has been saved and converted.
  console.log('Cleaning up old screenshots...');
  for (const directory of [LANDING_ASSETS_DIR, LANDING_DIR]) {
    for (const file of readdirSync(directory)) {
      if (
        /^(?:image-|mobile-).*\.(?:avif|jpg)$/u.test(file) &&
        !publishedFiles.has(file)
      ) {
        unlinkSync(join(directory, file));
      }
    }
  }

  console.log('Screenshots generated successfully!');

  // Update README.md and apps/web/app/(public)/(index)/page.tsx
  console.log(`Updating references to timestamp ${timestamp}...`);

  const readmePath = join(process.cwd(), 'README.md');
  if (existsSync(readmePath)) {
    let readmeContent = readFileSync(readmePath, 'utf8');
    readmeContent = readmeContent.replaceAll(
      /\/landing\/image-([1-3])-(light|dark)-\d{14}-(240|480|720)\.avif/gu,
      `/landing/image-$1-$2-${timestamp}-$3.avif`,
    );

    writeFileSync(readmePath, readmeContent);
  }

  // Create screenshots.json for the landing page
  const screenshotsJsonPath = join(
    process.cwd(),
    'apps',
    'web',
    'app',
    '(public)',
    '(index)',
    'assets',
    'screenshots.json',
  );
  const screenshotsJson = {
    timestamp,
  };

  console.log(`Writing screenshots.json to ${screenshotsJsonPath}...`);
  writeFileSync(screenshotsJsonPath, JSON.stringify(screenshotsJson, null, 2));

  console.log('Images optimized and converted successfully!');
};

await generateScreenshots();
