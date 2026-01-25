import { clearDirectory } from './utils/fs.ts';

const removeDeprecatedRootLevelDirectories = async () => {
  await clearDirectory('./public');
  await clearDirectory('./build');
  await clearDirectory('./.react-router');
};

await removeDeprecatedRootLevelDirectories();
