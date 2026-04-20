export class GameWorldDoesNotExistError extends Error {
  constructor() {
    super();
    this.name = 'GameWorldDoesNotExistError';
    this.message = 'Database file for this game world does not exist.';
    Object.setPrototypeOf(this, GameWorldDoesNotExistError.prototype);
  }
}
