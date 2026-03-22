import { successResponse, errorResponse } from "../../lib/response";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { AuthModel, RegisterBody, LoginBody } from "./auth.model";

const authService = new AuthService(new AuthRepository());

export class AuthController {
	static async register({ body, set }: { body: RegisterBody; set: any }) {
		const { error, user } = await authService.register(body);

		if (error === "EMAIL_ALREADY_EXISTS") {
			set.status = 400;
			return errorResponse("Email already exists");
		}

		set.status = 201;
		return successResponse({ user }, "User registered successfully");
	}

	static async login({
		body,
		set,
		jwt,
	}: {
		body: LoginBody;
		set: any;
		jwt: any;
	}) {
		const { error, user } = await authService.login(body);

		if (error || !user) {
			set.status = 401;
			return errorResponse("Invalid credentials");
		}

		// Generate JWT token
		const token = await jwt.sign({ id: user.id });

		return successResponse(
			{
				token,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				},
			},
			"Login successful",
		);
	}

	static getMe({ user }: any) {
		return successResponse({ user }, "Current user retrieved successfully");
	}
}
