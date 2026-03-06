import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { prisma } from '../lib/prisma';

export const authMiddleware = (app: Elysia) =>
    app.use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'super-secret-key-change-me',
    }))
        .derive(async ({ jwt, headers }) => {
            const authHeader = headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { user: null };
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return { user: null };
            }

            const payload = await jwt.verify(token);
            if (!payload || !payload.id) {
                return { user: null };
            }

            const user = await prisma.user.findUnique({
                where: { id: payload.id as string },
                select: { id: true, email: true, name: true, role: true },
            });

            return { user };
        });

export const requireAuth = (app: Elysia) =>
    app.use(authMiddleware)
        .onBeforeHandle(({ user }) => {
            if (!user) {
                return new Response(JSON.stringify({ message: "Unauthorized" }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        });
