import { prisma } from '../../lib/prisma';

export class AuthRepository {
    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async createUser(data: any) {
        return prisma.user.create({
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            }
        });
    }
}
