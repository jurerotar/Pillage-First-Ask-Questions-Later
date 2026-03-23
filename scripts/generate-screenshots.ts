import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const ASSETS_DIR = join(process.cwd(), '.github', 'assets');

const losslessOptimize = async (filePath: string) => {
  console.log(`Optimizing JPEG ${filePath}...`);
  const buffer = readFileSync(filePath);
  const optimizedBuffer = await sharp(buffer)
    .jpeg({ mozjpeg: true, quality: 90 })
    .toBuffer();
  writeFileSync(filePath, optimizedBuffer);
};

const convertToAvif = async (filePath: string) => {
  const avifPath = join(
    ASSETS_DIR,
    `${basename(filePath, extname(filePath))}.avif`,
  );
  console.log(`Converting ${filePath} to AVIF ${avifPath}...`);
  await sharp(filePath)
    .avif({ quality: 60, lossless: false })
    .toFile(avifPath);
};

const generateScreenshotsForTheme = async (page: any, themeSuffix: string = '') => {
  const suffix = themeSuffix ? `-${themeSuffix}` : '';

  // Take Resources screenshot
  console.log(`Taking resources screenshot${suffix}...`);
  await page.screenshot({
    path: join(ASSETS_DIR, `mobile-resources-view${suffix}.jpg`),
    type: 'jpeg',
    quality: 90,
    fullPage: false
  });

  // Navigate to Village
  console.log(`Navigating to Village${suffix}...`);
  const villageUrl = page.url().replace('/resources', '/village/38');
  await page.goto(villageUrl);
  await page.waitForLoadState('networkidle');
  console.log(`Taking village screenshot${suffix}...`);
  await page.screenshot({
    path: join(ASSETS_DIR, `mobile-main-building-view${suffix}.jpg`),
    type: 'jpeg',
    quality: 90,
  });

  // Navigate to Map
  console.log(`Navigating to Map${suffix}...`);
  const mapUrl = page.url().replace('/village/38', '/map');
  await page.goto(mapUrl);
  await page.waitForLoadState('networkidle');
  console.log(`Taking map screenshot${suffix}...`);
  await page.screenshot({
    path: join(ASSETS_DIR, `mobile-map-view${suffix}.jpg`),
    type: 'jpeg',
    quality: 90,
  });
};

const generateScreenshots = async () => {
  if (!existsSync(ASSETS_DIR)) {
    mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 630 }, // 629 * 3 = 1887
    deviceScaleFactor: 3,
  });

  const page = await context.newPage();

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
  await page.waitForURL(/\/game\/s-.*\/v-1\/resources/, { timeout: 60000 });
  console.log('Redirected to game.');

  // Wait for the game to load
  await page.waitForLoadState('networkidle');

  // 1. Generate Light Mode Screenshots
  await generateScreenshotsForTheme(page);

  // 2. Switch to Dark Mode
  console.log('Switching to Dark Mode...');
  const preferencesUrl = page.url().replace('/map', '/preferences');
  await page.goto(preferencesUrl);
  await page.waitForLoadState('networkidle');

  // Find the UI color scheme select and change it to dark
  // Based on the code, it's a Select component
  await page.click('button:has-text("Light")');
  await page.click('div[role="option"]:has-text("Dark")');

  // Also change Graphics color scheme to Night for full dark mode effect
  await page.click('button:has-text("Day")');
  await page.click('div[role="option"]:has-text("Night")');

  await page.waitForTimeout(1000); // Wait for potential transitions

  // Navigate back to resources to start dark mode screenshots
  const resourcesUrl = page.url().replace('/preferences', '/resources');
  await page.goto(resourcesUrl);
  await page.waitForLoadState('networkidle');

  // 3. Generate Dark Mode Screenshots
  await generateScreenshotsForTheme(page, 'dark');

  await browser.close();
  console.log('Screenshots generated successfully!');

  // Optimize generated images
  console.log('Optimizing and converting images...');
  const baseNames = [
    'mobile-resources-view',
    'mobile-main-building-view',
    'mobile-map-view',
  ];

  const filesToProcess: string[] = [];
  for (const baseName of baseNames) {
    filesToProcess.push(join(ASSETS_DIR, `${baseName}.jpg`));
    filesToProcess.push(join(ASSETS_DIR, `${baseName}-dark.jpg`));
  }

  for (const file of filesToProcess) {
    if (existsSync(file)) {
      await losslessOptimize(file);
      await convertToAvif(file);
    }
  }
  console.log('Images optimized and converted successfully!');
};

await generateScreenshots();
