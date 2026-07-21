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
>(
  controller: Controller<TPath, TMethod, TOperation>,
): Route<Controller<TPath, TMethod, TOperation>> => ({
  path: controller.path,
  method: controller.method.toUpperCase(),
  controller,
});
