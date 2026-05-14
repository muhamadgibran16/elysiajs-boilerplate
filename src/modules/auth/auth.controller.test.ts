import { describe, it, expect, spyOn } from 'bun:test';
import { AuthController, type JwtSigner, type ResponseSet } from './auth.controller';
import { AuthService } from './auth.service';
import { ConflictError, UnauthorizedError } from '../../lib/app-error';

describe('AuthController', () => {
    describe('register', () => {
        it('should propagate ConflictError if email already exists', async () => {
            spyOn(AuthService.prototype, 'register').mockRejectedValueOnce(new ConflictError('Email already exists'));

            const set: ResponseSet = { status: 200 };
            const body = { email: 'test@example.com', password: 'password', name: 'Test' };

            expect(AuthController.register({ body, set })).rejects.toBeInstanceOf(ConflictError);
        });

        it('should return 201 and user data on successful register', async () => {
            const mockUser = { id: '1', email: 'test@example.com', name: 'Test', role: 'USER', createdAt: new Date() };
            const registerSpy = spyOn(AuthService.prototype, 'register').mockResolvedValueOnce(mockUser);

            const set: ResponseSet = { status: 200 };
            const body = { email: 'test@example.com', password: 'password', name: 'Test' };

            const response = await AuthController.register({ body, set });

            expect(set.status).toBe(201);
            expect(response).toEqual({
                success: true,
                message: 'User registered successfully',
                data: { user: mockUser },
            });
            expect(registerSpy).toHaveBeenCalledWith(body);
        });
    });

    describe('login', () => {
        it('should propagate UnauthorizedError on invalid credentials', async () => {
            spyOn(AuthService.prototype, 'login').mockRejectedValueOnce(new UnauthorizedError('Invalid credentials'));

            const body = { email: 'test@example.com', password: 'wrong' };
            const jwt: JwtSigner = { sign: async () => 'mock_token' };

            expect(AuthController.login({ body, jwt })).rejects.toBeInstanceOf(UnauthorizedError);
        });

        it('should return token and user data on successful login', async () => {
            const mockUser = {
                id: '1', email: 'test@example.com', name: 'Test', role: 'USER',
                createdAt: new Date(), updatedAt: new Date(), password: 'hashed_password',
            };
            spyOn(AuthService.prototype, 'login').mockResolvedValueOnce(mockUser);

            const body = { email: 'test@example.com', password: 'password' };
            let tokenPayload: Record<string, string | number> | undefined;
            const jwt: JwtSigner = {
                sign: async (payload) => {
                    tokenPayload = payload;
                    return 'mock_token';
                },
            };

            const response = await AuthController.login({ body, jwt });

            expect(response).toEqual({
                success: true,
                message: 'Login successful',
                data: {
                    token: 'mock_token',
                    user: {
                        id: mockUser.id,
                        email: mockUser.email,
                        name: mockUser.name,
                        role: mockUser.role,
                    },
                },
            });
            expect(tokenPayload).toEqual({ id: mockUser.id });
        });
    });

    describe('getMe', () => {
        it('should return current user data', () => {
            const user = { id: '1', email: 'test@example.com', name: 'Test', role: 'USER' };
            const response = AuthController.getMe({ user });

            expect(response).toEqual({
                success: true,
                message: 'Current user retrieved successfully',
                data: { user },
            });
        });
    });
});
