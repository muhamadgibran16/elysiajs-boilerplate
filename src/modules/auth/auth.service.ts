import { AuthRepository, type SafeUser } from './auth.repository';
import { ConflictError, UnauthorizedError } from '../../lib/app-error';
import type { LoginBody, RegisterBody } from './auth.model';

export interface AuthenticatedUserWithPassword extends SafeUser {
    password: string;
    updatedAt: Date;
}

export class AuthService {
    constructor(private authRepository: AuthRepository) {}

    async register(body: RegisterBody): Promise<SafeUser> {
        const { email, password, name } = body;

        const existingUser = await this.authRepository.findByEmail(email);
        if (existingUser) {
            throw new ConflictError('Email already exists');
        }

        const hashedPassword = await Bun.password.hash(password);

        return this.authRepository.createUser({
            email,
            password: hashedPassword,
            name: name ?? null,
        });
    }

    async login(body: LoginBody): Promise<AuthenticatedUserWithPassword> {
        const { email, password } = body;

        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const isPasswordValid = await Bun.password.verify(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        return user;
    }
}
