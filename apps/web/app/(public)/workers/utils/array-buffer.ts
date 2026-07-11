export const toTransferableArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const { buffer, byteOffset, byteLength } = bytes;

  if (
    buffer instanceof ArrayBuffer &&
    byteOffset === 0 &&
    byteLength === buffer.byteLength
  ) {
    return buffer;
  }

  const copy = new ArrayBuffer(byteLength);
  new Uint8Array(copy).set(bytes);

  return copy;
};
