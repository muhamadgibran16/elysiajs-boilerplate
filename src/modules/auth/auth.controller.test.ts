import { describe, it, expect, spyOn, afterEach } from 'bun:test';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    afterEach(() => {
        // Restore all mocks after each test
        // Bun's spyOn mocks can be cleared or restored if needed
    });

    describe('register', () => {
        it('should return 400 if email already exists', async () => {
            const registerSpy = spyOn(AuthService.prototype, 'register').mockResolvedValueOnce({
                error: 'EMAIL_ALREADY_EXISTS',
                user: null
            });

            const set = { status: 200 };
            const body = { email: 'test@example.com', password: 'password', name: 'Test' };

            const response = await AuthController.register({ body, set });

            expect(set.status).toBe(400);
            expect(response).toEqual({
                success: false,
                message: 'Email already exists',
                errors: null
            });
            expect(registerSpy).toHaveBeenCalledWith(body);
        });

        it('should return 201 and user data on successful register', async () => {
            const mockUser = { id: '1', email: 'test@example.com', name: 'Test', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            const registerSpy = spyOn(AuthService.prototype, 'register').mockResolvedValueOnce({
                error: null,
                user: mockUser
            });

            const set = { status: 200 };
            const body = { email: 'test@example.com', password: 'password', name: 'Test' };

            const response = await AuthController.register({ body, set });

            expect(set.status).toBe(201);
            expect(response).toEqual({
                success: true,
                message: 'User registered successfully',
                data: { user: mockUser }
            });
            expect(registerSpy).toHaveBeenCalledWith(body);
        });
    });

    describe('login', () => {
        it('should return 401 on invalid credentials', async () => {
            const loginSpy = spyOn(AuthService.prototype, 'login').mockResolvedValueOnce({
                error: 'INVALID_CREDENTIALS',
                user: null
            });

            const set = { status: 200 };
            const body = { email: 'test@example.com', password: 'wrong' };
            const jwt = { sign: async () => 'mock_token' };

            const response = await AuthController.login({ body, set, jwt });

            expect(set.status).toBe(401);
            expect(response).toEqual({
                success: false,
                message: 'Invalid credentials',
                errors: null
            });
            expect(loginSpy).toHaveBeenCalledWith(body);
        });

        it('should return 200, token, and user data on successful login', async () => {
            const mockUser = { id: '1', email: 'test@example.com', name: 'Test', role: 'USER', createdAt: new Date(), updatedAt: new Date(), password: 'hashed_password' };
            const loginSpy = spyOn(AuthService.prototype, 'login').mockResolvedValueOnce({
                error: null,
                user: mockUser
            });

            const set = { status: 200 };
            const body = { email: 'test@example.com', password: 'password' };
            let tokenPayload: any;
            const jwt = {
                sign: async (payload: any) => {
                    tokenPayload = payload;
                    return 'mock_token';
                }
            };

            const response = await AuthController.login({ body, set, jwt });

            // Default status is 200 (not modified by controller for successful login)
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
                    }
                }
            });
            expect(tokenPayload).toEqual({ id: mockUser.id });
            expect(loginSpy).toHaveBeenCalledWith(body);
        });
    });

    describe('getMe', () => {
        it('should return current user data', () => {
            const user = { id: '1', email: 'test@example.com' };
            const response = AuthController.getMe({ user });

            expect(response).toEqual({
                success: true,
                message: 'Current user retrieved successfully',
                data: { user }
            });
        });
    });
});
