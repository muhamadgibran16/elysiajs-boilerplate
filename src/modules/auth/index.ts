import { Elysia } from "elysia";
import { authMiddleware, requireAuth } from "../../middlewares/auth.middleware";
import { AuthController } from "./auth.controller";
import { AuthModel } from "./auth.model";

export const authRoutes = new Elysia({ prefix: "/auth" })
	.use(authMiddleware)
	.post("/register", AuthController.register, AuthModel.register)
	.post("/login", AuthController.login, AuthModel.login)
	.use(requireAuth)
	.get("/me", AuthController.getMe, AuthModel.getMe);
