export const databasePath = '/world.sqlite3';

export type ControllerRequest = {
  type: 'request';
  url: string;
  method: string;
  body?: unknown;
  notifications?: boolean;
};
export type AdvanceRequest = {
  type: 'advance';
  now: number;
  limit?: number;
  notifications?: boolean;
};
export type EngineRequest = ControllerRequest | AdvanceRequest;
export type EngineResponse = {
  data?: unknown;
  notifications: unknown[];
  nextDeadline: number | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseRequest = (json: string): EngineRequest => {
  const value: unknown = JSON.parse(json);
  if (
    !isRecord(value) ||
    (value.notifications !== undefined &&
      typeof value.notifications !== 'boolean')
  ) {
    throw new Error('Invalid engine request');
  }
  const notifications = value.notifications;
  if (
    value.type === 'request' &&
    typeof value.url === 'string' &&
    typeof value.method === 'string'
  ) {
    return {
      type: value.type,
      url: value.url,
      method: value.method,
      body: value.body,
      notifications,
    };
  }
  if (
    value.type === 'advance' &&
    typeof value.now === 'number' &&
    Number.isFinite(value.now) &&
    (value.limit === undefined ||
      (typeof value.limit === 'number' &&
        Number.isInteger(value.limit) &&
        value.limit >= 0))
  ) {
    return {
      type: value.type,
      now: value.now,
      limit: value.limit,
      notifications,
    };
  }
  throw new Error('Invalid engine request');
};

const isResponse = (value: unknown): value is EngineResponse =>
  isRecord(value) &&
  Array.isArray(value.notifications) &&
  (value.nextDeadline === null ||
    (typeof value.nextDeadline === 'number' &&
      Number.isFinite(value.nextDeadline)));

export const parseResponse = (json: string): EngineResponse => {
  const value: unknown = JSON.parse(json);
  if (isRecord(value) && typeof value.error === 'string' && value.error) {
    throw new Error(value.error);
  }
  if (!isResponse(value)) {
    throw new Error('Invalid engine response');
  }
  return value;
};
