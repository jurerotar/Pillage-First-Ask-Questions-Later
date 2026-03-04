import type { paths } from '../open-api';
import type { Controller, Method } from '../utils/controller';

export type Route<TPath extends keyof typeof paths = keyof typeof paths> = {
  path: TPath;
  method: string;
  controller: Controller;
};

export const createRoute = <
  TPath extends keyof typeof paths,
  TMethod extends Method,
>(
  controller: Controller<TPath, TMethod>,
): Route<TPath> => ({
  path: controller.path,
  method: controller.method.toUpperCase(),
  controller: controller as unknown as Controller<keyof typeof paths>,
});
