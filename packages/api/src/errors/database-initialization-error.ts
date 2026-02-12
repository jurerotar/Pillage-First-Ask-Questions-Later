export class DatabaseInitializationError extends Error {
  constructor() {
    super();
    this.name = 'DatabaseInitializationError';
    this.message = 'We encountered an error when initializing the database.';
    Object.setPrototypeOf(this, DatabaseInitializationError.prototype);
  }
}
