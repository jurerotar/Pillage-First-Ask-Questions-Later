import { clearDirectory, copyFolderSync } from './utils/fs.ts';
import { join } from 'node:path';
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';

const installWebAppGraphicPacks = async () => {
  const sourceDir = 'node_modules/@pillage-first/graphics/dist/graphic-packs';
  const destDir = 'apps/web/public/graphic-packs';

  await clearDirectory(destDir);
  await copyFolderSync(sourceDir, destDir);
};

const installFaviconAndLogos = async () => {
  const sourceBaseDir = 'node_modules/@pillage-first/graphics/dist';
  const faviconDestDir = 'apps/web/public/favicon';
  const rootDestDir = 'apps/web/public';

  if (!existsSync(faviconDestDir)) {
    mkdirSync(faviconDestDir, { recursive: true });
  }

  // Copy favicon folder
  const faviconSourceDir = join(sourceBaseDir, 'favicon');
  if (existsSync(faviconSourceDir)) {
    await copyFolderSync(faviconSourceDir, faviconDestDir);
  }

  // Copy pillage-first-logo.* files to rootDestDir
  const files = readdirSync(sourceBaseDir);
  for (const file of files) {
    if (file.startsWith('pillage-first-logo.')) {
      const src = join(sourceBaseDir, file);
      const dest = join(rootDestDir, file);
      copyFileSync(src, dest);
    }
  }
};

const copyLandingScreenshots = async () => {
  const sourceDir = '.github/assets';
  const destDir = 'apps/web/public/landing';

  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  // Clear destination directory to remove old files
  const existingDestFiles = readdirSync(destDir);
  for (const file of existingDestFiles) {
    if (file.startsWith('mobile-') || file.startsWith('image-')) {
      // We only want to clear the screenshots we manage
      const { unlinkSync } = await import('node:fs');
      unlinkSync(join(destDir, file));
    }
  }

  const sourceFiles = readdirSync(sourceDir);
  for (const file of sourceFiles) {
    if ((file.startsWith('mobile-') || file.startsWith('image-')) && (file.endsWith('.jpg') || file.endsWith('.avif'))) {
      const src = join(sourceDir, file);
      const dest = join(destDir, file);
      copyFileSync(src, dest);
    }
  }
};

await installWebAppGraphicPacks();
await installFaviconAndLogos();
await copyLandingScreenshots();
