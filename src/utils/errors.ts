/* eslint-disable max-classes-per-file */

import { Server } from 'interfaces/models/game/server';

export class CacheHydrationError extends Error {
  constructor(serverId: Server['id']) {
    super();
    this.name = 'CacheHydrationError';
    this.message = `One or more database entries are missing for server with id: ${serverId}.`;
  }
}

export class MissingServerError extends Error {
  constructor(serverSlug: Server['slug']) {
    super();
    this.name = 'MissingServerError';
    this.message = `Server with slug "${serverSlug}" does not exist. If you're accessing this server from an url, try accessing the server from the homepage, to make sure  the server still exists.`;
  }
}
