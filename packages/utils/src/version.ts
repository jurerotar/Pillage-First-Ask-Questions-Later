export const parseAppVersion = (version: string): [number, number, number] => {
  const [major, minor, patch] = version.split('.');

  return [
    Number.parseInt(major, 10),
    Number.parseInt(minor, 10),
    Number.parseInt(patch, 10),
  ];
};

// This 32-bit number is stored as user_version in SQLite. We compare this to app version to determine if database is outdated.
export const parseDatabaseUserVersion = (
  version: number,
): [number, number, number] => {
  const major = Math.floor(version / 1_000_000);
  const minor = Math.floor((version % 1_000_000) / 1_000);
  const patch = version % 1_000;

  return [major, minor, patch];
};

export const encodeAppVersionToDatabaseUserVersion = (
  version: string,
): number => {
  const [major, minor, patch] = parseAppVersion(version);

  return major * 1_000_000 + minor * 1_000 + patch;
};
