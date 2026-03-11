export class VacationModeEnabledError extends Error {
  readonly serverSlug: string | null;

  constructor(serverSlug?: string) {
    super();
    this.name = 'VacationModeEnabledError';
    this.message = 'Vacation mode is enabled for this game world.';
    this.serverSlug = serverSlug ?? null;
    Object.setPrototypeOf(this, VacationModeEnabledError.prototype);
  }
}
