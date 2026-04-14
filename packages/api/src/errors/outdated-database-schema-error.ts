export class OutdatedDatabaseSchemaError extends Error {
  static readonly name = 'OutdatedDatabaseSchemaError';

  constructor() {
    super('Your game world version is outdated.');
    this.name = OutdatedDatabaseSchemaError.name;
    Object.setPrototypeOf(this, OutdatedDatabaseSchemaError.prototype);
  }
}
