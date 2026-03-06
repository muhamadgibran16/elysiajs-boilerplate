import { prisma } from '../../lib/prisma';

export class UsersRepository {
    async count() {
        return prisma.user.count();
    }

    async findMany(skip: number, take: number) {
        return prisma.user.findMany({
            skip,
            take,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async update(id: string, data: any) {
        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true,
            }
        });
    }

    async delete(id: string) {
        return prisma.user.delete({ where: { id } });
    }
}
