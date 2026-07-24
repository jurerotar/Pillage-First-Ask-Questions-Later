const GITHUB_API_ORIGIN = 'https://api.github.com';
const REPOSITORY = 'jurerotar/Pillage-First-Ask-Questions-Later';

const responseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
  'Content-Type': 'application/json',
  'Netlify-CDN-Cache-Control':
    'public, s-maxage=3600, stale-while-revalidate=86400',
};

const githubRequestHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Pillage-First-Netlify-Edge-Function',
  'X-GitHub-Api-Version': '2022-11-28',
};

const getGithubApiUrl = (pathname: string) => {
  if (pathname === '/api/github/repository') {
    return `${GITHUB_API_ORIGIN}/repos/${REPOSITORY}`;
  }

  if (pathname === '/api/github/contributors') {
    return `${GITHUB_API_ORIGIN}/repos/${REPOSITORY}/contributors?per_page=12`;
  }

  return null;
};

export const handleGithubRequest = async (
  request: Request,
  fetchImplementation: typeof fetch = fetch,
) => {
  const githubApiUrl = getGithubApiUrl(new URL(request.url).pathname);

  if (!githubApiUrl) {
    return Response.json({ error: 'Unknown GitHub resource' }, { status: 404 });
  }

  const githubResponse = await fetchImplementation(githubApiUrl, {
    headers: githubRequestHeaders,
  });

  if (!githubResponse.ok) {
    return Response.json(
      { error: 'Failed to fetch GitHub data' },
      { status: githubResponse.status },
    );
  }

  return new Response(await githubResponse.text(), {
    headers: responseHeaders,
  });
};

export default handleGithubRequest;
