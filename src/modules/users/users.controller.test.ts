import { describe, it, expect, spyOn } from 'bun:test';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotFoundError, ConflictError } from '../../lib/app-error';

describe('UsersController', () => {
    describe('getPaginatedUsers', () => {
        it('should return paginated users and meta response', async () => {
            const mockUsers = [{ id: '1', email: 'user1@example.com', name: 'User 1', role: 'USER', createdAt: new Date() }];
            const mockMeta = { currentPage: 1, perPage: 10, totalPage: 1, totalCurrentPage: 1, totalData: 1 };

            const getPaginatedUsersSpy = spyOn(UsersService.prototype, 'getPaginatedUsers').mockResolvedValueOnce({
                users: mockUsers,
                meta: mockMeta,
            });

            const query = { page: '1', limit: '10' };
            const response = await UsersController.getPaginatedUsers({ query });

            expect(response).toEqual({
                success: true,
                message: 'Users retrieved successfully',
                data: mockUsers,
                meta: mockMeta,
            });
            expect(getPaginatedUsersSpy).toHaveBeenCalledWith(1, 10);
        });

        it('should use default pagination values if query is empty', async () => {
            const mockUsers = [{ id: '1', email: 'user1@example.com', name: 'User 1', role: 'USER', createdAt: new Date() }];
            const mockMeta = { currentPage: 1, perPage: 10, totalPage: 1, totalCurrentPage: 1, totalData: 1 };

            const getPaginatedUsersSpy = spyOn(UsersService.prototype, 'getPaginatedUsers').mockResolvedValueOnce({
                users: mockUsers,
                meta: mockMeta,
            });

            const response = await UsersController.getPaginatedUsers({ query: {} });

            expect(response.success).toBe(true);
            expect(getPaginatedUsersSpy).toHaveBeenCalledWith(1, 10);
        });
    });

    describe('getUserById', () => {
        it('should propagate NotFoundError when user not found', async () => {
            spyOn(UsersService.prototype, 'getUserById').mockRejectedValueOnce(new NotFoundError('User not found'));

            expect(UsersController.getUserById({ params: { id: '999' } })).rejects.toBeInstanceOf(NotFoundError);
        });

        it('should return user data if found', async () => {
            const mockUser = { id: '1', email: 'user1@example.com', name: 'User 1', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            spyOn(UsersService.prototype, 'getUserById').mockResolvedValueOnce(mockUser);

            const response = await UsersController.getUserById({ params: { id: '1' } });

            expect(response).toEqual({
                success: true,
                message: 'User retrieved successfully',
                data: mockUser,
            });
        });
    });

    describe('updateUser', () => {
        it('should propagate NotFoundError when user not found', async () => {
            spyOn(UsersService.prototype, 'updateUser').mockRejectedValueOnce(new NotFoundError('User not found'));

            expect(
                UsersController.updateUser({ params: { id: '999' }, body: { name: 'New Name' } }),
            ).rejects.toBeInstanceOf(NotFoundError);
        });

        it('should propagate ConflictError when email already in use', async () => {
            spyOn(UsersService.prototype, 'updateUser').mockRejectedValueOnce(new ConflictError('Email is already in use'));

            expect(
                UsersController.updateUser({ params: { id: '1' }, body: { email: 'used@example.com' } }),
            ).rejects.toBeInstanceOf(ConflictError);
        });

        it('should return updated user data on success', async () => {
            const mockUser = { id: '1', email: 'user1@example.com', name: 'New Name', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            spyOn(UsersService.prototype, 'updateUser').mockResolvedValueOnce(mockUser);

            const response = await UsersController.updateUser({ params: { id: '1' }, body: { name: 'New Name' } });

            expect(response).toEqual({
                success: true,
                message: 'User updated successfully',
                data: mockUser,
            });
        });
    });

    describe('deleteUser', () => {
        it('should propagate NotFoundError when user not found', async () => {
            spyOn(UsersService.prototype, 'deleteUser').mockRejectedValueOnce(new NotFoundError('User not found'));

            expect(UsersController.deleteUser({ params: { id: '999' } })).rejects.toBeInstanceOf(NotFoundError);
        });

        it('should return success response on deletion', async () => {
            spyOn(UsersService.prototype, 'deleteUser').mockResolvedValueOnce(undefined);

            const response = await UsersController.deleteUser({ params: { id: '1' } });

            expect(response).toEqual({
                success: true,
                message: 'User deleted successfully',
                data: null,
            });
        });
    });
});
