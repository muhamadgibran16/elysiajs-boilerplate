import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let mockAuthRepository: any;
    let authService: AuthService;

    beforeEach(() => {
        mockAuthRepository = {
            findByEmail: mock(),
            createUser: mock(),
        };
        authService = new AuthService(mockAuthRepository);
    });

    describe('register', () => {
        it('should return error if email already exists', async () => {
            mockAuthRepository.findByEmail.mockResolvedValueOnce({ id: '1', email: 'test@example.com', name: 'Test User', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

            const result = await authService.register({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            });

            expect(result.error).toBe('EMAIL_ALREADY_EXISTS');
            expect(result.user).toBeNull();
            expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
        });

        it('should register a new user successfully', async () => {
            mockAuthRepository.findByEmail.mockResolvedValueOnce(null);
            const newUser = { id: '2', email: 'new@example.com', name: 'New User', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            mockAuthRepository.createUser.mockResolvedValueOnce(newUser);

            const result = await authService.register({
                email: 'new@example.com',
                password: 'password123',
                name: 'New User'
            });

            expect(result.error).toBeNull();
            expect(result.user).toEqual(newUser);
            expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
            expect(mockAuthRepository.createUser).toHaveBeenCalled();

            // Checking arguments passed to createUser
            const callArgs = mockAuthRepository.createUser.mock.calls[0][0];
            expect(callArgs.email).toBe('new@example.com');
            expect(callArgs.name).toBe('New User');
            // Password should be a hash, not 'password123'
            expect(callArgs.password).not.toBe('password123');
        });
    });

    describe('login', () => {
        it('should return INVALID_CREDENTIALS if user not found', async () => {
            mockAuthRepository.findByEmail.mockResolvedValueOnce(null);

            const result = await authService.login({ email: 'test@example.com', password: 'password123' });

            expect(result.error).toBe('INVALID_CREDENTIALS');
            expect(result.user).toBeNull();
        });

        it('should return INVALID_CREDENTIALS if password does not match', async () => {
            const hashedPassword = await Bun.password.hash('different_password');
            const existingUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER', createdAt: new Date(), updatedAt: new Date(), password: hashedPassword };
            mockAuthRepository.findByEmail.mockResolvedValueOnce(existingUser);

            const result = await authService.login({ email: 'test@example.com', password: 'password123' });

            expect(result.error).toBe('INVALID_CREDENTIALS');
            expect(result.user).toBeNull();
        });

        it('should login successfully and return user', async () => {
            const hashedPassword = await Bun.password.hash('password123');
            const existingUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER', createdAt: new Date(), updatedAt: new Date(), password: hashedPassword };
            mockAuthRepository.findByEmail.mockResolvedValueOnce(existingUser);

            const result = await authService.login({ email: 'test@example.com', password: 'password123' });

            expect(result.error).toBeNull();
            expect(result.user).toEqual(existingUser);
        });
    });
});
