import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { prisma } from '../lib/prisma';
import { ENV } from '../config/env-loader';
import { UnauthorizedError } from '../lib/app-error';

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
    .use(
        jwt({
            name: 'jwt',
            secret: ENV.JWT_SECRET,
        }),
    )
    .derive({ as: 'scoped' }, async ({ jwt, headers }): Promise<{ user: AuthenticatedUser | null }> => {
        const authHeader = headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { user: null };
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return { user: null };
        }

        const payload = await jwt.verify(token);
        if (!payload || typeof payload.id !== 'string') {
            return { user: null };
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, email: true, name: true, role: true },
        });

        return { user };
    });

export const requireAuth = new Elysia({ name: 'require-auth' })
    .use(authMiddleware)
    .resolve({ as: 'scoped' }, ({ user }): { user: AuthenticatedUser } => {
        if (!user) {
            throw new UnauthorizedError('Unauthorized');
        }
        return { user };
    });
