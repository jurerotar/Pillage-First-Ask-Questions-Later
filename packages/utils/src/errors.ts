export class OutdatedDatabaseSchemaError extends Error {
  static readonly name = 'OutdatedDatabaseSchemaError';

  constructor() {
    super(
      "Your game world is outdated. We regularly update the game with new feature. Your game worlds automatically update themselves to latest version of the app, whenever they are opened. If you are seeing this error, it means either a breaking change has been released or the game world hasn't been opened in a while.",
    );
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
