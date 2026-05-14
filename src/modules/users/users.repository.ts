import { prisma } from '../../lib/prisma';
import type { Prisma } from '../../generated/prisma/client';

const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} as const;

const listUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
} as const;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
export type ListUser = Prisma.UserGetPayload<{ select: typeof listUserSelect }>;

export class UsersRepository {
    async count(): Promise<number> {
        return prisma.user.count();
    }

    async findMany(skip: number, take: number): Promise<ListUser[]> {
        return prisma.user.findMany({
            skip,
            take,
            select: listUserSelect,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string): Promise<PublicUser | null> {
        return prisma.user.findUnique({
            where: { id },
            select: publicUserSelect,
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<PublicUser> {
        return prisma.user.update({
            where: { id },
            data,
            select: publicUserSelect,
        });
    }

    async delete(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }
}
