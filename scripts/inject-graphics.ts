import { clearDirectory, copyFolderSync } from './utils/fs.ts';

const installWebAppGraphicPacks = async () => {
  const sourceDir = 'node_modules/@pillage-first/graphics/dist/graphic-packs';
  const destDir = 'apps/web/public/graphic-packs';

  await clearDirectory(destDir);
  await copyFolderSync(sourceDir, destDir);
};

await installWebAppGraphicPacks();
