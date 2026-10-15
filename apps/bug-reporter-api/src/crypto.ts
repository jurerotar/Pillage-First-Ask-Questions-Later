import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

export const createRandomToken = (): string =>
  randomBytes(32).toString('base64url');

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const createSignature = (secret: string, value: string): string =>
  createHmac('sha256', secret).update(value).digest('base64url');

export const isSignatureValid = (
  secret: string,
  value: string,
  signature: string,
): boolean => {
  const expected = Buffer.from(createSignature(secret, value));
  const received = Buffer.from(signature);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
};

export const isTokenValid = (expected: string, received: string): boolean => {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);

  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  );
};
