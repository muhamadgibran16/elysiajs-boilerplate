import { prisma } from '../../lib/prisma';
import type { Prisma } from '../../generated/prisma/client';

const safeUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
} as const;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;

export class AuthRepository {
    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async createUser(data: Prisma.UserCreateInput): Promise<SafeUser> {
        return prisma.user.create({
            data,
            select: safeUserSelect,
        });
    }
}
