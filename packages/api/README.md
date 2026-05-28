# @pillage-first/api

This package contains worker-api, event scheduler and "backend" controllers. Please refer to [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for more information.

## Registering new controllers

1. Create a controller using `createController` in `src/http/controllers`.
   - Define the route path, method, request params, request body, and `response` schema in the `createController` call.
   - Controller `path`, `query`, and `body` params are inferred from those colocated Zod schemas.
   - The controller return type is inferred from the success response schema.
   - Omit `response`/`responses` for no-content endpoints; they generate a `204` response.
2. Register the controller in `src/http/api-routes.ts`.
3. View the generated OpenAPI spec through the `swagger-ui` app in `apps/swagger-ui`.

### Example

```typescript
// src/http/controllers/my-controller.ts
export const getMyData = createController(
  '/my-path/:id',
  {
    summary: 'Get my data',
    requestParams: {
      path: z.strictObject({
        id: z.coerce.number(),
      }),
    },
    requestBody: z.strictObject({
      enabled: z.boolean(),
    }),
    response: myDataSchema,
  },
)(({ database, body, path }) => {
  const { id } = path; // id is typed from the colocated path schema
  const { enabled } = body; // body is typed from requestBody
  // ...
});
```

## Error handling

Throwing errors in controllers is the preferred way to stop execution. When an error is thrown, it is automatically caught by the API worker and sent to the frontend, where it is displayed as an error toast.
