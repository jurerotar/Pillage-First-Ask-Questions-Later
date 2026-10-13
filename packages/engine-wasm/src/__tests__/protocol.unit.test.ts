import { expect, test } from 'vitest';
import { parseRequest, parseResponse } from '../protocol';

test('request envelopes preserve API payloads and allow a zero scheduler limit', () => {
  const body = { value: 'Živjo 🐉', nested: [null, true] };
  expect(
    parseRequest(
      JSON.stringify({
        type: 'request',
        url: '/server',
        method: 'PATCH',
        body,
        notifications: false,
      }),
    ),
  ).toEqual({
    type: 'request',
    url: '/server',
    method: 'PATCH',
    body,
    notifications: false,
  });
  expect(parseRequest('{"type":"advance","now":0,"limit":0}')).toMatchObject({
    type: 'advance',
    now: 0,
    limit: 0,
  });
});

test.each([
  null,
  [],
  {},
  { type: 'request', url: '/server' },
  { type: 'request', url: '/server', method: 'GET', notifications: 'false' },
  { type: 'advance', now: '0' },
  { type: 'advance', now: 0, limit: -1 },
  { type: 'advance', now: 0, limit: 0.5 },
])('rejects malformed request envelopes before API execution: %j', (value) => {
  expect(() => parseRequest(JSON.stringify(value))).toThrow(
    'Invalid engine request',
  );
});

test('native errors remain visible and success responses require transport fields', () => {
  expect(() => parseResponse('{"error":"SQLite failure"}')).toThrow(
    'SQLite failure',
  );
  for (const value of [
    null,
    {},
    { notifications: [] },
    { notifications: [], nextDeadline: 'soon' },
  ]) {
    expect(() => parseResponse(JSON.stringify(value))).toThrow(
      'Invalid engine response',
    );
  }
  const response = {
    data: { value: 0 },
    notifications: [],
    nextDeadline: null,
  };
  expect(parseResponse(JSON.stringify(response))).toEqual(response);
});
