export class OutdatedDatabaseSchemaError extends Error {
  constructor() {
    super();
    this.name = 'OutdatedDatabaseSchemaError';
    this.message = 'Your game world version is outdated.';
    Object.setPrototypeOf(this, OutdatedDatabaseSchemaError.prototype);
  }
}
