import { UsersRepository } from './users.repository';
import { metaPagination } from '../../lib/response';

export class UsersService {
    constructor(private usersRepository: UsersRepository) { }

    async getPaginatedUsers(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.usersRepository.findMany(skip, limit),
            this.usersRepository.count()
        ]);

        const meta = metaPagination(page, limit, users.length, total);

        return { users, meta };
    }

    async getUserById(id: string) {
        return this.usersRepository.findById(id);
    }

    async updateUser(id: string, body: any) {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            return { error: 'USER_NOT_FOUND', user: null };
        }

        const { email, name, role } = body;

        // Check unique email
        if (email && email !== existingUser.email) {
            const emailTaken = await this.usersRepository.findByEmail(email);
            if (emailTaken) {
                return { error: 'EMAIL_ALREADY_IN_USE', user: null };
            }
        }

        const updatedUser = await this.usersRepository.update(id, {
            email: email ?? existingUser.email,
            name: name ?? existingUser.name,
            role: role ?? existingUser.role,
        });

        return { error: null, user: updatedUser };
    }

    async deleteUser(id: string) {
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            return false;
        }

        await this.usersRepository.delete(id);
        return true;
    }
}
