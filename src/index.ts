import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { securityPlugin } from "./plugins/security";
import { authRoutes } from "./modules/auth";
import { userRoutes } from "./modules/users";
import { errorResponse } from "./lib/response";
import { ENV } from "./config/env-loader";

const app = new Elysia()
  // 1. Plugins
  .use(
    swagger({
      documentation: {
        info: {
          title: 'ElysiaJS Boilerplate API',
          version: '1.0.0',
          description: 'A robust boilerplate with Auth, User CRUD, and Security.',
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    })
  )
  .use(securityPlugin)

  // Global Error Handler
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return errorResponse('Validation Error', (error as any).all ?? (error as any).message);
    }
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return errorResponse('Route Not Found');
    }

    set.status = typeof set.status === 'number' && set.status !== 200 ? set.status : 500;
    return errorResponse((error as any).message || 'Internal Server Error');
  })

  // 2. Base Routes
  .get("/", () => Bun.file("src/views/index.html"))

  // 3. Application Routes
  .use(authRoutes)
  .use(userRoutes)

  .listen(ENV.PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
