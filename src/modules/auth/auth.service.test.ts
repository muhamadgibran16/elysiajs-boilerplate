import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { ConflictError, UnauthorizedError } from '../../lib/app-error';

type MockedRepository = {
    [K in keyof AuthRepository]: ReturnType<typeof mock>;
};

describe('AuthService', () => {
    let mockAuthRepository: MockedRepository;
    let authService: AuthService;

    beforeEach(() => {
        mockAuthRepository = {
            findByEmail: mock(),
            createUser: mock(),
        };
        authService = new AuthService(mockAuthRepository as unknown as AuthRepository);
    });

    describe('register', () => {
        it('should throw ConflictError if email already exists', async () => {
            mockAuthRepository.findByEmail.mockResolvedValueOnce({ id: '1', email: 'test@example.com', name: 'Test User', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

            expect(
                authService.register({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
            ).rejects.toBeInstanceOf(ConflictError);
            expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
        });

        it('should register a new user successfully', async () => {
            mockAuthRepository.findByEmail.mockResolvedValueOnce(null);
            const newUser = { id: '2', email: 'new@example.com', name: 'New User', role: 'USER', createdAt: new Date() };
            mockAuthRepository.createUser.mockResolvedValueOnce(newUser);

            const result = await authService.register({
                email: 'new@example.com',
                password: 'password123',
                name: 'New User',
            });

            expect(result).toEqual(newUser);
            expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
            expect(mockAuthRepository.createUser).toHaveBeenCalled();

            const callArgs = mockAuthRepository.createUser.mock.calls[0][0];
            expect(callArgs.email).toBe('new@example.com');
            expect(callArgs.name).toBe('New User');
            expect(callArgs.password).not.toBe('password123');
        });
    });

    describe('login', () => {
        it('should throw UnauthorizedError if user not found', async () => {
            mockAuthRepository.findByEmail.mockResolvedValueOnce(null);

            expect(
                authService.login({ email: 'test@example.com', password: 'password123' }),
            ).rejects.toBeInstanceOf(UnauthorizedError);
        });

        it('should throw UnauthorizedError if password does not match', async () => {
            const hashedPassword = await Bun.password.hash('different_password');
            mockAuthRepository.findByEmail.mockResolvedValueOnce({
                id: '1', email: 'test@example.com', name: 'Test User', role: 'USER',
                createdAt: new Date(), updatedAt: new Date(), password: hashedPassword,
            });

            expect(
                authService.login({ email: 'test@example.com', password: 'password123' }),
            ).rejects.toBeInstanceOf(UnauthorizedError);
        });

        it('should login successfully and return user', async () => {
            const hashedPassword = await Bun.password.hash('password123');
            const existingUser = {
                id: '1', email: 'test@example.com', name: 'Test User', role: 'USER',
                createdAt: new Date(), updatedAt: new Date(), password: hashedPassword,
            };
            mockAuthRepository.findByEmail.mockResolvedValueOnce(existingUser);

            const result = await authService.login({ email: 'test@example.com', password: 'password123' });

            expect(result).toEqual(existingUser);
        });
    });
});
