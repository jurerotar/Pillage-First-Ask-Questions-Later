import type { Controller, ControllerOperation, Method } from './controller';

type ControllerRouteMetadata = {
  path: string;
  method: Method;
  operation: ControllerOperation;
};

export type Route<
  TController extends ControllerRouteMetadata = ControllerRouteMetadata,
> = {
  path: TController['path'];
  method: string;
  controller: TController;
};

export const createRoute = <
  TPath extends string,
  TMethod extends Method,
  TOperation extends ControllerOperation,
  TReturn,
>(
  controller: Controller<TPath, TMethod, TOperation, TReturn>,
): Route<typeof controller> => ({
  path: controller.path,
  method: controller.method.toUpperCase(),
  controller,
});
