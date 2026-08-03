export class OutdatedDatabaseSchemaError extends Error {
  static readonly name = 'OutdatedDatabaseSchemaError';

  constructor() {
    super('Your game world version is outdated.');
    this.name = OutdatedDatabaseSchemaError.name;
    Object.setPrototypeOf(this, OutdatedDatabaseSchemaError.prototype);
  }
}

export class BuildingConstructionQueueFullError extends Error {
  static readonly name = 'BuildingConstructionQueueFullError';

  constructor() {
    super('Building construction queue is full');
    this.name = BuildingConstructionQueueFullError.name;
    Object.setPrototypeOf(this, BuildingConstructionQueueFullError.prototype);
  }
}
