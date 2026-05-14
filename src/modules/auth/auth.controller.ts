import { successResponse } from '../../lib/response';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import type { RegisterBody, LoginBody } from './auth.model';
import type { AuthenticatedUser } from '../../middlewares/auth.middleware';

const authService = new AuthService(new AuthRepository());

export interface JwtSigner {
    sign: (payload: Record<string, string | number>) => Promise<string>;
}

export interface ResponseSet {
    status?: number | string;
}

export class AuthController {
    static async register({ body, set }: { body: RegisterBody; set: ResponseSet }) {
        const user = await authService.register(body);
        set.status = 201;
        return successResponse({ user }, 'User registered successfully');
    }

    static async login({ body, jwt }: { body: LoginBody; jwt: JwtSigner }) {
        const user = await authService.login(body);

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
            'Login successful',
        );
    }

    static getMe({ user }: { user: AuthenticatedUser }) {
        return successResponse({ user }, 'Current user retrieved successfully');
    }
}
