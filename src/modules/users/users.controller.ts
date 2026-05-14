import { successResponse, metaResponse } from '../../lib/response';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import type {
    GetUsersQuery,
    GetByIdParams,
    UpdateUserParams,
    UpdateUserBody,
    DeleteUserParams,
} from './users.model';

const usersService = new UsersService(new UsersRepository());

export class UsersController {
    static async getPaginatedUsers({ query }: { query: GetUsersQuery }) {
        const page = parseInt(query.page ?? '1', 10) || 1;
        const limit = parseInt(query.limit ?? '10', 10) || 10;

        const { users, meta } = await usersService.getPaginatedUsers(page, limit);

        return metaResponse(users, meta, 'Users retrieved successfully');
    }

    static async getUserById({ params }: { params: GetByIdParams }) {
        const user = await usersService.getUserById(params.id);
        return successResponse(user, 'User retrieved successfully');
    }

    static async updateUser({ params, body }: { params: UpdateUserParams; body: UpdateUserBody }) {
        const user = await usersService.updateUser(params.id, body);
        return successResponse(user, 'User updated successfully');
    }

    static async deleteUser({ params }: { params: DeleteUserParams }) {
        await usersService.deleteUser(params.id);
        return successResponse(null, 'User deleted successfully');
    }
}
