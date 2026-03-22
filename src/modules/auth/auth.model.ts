import { t, UnwrapSchema } from "elysia";

export const AuthModel = {
	register: {
		body: t.Object({
			email: t.String({ format: "email" }),
			password: t.String({ minLength: 6 }),
			name: t.Optional(t.String()),
		}),
		detail: { tags: ["Auth"], description: "Register a new user" },
	},
	login: {
		body: t.Object({
			email: t.String({ format: "email" }),
			password: t.String(),
		}),
		detail: { tags: ["Auth"], description: "Login and acquire JWT token" },
	},
	getMe: {
		detail: {
			tags: ["Auth"],
			description: "Get details of authenticated user",
			security: [{ bearerAuth: [] }],
		},
	},
};

export type RegisterBody = UnwrapSchema<typeof AuthModel.register.body>;
export type LoginBody = UnwrapSchema<typeof AuthModel.login.body>;
