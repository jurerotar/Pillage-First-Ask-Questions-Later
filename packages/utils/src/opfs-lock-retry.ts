export const isFileSystemLockError = (error: unknown): boolean => {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return (
      error.name === 'NoModificationAllowedError' ||
      error.message.includes('No modification allowed')
    );
  }

  if (error instanceof Error) {
    return (
      error.name === 'NoModificationAllowedError' ||
      error.message.includes('NoModificationAllowedError') ||
      error.message.includes('No modification allowed') ||
      error.message.includes('createSyncAccessHandle')
    );
  }

  return false;
};
