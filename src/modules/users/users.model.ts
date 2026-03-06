import { t, UnwrapSchema } from 'elysia';

export const UsersModel = {
    getPaginated: {
        query: t.Object({
            page: t.Optional(t.String()),
            limit: t.Optional(t.String())
        }),
        detail: { tags: ['Users'], description: 'Get paginated list of users', security: [{ bearerAuth: [] }] }
    },
    getById: {
        params: t.Object({ id: t.String() }),
        detail: { tags: ['Users'], description: 'Get a user by ID', security: [{ bearerAuth: [] }] }
    },
    update: {
        params: t.Object({ id: t.String() }),
        body: t.Object({
            email: t.Optional(t.String({ format: 'email' })),
            name: t.Optional(t.String()),
            role: t.Optional(t.String())
        }),
        detail: { tags: ['Users'], description: 'Update a user by ID', security: [{ bearerAuth: [] }] }
    },
    delete: {
        params: t.Object({ id: t.String() }),
        detail: { tags: ['Users'], description: 'Delete a user by ID', security: [{ bearerAuth: [] }] }
    }
};

export type GetUsersQuery = UnwrapSchema<typeof UsersModel.getPaginated.query>;
export type GetByIdParams = UnwrapSchema<typeof UsersModel.getById.params>;
export type UpdateUserParams = UnwrapSchema<typeof UsersModel.update.params>;
export type UpdateUserBody = UnwrapSchema<typeof UsersModel.update.body>;
export type DeleteUserParams = UnwrapSchema<typeof UsersModel.delete.params>;
