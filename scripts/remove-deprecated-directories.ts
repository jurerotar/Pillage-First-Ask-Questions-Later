import { clearDirectory } from './utils/fs';

const removeDeprecatedRootLevelDirectories = async () => {
  await clearDirectory('./public');
  await clearDirectory('./build');
  await clearDirectory('./.react-router');
};

await removeDeprecatedRootLevelDirectories();
