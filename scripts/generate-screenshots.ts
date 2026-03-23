import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const ASSETS_DIR = join(process.cwd(), '.github', 'assets');

// Generate a timestamp for the image filenames
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0].slice(0, 12); // YYYYMMDDHHMM

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
    path: join(ASSETS_DIR, `image-1${suffix}-${timestamp}.jpg`),
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
    path: join(ASSETS_DIR, `image-2${suffix}-${timestamp}.jpg`),
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
    path: join(ASSETS_DIR, `image-3${suffix}-${timestamp}.jpg`),
    type: 'jpeg',
    quality: 90,
  });

  // Navigate to /resources/5
  console.log(`Navigating to /village${suffix}...`);
  const resource5Url = page.url().replace('/map', '/village');
  await page.goto(resource5Url);
  await page.waitForLoadState('networkidle');
  console.log(`Taking village screenshot${suffix}...`);
  await page.screenshot({
    path: join(ASSETS_DIR, `image-4${suffix}-${timestamp}.jpg`),
    type: 'jpeg',
    quality: 90,
  });

  // Navigate to /resources/9
  console.log(`Navigating to /statistics${suffix}...`);
  const resource9Url = page.url().replace('/village', '/statistics');
  await page.goto(resource9Url);
  await page.waitForLoadState('networkidle');
  console.log(`Taking statistics screenshot${suffix}...`);
  await page.screenshot({
    path: join(ASSETS_DIR, `image-5${suffix}-${timestamp}.jpg`),
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
    await page.waitForURL(/\/game\/s-.*\/v-1\/resources/, { timeout: 60000 });
    console.log('Redirected to game.');

    // Wait for the game to load
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(1000); // Wait for potential transitions

    // 1. Generate Light Mode Screenshots
    await generateScreenshotsForTheme(page);

    // 2. Switch to Dark Mode
    console.log('Switching to Dark Mode...');
    const preferencesUrl = page.url().replace('/statistics', '/preferences');
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
  } catch (error) {
    console.error('Error during screenshot generation:', error);
    console.log('Proceeding with optimization of existing/partially generated images...');
  }

  await browser.close();

  // Remove old screenshots
  console.log('Cleaning up old screenshots...');
  const existingFiles = readdirSync(ASSETS_DIR);
  for (const file of existingFiles) {
    if (file.endsWith('.jpg') || file.endsWith('.avif')) {
      if (!file.includes(timestamp)) {
        unlinkSync(join(ASSETS_DIR, file));
      }
    }
  }

  console.log('Screenshots generated successfully!');

  // Optimize generated images
  console.log('Optimizing and converting images...');
  const baseNames = [
    'image-1',
    'image-2',
    'image-3',
    'image-4',
    'image-5',
  ];

  const filesToProcess: string[] = [];
  for (const baseName of baseNames) {
    filesToProcess.push(join(ASSETS_DIR, `${baseName}-${timestamp}.jpg`));
    filesToProcess.push(join(ASSETS_DIR, `${baseName}-dark-${timestamp}.jpg`));
  }

  for (const file of filesToProcess) {
    if (existsSync(file)) {
      await losslessOptimize(file);
      await convertToAvif(file);
    }
  }

  // Update README.md and apps/web/app/(public)/(index)/page.tsx
  console.log(`Updating references to timestamp ${timestamp}...`);

  const readmePath = join(process.cwd(), 'README.md');
  if (existsSync(readmePath)) {
    let readmeContent = readFileSync(readmePath, 'utf8');
    // Map old names or timestamped names to new sequential names with timestamp
    // image-1: resources, image-2: village, image-3: map
    readmeContent = readmeContent.replace(/\/image-3(-dark)?(-(\d{12}))?\.(jpg|avif)/g, `/image-3$1-${timestamp}.$4`);
    readmeContent = readmeContent.replace(/\/image-2(-dark)?(-(\d{12}))?\.(jpg|avif)/g, `/image-2$1-${timestamp}.$4`);
    readmeContent = readmeContent.replace(/\/image-1(-dark)?(-(\d{12}))?\.(jpg|avif)/g, `/image-1$1-${timestamp}.$4`);

    writeFileSync(readmePath, readmeContent);
  }

  // Create screenshots.json for the landing page
  const screenshotsJsonPath = join(process.cwd(), 'apps', 'web', 'app', '(public)', '(index)', 'assets', 'screenshots.json');
  const screenshotsJson = {
    timestamp,
  };

  console.log(`Writing screenshots.json to ${screenshotsJsonPath}...`);
  writeFileSync(screenshotsJsonPath, JSON.stringify(screenshotsJson, null, 2));

  console.log('Images optimized and converted successfully!');
};

await generateScreenshots();
