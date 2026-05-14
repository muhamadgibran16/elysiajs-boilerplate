import { UsersRepository, type PublicUser, type ListUser } from './users.repository';
import { metaPagination, type MetaPagination } from '../../lib/response';
import { NotFoundError, ConflictError } from '../../lib/app-error';
import type { UpdateUserBody } from './users.model';

export interface PaginatedUsers {
    users: ListUser[];
    meta: MetaPagination;
}

export class UsersService {
    constructor(private usersRepository: UsersRepository) {}

    async getPaginatedUsers(page: number, limit: number): Promise<PaginatedUsers> {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.usersRepository.findMany(skip, limit),
            this.usersRepository.count(),
        ]);

        const meta = metaPagination(page, limit, users.length, total);

        return { users, meta };
    }

    async getUserById(id: string): Promise<PublicUser> {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user;
    }

    async updateUser(id: string, body: UpdateUserBody): Promise<PublicUser> {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new NotFoundError('User not found');
        }

        const { email, name, role } = body;

        if (email && email !== existingUser.email) {
            const emailTaken = await this.usersRepository.findByEmail(email);
            if (emailTaken) {
                throw new ConflictError('Email is already in use');
            }
        }

        return this.usersRepository.update(id, {
            email: email ?? existingUser.email,
            name: name ?? existingUser.name,
            role: role ?? existingUser.role,
        });
    }

    async deleteUser(id: string): Promise<void> {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new NotFoundError('User not found');
        }

        await this.usersRepository.delete(id);
    }
}
