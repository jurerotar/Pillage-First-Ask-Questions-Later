import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  isIndexableDeploy,
  submitIndexNowUrls,
} from '../indexnow-on-deploy.mjs';

test('only indexes production deploys from master', () => {
  assert.equal(
    isIndexableDeploy({ context: 'production', branch: 'master' }),
    true,
  );
  assert.equal(
    isIndexableDeploy({ context: 'production', branch: 'feature/test' }),
    false,
  );
  assert.equal(
    isIndexableDeploy({ context: 'deploy-preview', branch: 'master' }),
    false,
  );
  assert.equal(
    isIndexableDeploy({ context: 'production', branch: null }),
    false,
  );
});

test('submits the expected IndexNow payload', async () => {
  const requests = [];
  const urls = ['https://pillagefirst.com/frequently-asked-questions'];

  await submitIndexNowUrls(urls, async (url, init) => {
    requests.push({ url, init });
    return new Response(null, { status: 200 });
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://api.indexnow.org/indexnow');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    host: 'pillagefirst.com',
    key: '8dc7ec3a0f534e8f913cdca48b90f578',
    keyLocation:
      'https://pillagefirst.com/8dc7ec3a0f534e8f913cdca48b90f578.txt',
    urlList: urls,
  });
});

test('does not call IndexNow for an empty URL list', async () => {
  let called = false;

  await submitIndexNowUrls([], async () => {
    called = true;
    return new Response(null, { status: 200 });
  });

  assert.equal(called, false);
});
