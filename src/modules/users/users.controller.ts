import { successResponse, metaResponse, errorResponse } from '../../lib/response';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import {
    UsersModel,
    GetUsersQuery,
    GetByIdParams,
    UpdateUserParams,
    UpdateUserBody,
    DeleteUserParams
} from './users.model';

const usersService = new UsersService(new UsersRepository());

export class UsersController {
    static async getPaginatedUsers({ query }: { query: GetUsersQuery }) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;

        const { users, meta } = await usersService.getPaginatedUsers(page, limit);

        return metaResponse(users, meta, 'Users retrieved successfully');
    }

    static async getUserById({ params, set }: { params: GetByIdParams, set: any }) {
        const user = await usersService.getUserById(params.id);

        if (!user) {
            set.status = 404;
            return errorResponse('User not found');
        }

        return successResponse(user, 'User retrieved successfully');
    }

    static async updateUser({ params, body, set }: { params: UpdateUserParams, body: UpdateUserBody, set: any }) {
        const { error, user } = await usersService.updateUser(params.id, body);

        if (error === 'USER_NOT_FOUND') {
            set.status = 404;
            return errorResponse('User not found');
        }
        if (error === 'EMAIL_ALREADY_IN_USE') {
            set.status = 400;
            return errorResponse('Email is already in use');
        }

        return successResponse(user, 'User updated successfully');
    }

    static async deleteUser({ params, set }: { params: DeleteUserParams, set: any }) {
        const deleted = await usersService.deleteUser(params.id);

        if (!deleted) {
            set.status = 404;
            return errorResponse('User not found');
        }

        return successResponse(null, 'User deleted successfully');
    }
}
