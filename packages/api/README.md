# @pillage-first/api

This package contains worker-api, event scheduler and "backend" controllers. Please refer to [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for more information.

## Registering new controllers

1. Create a controller using `createController` in `src/controllers`.
2. Register the controller in `src/routes/api-routes.ts`.
3. Manually add the endpoint and its Zod schema to the OpenAPI spec in `src/open-api.ts`.
   - Controller `path`, `query`, and `body` params are automatically typed via Zod by matching the path and method in `src/open-api.ts`.
4. View the OpenAPI spec through the `swagger-ui` app in `apps/swagger-ui`.

### Example

```typescript
// src/controllers/my-controller.ts
export const getMyData = createController(
  '/my-path/:id',
)(({ database, path }) => {
  const { id } = path; // id is typed as string/number based on open-api.ts
  // ...
});
```

## Error handling

Throwing errors in controllers is the preferred way to stop execution. When an error is thrown, it is automatically caught by the API worker and sent to the frontend, where it is displayed as an error toast.
