import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { NotFoundError, ConflictError } from '../../lib/app-error';

type MockedRepository = {
    [K in keyof UsersRepository]: ReturnType<typeof mock>;
};

describe('UsersService', () => {
    let mockUsersRepository: MockedRepository;
    let usersService: UsersService;

    beforeEach(() => {
        mockUsersRepository = {
            findMany: mock(),
            count: mock(),
            findById: mock(),
            findByEmail: mock(),
            update: mock(),
            delete: mock(),
        };
        usersService = new UsersService(mockUsersRepository as unknown as UsersRepository);
    });

    describe('getPaginatedUsers', () => {
        it('should return paginated users and meta formatting', async () => {
            const mockUsers = [
                { id: '1', name: 'User 1', email: 'user1@example.com', role: 'USER', createdAt: new Date() },
                { id: '2', name: 'User 2', email: 'user2@example.com', role: 'USER', createdAt: new Date() },
            ];
            mockUsersRepository.findMany.mockResolvedValueOnce(mockUsers);
            mockUsersRepository.count.mockResolvedValueOnce(15);

            const result = await usersService.getPaginatedUsers(2, 2);

            expect(mockUsersRepository.findMany).toHaveBeenCalledWith(2, 2);
            expect(mockUsersRepository.count).toHaveBeenCalled();
            expect(result.users).toEqual(mockUsers);
            expect(result.meta).toEqual({
                currentPage: 2,
                perPage: 2,
                totalCurrentPage: 2,
                totalPage: 8,
                totalData: 15,
            });
        });
    });

    describe('getUserById', () => {
        it('should return a user by id', async () => {
            const user = { id: '1', name: 'User 1', email: 'user1@example.com', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            mockUsersRepository.findById.mockResolvedValueOnce(user);

            const result = await usersService.getUserById('1');

            expect(mockUsersRepository.findById).toHaveBeenCalledWith('1');
            expect(result).toEqual(user);
        });

        it('should throw NotFoundError when user does not exist', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce(null);

            expect(usersService.getUserById('999')).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe('updateUser', () => {
        it('should throw NotFoundError if user does not exist', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce(null);

            expect(usersService.updateUser('1', { name: 'New Name' })).rejects.toBeInstanceOf(NotFoundError);
            expect(mockUsersRepository.update).not.toHaveBeenCalled();
        });

        it('should throw ConflictError if new email is taken', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce({ id: '1', email: 'old@example.com', name: 'Old User', role: 'USER', createdAt: new Date(), updatedAt: new Date() });
            mockUsersRepository.findByEmail.mockResolvedValueOnce({ id: '2', email: 'new@example.com', name: 'New User', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

            expect(usersService.updateUser('1', { email: 'new@example.com' })).rejects.toBeInstanceOf(ConflictError);
            expect(mockUsersRepository.update).not.toHaveBeenCalled();
        });

        it('should successfully update user properties', async () => {
            const existingUser = { id: '1', email: 'old@example.com', name: 'Old Name', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            mockUsersRepository.findById.mockResolvedValueOnce(existingUser);
            const updatedUser = { ...existingUser, name: 'New Name' };
            mockUsersRepository.update.mockResolvedValueOnce(updatedUser);

            const result = await usersService.updateUser('1', { name: 'New Name', email: 'old@example.com' });

            expect(result).toEqual(updatedUser);
            expect(mockUsersRepository.findByEmail).not.toHaveBeenCalled();
            expect(mockUsersRepository.update).toHaveBeenCalledWith('1', {
                email: 'old@example.com',
                name: 'New Name',
                role: 'USER',
            });
        });
    });

    describe('deleteUser', () => {
        it('should throw NotFoundError if user does not exist', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce(null);

            expect(usersService.deleteUser('1')).rejects.toBeInstanceOf(NotFoundError);
            expect(mockUsersRepository.delete).not.toHaveBeenCalled();
        });

        it('should delete user successfully', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce({ id: '1' });
            mockUsersRepository.delete.mockResolvedValueOnce(undefined);

            await usersService.deleteUser('1');

            expect(mockUsersRepository.delete).toHaveBeenCalledWith('1');
        });
    });
});
