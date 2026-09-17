import type { SerializedError } from '@pillage-first/types/api-events';

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

export const serializeError = (error: unknown): SerializedError => {
  if (!(error instanceof Error)) {
    return { name: 'Error', message: String(error) };
  }

  return {
    name: error.name,
    message: error.message,
    ...(error.stack && { stack: error.stack }),
    ...(error.cause !== undefined && {
      cause:
        error.cause instanceof Error
          ? serializeError(error.cause)
          : String(error.cause),
    }),
  };
};

export const deserializeError = ({ cause, ...error }: SerializedError): Error =>
  Object.assign(
    new Error(error.message, {
      cause:
        typeof cause === 'object' && cause ? deserializeError(cause) : cause,
    }),
    error,
  );
