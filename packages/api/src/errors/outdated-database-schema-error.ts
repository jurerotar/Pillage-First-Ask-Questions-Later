export class OutdatedDatabaseSchemaError extends Error {
  constructor() {
    super('Your game world version is outdated.');
    this.name = 'OutdatedDatabaseSchemaError';
    Object.setPrototypeOf(this, OutdatedDatabaseSchemaError.prototype);
  }
}
