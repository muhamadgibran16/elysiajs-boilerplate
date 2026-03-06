import { describe, it, expect, spyOn, afterEach } from 'bun:test';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
    afterEach(() => {
        // Mocks can be restored if needed
    });

    describe('getPaginatedUsers', () => {
        it('should return paginated users and meta response', async () => {
            const mockUsers = [{ id: '1', email: 'user1@example.com', name: 'User 1', role: 'USER', createdAt: new Date(), updatedAt: new Date() }];
            const mockMeta = { currentPage: 1, perPage: 10, totalPage: 1, totalCurrentPage: 1, totalData: 1 };

            const getPaginatedUsersSpy = spyOn(UsersService.prototype, 'getPaginatedUsers').mockResolvedValueOnce({
                users: mockUsers,
                meta: mockMeta
            });

            const query = { page: '1', limit: '10' };
            const response = await UsersController.getPaginatedUsers({ query });

            expect(response).toEqual({
                success: true,
                message: 'Users retrieved successfully',
                data: mockUsers,
                meta: mockMeta
            });
            expect(getPaginatedUsersSpy).toHaveBeenCalledWith(1, 10);
        });

        it('should use default pagination values if query is empty', async () => {
            const mockUsers = [{ id: '1', email: 'user1@example.com', name: 'User 1', role: 'USER', createdAt: new Date(), updatedAt: new Date() }];
            const mockMeta = { currentPage: 1, perPage: 10, totalPage: 1, totalCurrentPage: 1, totalData: 1 };

            const getPaginatedUsersSpy = spyOn(UsersService.prototype, 'getPaginatedUsers').mockResolvedValueOnce({
                users: mockUsers,
                meta: mockMeta
            });

            const query = {};
            const response = await UsersController.getPaginatedUsers({ query });

            expect(response.success).toBe(true);
            expect(getPaginatedUsersSpy).toHaveBeenCalledWith(1, 10);
        });
    });

    describe('getUserById', () => {
        it('should return 404 if user not found', async () => {
            const getUserByIdSpy = spyOn(UsersService.prototype, 'getUserById').mockResolvedValueOnce(null);

            const set = { status: 200 };
            const params = { id: '999' };

            const response = await UsersController.getUserById({ params, set });

            expect(set.status).toBe(404);
            expect(response).toEqual({
                success: false,
                message: 'User not found',
                errors: null
            });
            expect(getUserByIdSpy).toHaveBeenCalledWith('999');
        });

        it('should return user data if found', async () => {
            const mockUser = { id: '1', email: 'user1@example.com', name: 'User 1', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            const getUserByIdSpy = spyOn(UsersService.prototype, 'getUserById').mockResolvedValueOnce(mockUser);

            const set = { status: 200 };
            const params = { id: '1' };

            const response = await UsersController.getUserById({ params, set });

            expect(response).toEqual({
                success: true,
                message: 'User retrieved successfully',
                data: mockUser
            });
            expect(getUserByIdSpy).toHaveBeenCalledWith('1');
        });
    });

    describe('updateUser', () => {
        it('should return 404 if user not found', async () => {
            const updateUserSpy = spyOn(UsersService.prototype, 'updateUser').mockResolvedValueOnce({
                error: 'USER_NOT_FOUND',
                user: null
            });

            const set = { status: 200 };
            const params = { id: '999' };
            const body = { name: 'New Name' };

            const response = await UsersController.updateUser({ params, body, set });

            expect(set.status).toBe(404);
            expect(response).toEqual({
                success: false,
                message: 'User not found',
                errors: null
            });
            expect(updateUserSpy).toHaveBeenCalledWith('999', body);
        });

        it('should return 400 if email is already in use', async () => {
            const updateUserSpy = spyOn(UsersService.prototype, 'updateUser').mockResolvedValueOnce({
                error: 'EMAIL_ALREADY_IN_USE',
                user: null
            });

            const set = { status: 200 };
            const params = { id: '1' };
            const body = { email: 'used@example.com' };

            const response = await UsersController.updateUser({ params, body, set });

            expect(set.status).toBe(400);
            expect(response).toEqual({
                success: false,
                message: 'Email is already in use',
                errors: null
            });
            expect(updateUserSpy).toHaveBeenCalledWith('1', body);
        });

        it('should return updated user data on success', async () => {
            const mockUser = { id: '1', email: 'user1@example.com', name: 'New Name', role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            const updateUserSpy = spyOn(UsersService.prototype, 'updateUser').mockResolvedValueOnce({
                error: null,
                user: mockUser
            });

            const set = { status: 200 };
            const params = { id: '1' };
            const body = { name: 'New Name' };

            const response = await UsersController.updateUser({ params, body, set });

            expect(response).toEqual({
                success: true,
                message: 'User updated successfully',
                data: mockUser
            });
            expect(updateUserSpy).toHaveBeenCalledWith('1', body);
        });
    });

    describe('deleteUser', () => {
        it('should return 404 if user not found', async () => {
            const deleteUserSpy = spyOn(UsersService.prototype, 'deleteUser').mockResolvedValueOnce(false);

            const set = { status: 200 };
            const params = { id: '999' };

            const response = await UsersController.deleteUser({ params, set });

            expect(set.status).toBe(404);
            expect(response).toEqual({
                success: false,
                message: 'User not found',
                errors: null
            });
            expect(deleteUserSpy).toHaveBeenCalledWith('999');
        });

        it('should return 200 on successful deletion', async () => {
            const deleteUserSpy = spyOn(UsersService.prototype, 'deleteUser').mockResolvedValueOnce(true);

            const set = { status: 200 };
            const params = { id: '1' };

            const response = await UsersController.deleteUser({ params, set });

            expect(response).toEqual({
                success: true,
                message: 'User deleted successfully',
                data: null
            });
            expect(deleteUserSpy).toHaveBeenCalledWith('1');
        });
    });
});
