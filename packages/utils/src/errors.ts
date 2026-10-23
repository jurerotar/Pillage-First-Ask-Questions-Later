import type { SerializedError } from '@pillage-first/types/api-events';

export type ErrorWithContext = Error & Pick<SerializedError, 'context'>;

export class MissingGameWorldDatabaseError extends Error {
  static readonly name = 'MissingGameWorldDatabaseError';

  constructor() {
    super(
      'The database for this game world could not be found on this device.',
    );
    this.name = MissingGameWorldDatabaseError.name;
    Object.setPrototypeOf(this, MissingGameWorldDatabaseError.prototype);
  }
}

export class OutdatedAppVersionError extends Error {
  static readonly name = 'OutdatedAppVersionError';

  constructor() {
    super(
      'This game world was opened with a newer version of the app. Please refresh this page to load the latest version and continue playing.',
    );
    this.name = OutdatedAppVersionError.name;
    Object.setPrototypeOf(this, OutdatedAppVersionError.prototype);
  }
}

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
    ...((error as ErrorWithContext).context && {
      context: (error as ErrorWithContext).context,
    }),
    ...(error.stack && { stack: error.stack }),
    ...(error.cause !== undefined && {
      cause:
        error.cause instanceof Error
          ? serializeError(error.cause)
          : String(error.cause),
    }),
  };
};

export const deserializeError = ({
  cause,
  ...error
}: SerializedError): Error => {
  const constructors = [
    MissingGameWorldDatabaseError,
    OutdatedAppVersionError,
    OutdatedDatabaseSchemaError,
  ];
  const ErrorConstructor = constructors.find(({ name }) => name === error.name);
  const result = ErrorConstructor
    ? new ErrorConstructor()
    : new Error(error.message);

  return Object.assign(result, error, {
    cause: typeof cause === 'object' && cause ? deserializeError(cause) : cause,
  });
};
