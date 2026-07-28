import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const repositoryUrl =
  'https://api.github.com/repos/jurerotar/Pillage-First-Ask-Questions-Later';
const publicDir = join('apps', 'web', 'public');

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Pillage-First-GitHub-Data',
  'X-GitHub-Api-Version': '2022-11-28',
};

const fetchGithubJson = async (resource = ''): Promise<unknown> => {
  const response = await fetch(`${repositoryUrl}${resource}`, { headers });

  if (!response.ok) {
    throw new Error(
      `GitHub request for "${resource || '/'}" failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

const [repository, contributors] = await Promise.all([
  fetchGithubJson(),
  fetchGithubJson('/contributors?per_page=12'),
]);

await Promise.all([
  writeFile(
    join(publicDir, 'github-repository.json'),
    `${JSON.stringify(repository, null, 2)}\n`,
    'utf8',
  ),
  writeFile(
    join(publicDir, 'github-contributors.json'),
    `${JSON.stringify(contributors, null, 2)}\n`,
    'utf8',
  ),
]);
