import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { UsersService } from './users.service';

describe('UsersService', () => {
    let mockUsersRepository: any;
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
        usersService = new UsersService(mockUsersRepository);
    });

    describe('getPaginatedUsers', () => {
        it('should return paginated users and meta formatting', async () => {
            const mockUsers = [
                { id: '1', name: 'User 1', email: 'user1@example.com', role: 'USER', createdAt: new Date(), updatedAt: new Date() },
                { id: '2', name: 'User 2', email: 'user2@example.com', role: 'USER', createdAt: new Date(), updatedAt: new Date() }
            ];
            mockUsersRepository.findMany.mockResolvedValueOnce(mockUsers);
            mockUsersRepository.count.mockResolvedValueOnce(15);

            const result = await usersService.getPaginatedUsers(2, 2);

            expect(mockUsersRepository.findMany).toHaveBeenCalledWith(2, 2); // skip = (2-1)*2 = 2, take = 2
            expect(mockUsersRepository.count).toHaveBeenCalled();
            expect(result.users).toEqual(mockUsers);
            expect(result.meta).toEqual({
                currentPage: 2,
                perPage: 2,
                totalCurrentPage: 2,
                totalPage: 8, // 15 / 2 = 7.5 -> 8
                totalData: 15
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
    });

    describe('updateUser', () => {
        it('should return USER_NOT_FOUND if user does not exist', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce(null);

            const result = await usersService.updateUser('1', { name: 'New Name' });

            expect(result.error).toBe('USER_NOT_FOUND');
            expect(result.user).toBeNull();
            expect(mockUsersRepository.update).not.toHaveBeenCalled();
        });

        it('should return EMAIL_ALREADY_IN_USE if new email is taken', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce({ id: '1', email: 'old@example.com', name: 'Old User', role: 'USER', createdAt: new Date(), updatedAt: new Date() });
            mockUsersRepository.findByEmail.mockResolvedValueOnce({ id: '2', email: 'new@example.com', name: 'New User', role: 'USER', createdAt: new Date(), updatedAt: new Date() });

            const result = await usersService.updateUser('1', { email: 'new@example.com' });

            expect(result.error).toBe('EMAIL_ALREADY_IN_USE');
            expect(result.user).toBeNull();
            expect(mockUsersRepository.update).not.toHaveBeenCalled();
        });

        it('should successfully update user properties', async () => {
            const existingUser = { id: '1', email: 'old@example.com', name: 'Old Name', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            mockUsersRepository.findById.mockResolvedValueOnce(existingUser);
            // Updating email, but to the same one
            const updatedUser = { ...existingUser, name: 'New Name' };
            mockUsersRepository.update.mockResolvedValueOnce(updatedUser);

            const result = await usersService.updateUser('1', { name: 'New Name', email: 'old@example.com' });

            expect(result.error).toBeNull();
            expect(result.user).toEqual(updatedUser);
            expect(mockUsersRepository.findByEmail).not.toHaveBeenCalled(); // Fast path if email hasn't changed
            expect(mockUsersRepository.update).toHaveBeenCalledWith('1', {
                email: 'old@example.com',
                name: 'New Name',
                role: 'USER'
            });
        });
    });

    describe('deleteUser', () => {
        it('should return false if user does not exist', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce(null);

            const result = await usersService.deleteUser('1');

            expect(result).toBe(false);
            expect(mockUsersRepository.delete).not.toHaveBeenCalled();
        });

        it('should return true if deleted successfully', async () => {
            mockUsersRepository.findById.mockResolvedValueOnce({ id: '1' });
            mockUsersRepository.delete.mockResolvedValueOnce(true);

            const result = await usersService.deleteUser('1');

            expect(result).toBe(true);
            expect(mockUsersRepository.delete).toHaveBeenCalledWith('1');
        });
    });
});
