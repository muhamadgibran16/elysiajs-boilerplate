import { Elysia } from 'elysia';
import { requireAuth } from '../../middlewares/auth.middleware';
import { UsersController } from './users.controller';
import { UsersModel } from './users.model';

export const userRoutes = new Elysia({ prefix: '/users' })
    .use(requireAuth)
    .get('/', UsersController.getPaginatedUsers, UsersModel.getPaginated)
    .get('/:id', UsersController.getUserById, UsersModel.getById)
    .put('/:id', UsersController.updateUser, UsersModel.update)
    .delete('/:id', UsersController.deleteUser, UsersModel.delete);
