const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITE_HOST = 'pillagefirst.com';
const INDEXNOW_KEY = '8dc7ec3a0f534e8f913cdca48b90f578';
const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;
const MANIFEST_PATH = '/.well-known/indexnow-urls.json';

export const isIndexableDeploy = (deploy) =>
  deploy.context === 'production' && deploy.branch === 'master';

export const submitIndexNowUrls = async (urls, fetchImplementation = fetch) => {
  if (urls.length === 0) {
    return;
  }

  const response = await fetchImplementation(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `IndexNow submission failed with HTTP ${response.status}: ${await response.text()}`,
    );
  }
};

export const handleDeploySucceeded = async (event) => {
  if (!isIndexableDeploy(event.deploy)) {
    // Function logs make skipped non-master invocations observable.
    // biome-ignore lint/suspicious/noConsole: intentional Netlify function logging
    console.log(
      `IndexNow: skipping ${event.deploy.context ?? 'unknown'} deploy for branch ${event.deploy.branch ?? 'unknown'}`,
    );
    return;
  }

  const deployOrigin =
    event.deploy.permalinkUrl ?? event.deploy.sslUrl ?? event.deploy.url;

  if (!deployOrigin) {
    throw new Error('IndexNow: deploy event did not include a deploy URL');
  }

  const manifestResponse = await fetch(new URL(MANIFEST_PATH, deployOrigin));

  if (!manifestResponse.ok) {
    throw new Error(
      `IndexNow: could not read deploy manifest (HTTP ${manifestResponse.status})`,
    );
  }

  const manifest = await manifestResponse.json();
  const urls = Array.isArray(manifest.urls)
    ? manifest.urls.filter(
        (url) => typeof url === 'string' && new URL(url).hostname === SITE_HOST,
      )
    : [];

  await submitIndexNowUrls(urls);
  // Function logs are the only durable record of the submission response.
  // biome-ignore lint/suspicious/noConsole: intentional Netlify function logging
  console.log(
    urls.length
      ? `IndexNow: submitted ${urls.join(', ')}`
      : 'IndexNow: no changed public URLs to submit',
  );
};

export default {
  deploySucceeded: handleDeploySucceeded,
};
