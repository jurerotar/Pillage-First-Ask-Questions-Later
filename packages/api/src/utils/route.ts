import type { paths } from '../open-api.ts';
import type { Controller, Method } from './controller';

export type Route = {
  path: string;
  method: string;
  controller: Controller;
};

export const createRoute = <
  TPath extends keyof typeof paths,
  TMethod extends Method,
>(
  controller: Controller<TPath, TMethod>,
): Route => ({
  path: controller.path,
  method: controller.method.toUpperCase(),
  controller: controller as unknown as Controller<keyof typeof paths>,
});
