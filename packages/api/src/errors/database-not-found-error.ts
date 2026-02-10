export class DatabaseNotFoundError extends Error {
  constructor() {
    super();
    this.name = 'DatabaseNotFoundError';
    this.message = 'Game world database was not found.';
    Object.setPrototypeOf(this, DatabaseNotFoundError.prototype);
  }
}
